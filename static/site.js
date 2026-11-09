// Small, dependency-free enhancements: theme toggle, copy buttons, ⌘K search.
(function () {
  "use strict";

  /* ---------- Theme toggle: system → light → dark ---------- */
  var root = document.documentElement;
  var order = ["system", "light", "dark"];

  function current() {
    return root.dataset.theme || "system";
  }

  function apply(mode) {
    if (mode === "system") delete root.dataset.theme;
    else root.dataset.theme = mode;
    try {
      if (mode === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", mode);
    } catch (e) {}
    var l = document.getElementById("hl-light"), d = document.getElementById("hl-dark");
    if (l && d) {
      l.media = mode === "system" ? "(prefers-color-scheme: light)" : mode === "light" ? "all" : "not all";
      d.media = mode === "system" ? "(prefers-color-scheme: dark)" : mode === "dark" ? "all" : "not all";
    }
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
      b.dataset.mode = mode;
      b.setAttribute("aria-label", "Theme: " + mode);
      b.title = "Theme: " + mode;
    });
  }

  /* ---------- Copy buttons on code blocks ---------- */
  function addCopyButtons() {
    document.querySelectorAll(".prose pre").forEach(function (pre) {
      if (pre.parentNode.classList.contains("code-wrap")) return;
      var wrap = document.createElement("div");
      wrap.className = "code-wrap";
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy";
      btn.textContent = "Copy";
      btn.addEventListener("click", function () {
        var text = (pre.querySelector("code") || pre).innerText.replace(/\n$/, "");
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = "Copied";
          btn.classList.add("done");
          setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("done"); }, 1500);
        });
      });
      wrap.appendChild(btn);
    });
  }

  /* ---------- Search (Zola's built-in elasticlunr index, loaded on first open) ---------- */
  var dialog, input, results, index, loading, selected = -1;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function loadIndex() {
    if (index) return Promise.resolve(index);
    if (!loading) {
      var assets = window.SEARCH_ASSETS || [];
      loading = loadScript(assets[0])
        .then(function () { return loadScript(assets[1]); })
        .then(function () { index = elasticlunr.Index.load(window.searchIndex); return index; });
    }
    return loading;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function snippet(body, terms) {
    body = (body || "").replace(/🔗/g, ""); // heading anchor glyphs end up in the index
    var lower = body.toLowerCase(), at = -1;
    for (var i = 0; i < terms.length && at < 0; i++) at = lower.indexOf(terms[i]);
    var start = Math.max(0, at - 50);
    var text = (start > 0 ? "…" : "") + body.slice(start, start + 180) + (body.length > start + 180 ? "…" : "");
    var html = escapeHtml(text);
    terms.forEach(function (t) {
      if (t.length < 2) return;
      html = html.replace(new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"), "<mark>$1</mark>");
    });
    return html;
  }

  function render(q) {
    q = q.trim();
    selected = -1;
    if (!q) { results.innerHTML = ""; return; }
    loadIndex().then(function (idx) {
      if (input.value.trim() !== q) return;
      var hits = idx.search(q, {
        bool: "AND",
        expand: true,
        fields: { title: { boost: 3 }, description: { boost: 2 }, body: { boost: 1 } }
      }).slice(0, 8);
      var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      if (!hits.length) {
        results.innerHTML = '<li class="empty">No results for “' + escapeHtml(q) + '”</li>';
        return;
      }
      results.innerHTML = hits.map(function (h) {
        var doc = idx.documentStore.getDoc(h.ref) || {};
        var href = h.ref;
        try { href = new URL(h.ref).pathname; } catch (e) {} // stay on the current origin
        return '<li><a role="option" href="' + escapeHtml(href) + '"><strong>' +
          escapeHtml(doc.title || h.ref) + "</strong><span>" +
          snippet(doc.body || doc.description, terms) + "</span></a></li>";
      }).join("");
    });
  }

  function move(delta) {
    var links = results.querySelectorAll("a");
    if (!links.length) return;
    selected = (selected + delta + links.length) % links.length;
    links.forEach(function (a, i) { a.setAttribute("aria-selected", i === selected ? "true" : "false"); });
    links[selected].scrollIntoView({ block: "nearest" });
  }

  function openSearch() {
    if (!dialog || dialog.open) return;
    dialog.showModal();
    input.select();
    loadIndex();
  }

  function initSearch() {
    dialog = document.getElementById("search");
    input = document.getElementById("search-input");
    results = document.getElementById("search-results");
    if (!dialog) return;

    input.addEventListener("input", function () { render(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") {
        e.preventDefault();
        var links = results.querySelectorAll("a");
        var target = links[selected >= 0 ? selected : 0];
        if (target) window.location.href = target.href;
      }
    });
    // Click on the backdrop closes the dialog.
    dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
    document.querySelectorAll("[data-search-open]").forEach(function (b) {
      b.addEventListener("click", openSearch);
    });
    document.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openSearch(); }
      else if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) {
        e.preventDefault(); openSearch();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    apply(current());
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
      b.addEventListener("click", function () {
        apply(order[(order.indexOf(current()) + 1) % order.length]);
      });
    });
    addCopyButtons();
    initSearch();
  });
})();
