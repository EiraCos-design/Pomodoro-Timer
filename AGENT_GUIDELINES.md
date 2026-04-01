# Agent Guidelines

Rules for AI agents contributing to this repository.

This document defines how any AI assistant (Claude, GPT-4, Gemini, Copilot, etc.)
should behave when working on this codebase. It exists to maintain the integrity,
simplicity, and philosophy of the boilerplate across sessions and contributors.

---

## Core principles

These are non-negotiable. Every other rule flows from them.

1. **No dependencies.** Do not introduce any external libraries, frameworks, fonts, CDN links, or third-party scripts. Every file must work with nothing but a modern browser.
2. **No build step.** The repository must remain openable by double-clicking `index.html`. Do not add `package.json`, bundlers, transpilers, or compiled assets.
3. **Preserve existing structure.** Do not reorganise files, rename existing sections, or refactor working code unless explicitly asked.
4. **Make the smallest change that solves the problem.** Do not add abstractions, utility layers, or "nice-to-have" improvements beyond the scope of the request.

---

## File-by-file rules

### `index.html`

- Use semantic HTML5 elements. Prefer `<section>`, `<article>`, `<nav>`, `<main>`, `<header>`, `<footer>`, `<aside>` over generic `<div>` containers.
- New sections go inside `<main>`, above the closing `</main>` tag.
- Every new section must have an `id`, a heading, and `aria-labelledby` pointing to that heading.
- Do not remove the skip link (`<a href="#main-content" class="skip-link">`).
- Do not remove the `<meta charset>` or `<meta name="viewport">` tags.
- Do not add inline `<style>` blocks except in `404.html` for page-specific one-off rules.
- Add new `<script>` tags at the bottom of `<body>`, after `main.js`.
- Keep the HTML well-indented. Use 2-space or consistent indentation.

### `css/style.css`

- Add new component styles as a **new numbered section** at the bottom of the file, following the existing section header format:
  ```css
  /* ============================================================
     16. YOUR NEW COMPONENT
     ============================================================ */
  ```
- Do not modify the design tokens in Section 1 unless the user explicitly asks to change the theme.
- Always use design token variables (`var(--color-primary)`) instead of hardcoded values.
- Do not add vendor prefixes that are no longer necessary for modern browsers (Chrome/Firefox/Safari/Edge last 2 versions).
- Do not use `!important` except in `.hidden` and `.sr-only` (already present).
- Mobile-first: write base styles for small screens, then use `@media (min-width: …)` to scale up.
- Maintain the `@media (prefers-reduced-motion: reduce)` section — do not remove it.

### `js/main.js`

- All new behaviour must be in an isolated function (e.g. `function initMyFeature() { … }`).
- Every function must start with a guard: `if (!element) return;` — fail gracefully if the expected DOM element is absent.
- Every new function must be called from `init()`.
- Use the utility helpers (`qs`, `qsa`, `on`, `debounce`, `trapFocus`) — do not duplicate their logic.
- Do not use `var`. Use `const` and `let` appropriately.
- Do not use jQuery or any other library.
- Do not use `eval()`, `innerHTML` with unsanitised user input, or other unsafe patterns.
- Comment intent, not implementation: explain *why* something is done, not *what* is happening if the code is self-explanatory.
- Do not use ES modules (`import`/`export`) unless you explain the local testing implications to the user (modules require a server to work, they will not work over `file://` in all browsers).

### `manifest.json`

- Only update if the user asks to configure PWA options.
- Keep `start_url` as `"./"` unless the site is deployed at a known sub-path.
- Do not add fields that aren't part of the Web App Manifest spec.

### `service-worker.js`

- Increment `CACHE_VERSION` if any cached asset filenames change.
- Keep the fetch strategy as Cache-First unless the user explicitly wants a different strategy.
- Do not cache cross-origin requests.
- If adding new pages or assets, add them to `CACHE_URLS`.

### `404.html`

- Keep it minimal. The purpose is a friendly error page, not a full feature.
- It must link back to `index.html`.
- It shares the same `css/style.css` — do not duplicate styles.

---

## Code quality rules

### Comments

- Write comments for every non-trivial function and every CSS section.
- Use the section header comment format already established in `style.css` and `main.js`.
- When adding a new HTML section, add a comment block explaining what it is for.
- Do not remove existing comments unless they are factually wrong.

### Naming

- CSS class names: lowercase, hyphenated (BEM-inspired but not strictly BEM). Example: `.card-title`, `.btn--primary`, `.site-nav`.
- JavaScript: camelCase for variables and functions. Example: `initMobileNav`, `showFieldError`.
- HTML IDs: lowercase hyphenated. Example: `#main-content`, `#contact-form`, `#footer-year`.

### Accessibility (mandatory)

Every addition must:

- Use semantic elements where possible
- Include visible `:focus-visible` styles for any new interactive element
- Use ARIA only where native HTML semantics are insufficient
- Not break keyboard navigation
- Not remove or degrade existing reduced-motion support
- Maintain colour contrast ratios of at least 4.5:1 for normal text

### Responsiveness (mandatory)

Every new layout component must:

- Work on viewports as narrow as 320px
- Use relative units (`rem`, `em`, `%`, `vw/vh`) rather than fixed pixel dimensions for layout
- Rely on existing design token spacing values where possible
- Test at mobile, tablet, and desktop widths conceptually before finalising

---

## Things never to do

| Action | Reason |
|---|---|
| Add `<script src="https://cdn.anything.com/…">` | Breaks offline; introduces supply chain risk |
| Add `@import url('https://fonts.googleapis.com/…')` | External dependency, privacy concern |
| Use `document.write()` | Legacy API; blocks parsing |
| Use `innerHTML` with unescaped user input | XSS vulnerability |
| Introduce TypeScript, JSX, or compiled syntax | Breaks the no-build constraint |
| Add a `package.json` | Implies a build step exists |
| Create new abstraction layers "for future flexibility" | YAGNI — keep complexity proportional to actual needs |
| Remove the `@media (prefers-reduced-motion: reduce)` block | Breaks accessibility for motion-sensitive users |
| Hardcode hex colours or pixel dimensions instead of tokens | Fragments the design system |
| Use absolute asset paths (`/css/style.css`) | Breaks GitHub Pages subdirectory deployment |

---

## When in doubt

1. Do the simpler thing.
2. Prefer existing patterns over new ones.
3. Ask the user if the request requires a trade-off that contradicts these guidelines.
4. Do not silently violate a guideline. If you must, explain why and what the trade-off is.

---

## Scope of these guidelines

These rules apply to:

- Any AI agent session working in this repository
- Human contributors who want to maintain consistency
- Future versions of this boilerplate

They do not apply if the user explicitly decides to eject from the no-dependency constraint — in which case they should update this file to reflect their new architecture decisions.
