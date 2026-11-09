# Personal website

A personal site and blog built with [Zola](https://www.getzola.org), a single binary with no other dependencies.
Builds take milliseconds. The pages themselves have no frameworks, web fonts or trackers, just HTML, one CSS file and a small script.

## Everyday use

```bash
zola serve            # preview at http://127.0.0.1:1111, reloads as you save
zola serve --drafts   # include posts marked draft = true
zola build            # build the site into public/
```

Install Zola once with `brew install zola`.

## Writing a post

Create a Markdown file in `content/blog/`, for example `content/blog/my-post.md`:

```toml
+++
title = "My post"
date = 2026-11-09
description = "One sentence for lists, search and link previews."
# draft = true        # uncomment to keep it off the live site

[taxonomies]
tags = ["notes"]
+++

Write in **Markdown** here.
```

Images can sit next to the post: make a folder `content/blog/my-post/` with an `index.md` and the image files, then use `![alt](photo.jpg)`.

## Making it yours

- `zola.toml`: site title, description, and under `[extra]` your name, tagline, email, links and navigation.
- `content/about.md`: the About page.
- `static/style.css`: all styling. Colours are CSS variables at the top, with a dark-mode set below them.
- `static/favicon.svg`: the tab icon.
- `templates/`: page layouts (Zola 0.23 uses Tera 2 templates).

## Features

- Blog with posts grouped by year, reading time and older/newer links
- Tags, each with its own page and feed
- Full-text search: press ⌘K, Ctrl+K or `/`. Zola builds the index; nothing extra to install.
- Light, dark or system theme, remembered per visitor
- Syntax highlighting with matching light and dark themes, plus copy buttons on code blocks
- Smooth page transitions in pure CSS (Chrome and Safari; other browsers navigate normally)
- Atom feed (`/atom.xml`), sitemap, canonical URLs and Open Graph tags

## Publishing on GitHub Pages

1. Create a repository on GitHub. Name it `<your-username>.github.io` to serve the site at that address, or use any name to serve it at `<your-username>.github.io/<repo>/`.
2. Push this folder to the `main` branch.
3. On GitHub, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.

From then on, every push to `main` builds and publishes the site through `.github/workflows/deploy.yml`. The workflow sets the correct URL automatically. Update `ZOLA_VERSION` in that file when you upgrade Zola locally.
