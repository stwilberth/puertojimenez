# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Use `pnpm` (not npm) for all package operations.

```sh
pnpm dev          # Start dev server at localhost:4321
pnpm build        # Build to ./dist/
pnpm preview      # Preview production build locally
pnpm astro check  # TypeScript/Astro type checking
```

## Architecture

This is an **Astro 5 static site** — a tourism guide for Puerto Jiménez, Costa Rica. All pages are statically generated (SSG).

**Integrations:** Tailwind CSS, React (for interactive components), astro-icon (Font Awesome 6 solid/regular icon sets).

### Content

Two content collection types defined in `src/content/config.ts`:
- **`artists`** — Local artisans, each a `.md` file with frontmatter: `name`, `description`, `experience`, `specialty[]`, `image`, `productsImage`, `email`, `order`.
- **`restaurants`** — Restaurant entries with `title`, `description`, `pubDate`, `author`, `tags[]`.

JSON data files in `src/data/` (`hotels.json`, `activities.json`, `guides.json`, `transportation.json`, `craftsman.json`) are imported directly into `.astro` pages — these are not content collections.

### Image Handling

Astro image optimization requires static imports. Images for content collections are stored in `src/assets/` and must be **manually imported** in the consuming page and mapped by filename. See `src/pages/index.astro` for the `imageMap` pattern: the `image` field in artist markdown stores a filename string, which pages resolve to the actual imported asset.

### Layouts & Components

`src/layouts/Layout.astro` is the base layout wrapping every page — it includes `<Nav>`, `<Footer>`, `<WhatsAppButton>`, `<GoogleTagManager>`, dark mode initialization (via `localStorage.theme`), Google Fonts (Roboto), and AdSense.

`Nav` is included per-page (inside `<Layout>`) rather than inside the layout itself.

### Dynamic Routes

`src/pages/restaurants/[...slug].astro` uses `getStaticPaths()` to generate one page per restaurant collection entry.

### Third-party Scripts (CDN)

Swiper.js is loaded via CDN (`is:inline`) on pages that use sliders — not bundled through npm even though it is listed as a dependency.
