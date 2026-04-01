# Vibe Boilerplate

A dependency-free, zero-build starter for small to medium-sized web apps.
Works by opening a file in the browser. No npm. No framework. No compiler.

---

## Table of contents

1. [Design rationale](#design-rationale)
2. [Project structure](#project-structure)
3. [Quick start](#quick-start)
4. [Customisation guide](#customisation-guide)
5. [CSS design tokens](#css-design-tokens)
6. [JavaScript architecture](#javascript-architecture)
7. [Accessibility](#accessibility)
8. [Deploying to GitHub Pages](#deploying-to-github-pages)
9. [PWA support (optional)](#pwa-support-optional)
10. [Limitations of static local apps](#limitations-of-static-local-apps)
11. [Prompting guide — extending with AI](#prompting-guide--extending-with-ai)
12. [Agent guidelines](#agent-guidelines)

---

## Design rationale

Modern web development has a complexity problem. Most starters assume a framework, a package manager, and a build pipeline. This boilerplate deliberately refuses all of that.

**Core decisions:**

| Decision | Reason |
|---|---|
| No framework | Forces clarity, removes abstraction overhead |
| No build step | Open the file, it works. No broken installs. |
| No external fonts | Removes a network dependency and reduces layout shift |
| System font stack | Looks native, loads instantly |
| CSS custom properties | Design token flexibility without a preprocessor |
| Single CSS file | Easy to scan; split only if it grows beyond ~600 lines |
| `DOMContentLoaded` guard | Safe init pattern for any script placement |
| Inline comments throughout | Lowers onboarding friction for every future reader |

This boilerplate is intentionally generic. It does not assume you are building a dashboard, a landing page, or a utility tool. It gives you a clean, accessible, responsive shell that can become any of those things.

---

## Project structure

```
your-repo/
│
├── index.html              # Entry point
├── 404.html                # GitHub Pages error page
├── manifest.json           # PWA manifest (optional)
├── service-worker.js       # Offline cache worker (optional)
├── .gitignore
├── README.md
├── AGENT_GUIDELINES.md     # Rules for AI agents working on this repo
│
├── css/
│   └── style.css           # All styles — one file, 15 clearly labelled sections
│
├── js/
│   └── main.js             # All behaviour — feature functions + init()
│
└── assets/
    └── icons/
        ├── favicon.svg           # SVG favicon (modern browsers)
        ├── favicon.ico           # ICO fallback
        ├── apple-touch-icon.png  # 180×180 for iOS home screen
        ├── icon-192.png          # PWA icon
        ├── icon-512.png          # PWA icon
        ├── icon-maskable-512.png # Maskable icon for Android
        └── og-image.png          # Open Graph social share image (1200×630)
```

**Why this layout?**

- Flat enough to be immediately understandable
- Separated by type (html / css / js / assets), not by feature, which suits small projects
- All paths are relative — works on `file://`, `localhost`, or any sub-path on GitHub Pages
- `assets/icons/` consolidates all icon sizes in one place

---

## Quick start

### Option 1 — Open directly

```
Clone or download the repository.
Open index.html in your browser.
Done.
```

No server needed for a basic static site.

### Option 2 — Local server (recommended for PWA testing)

Service workers require HTTPS or `localhost` — they do not work over `file://`. Use any of these:

**Python (built-in):**
```sh
cd your-repo
python3 -m http.server 8000
# Visit http://localhost:8000
```

**VS Code Live Server extension:**
Right-click `index.html` → "Open with Live Server"

**Node.js (one-time use, no install):**
```sh
npx serve .
```

---

## Customisation guide

### 1. Rename the app

Search and replace `App Name` globally across all files.

### 2. Update metadata in `index.html`

```html
<title>Your App Title</title>
<meta name="description" content="What your app does." />
<meta name="author" content="Your Name" />

<!-- Open Graph -->
<meta property="og:title" content="Your App Title" />
<meta property="og:url" content="https://yourusername.github.io/your-repo/" />
<meta property="og:image" content="…/assets/icons/og-image.png" />
```

### 3. Change the colour theme

All colours are in CSS custom properties at the top of `css/style.css`:

```css
:root {
  --color-primary: #2563eb;   /* Change this one value to repaint the UI */
  --color-primary-700: #1d4ed8;
  /* … */
}
```

### 4. Add a new page

1. Duplicate `index.html` → `about.html`
2. Update the `<title>` and content
3. Add a link in the `<nav>` of both pages
4. Add the new page to `CACHE_URLS` in `service-worker.js`

### 5. Add a new CSS component

Append a new numbered section at the bottom of `css/style.css`:

```css
/* ============================================================
   16. YOUR COMPONENT NAME
   ============================================================ */

.my-component {
  /* … */
}
```

### 6. Add a new JS feature

Append a new function to `js/main.js` and call it inside `init()`:

```js
function initMyFeature() {
  const el = qs('#my-element');
  if (!el) return;
  // …
}

function init() {
  // … existing calls …
  initMyFeature();
}
```

---

## CSS design tokens

All visual constants are CSS custom properties in `:root {}` in `style.css`.
Changing a token cascades through the entire stylesheet.

| Token | Default | Purpose |
|---|---|---|
| `--color-primary` | `#2563eb` | Buttons, links, focus rings |
| `--color-text` | `#0f172a` | Main body text |
| `--color-text-muted` | `#64748b` | Secondary text |
| `--color-bg` | `#ffffff` | Page background |
| `--color-bg-alt` | `#f8fafc` | Section alternate background |
| `--font-family-base` | system-ui stack | All body text |
| `--font-family-mono` | system monospace stack | Code blocks |
| `--container-max` | `72rem` | Max page width |
| `--container-narrow` | `48rem` | Text/form columns |
| `--space-4` | `1rem` | Base spacing unit |
| `--radius-md` | `0.5rem` | Standard border-radius |
| `--transition-fast` | `150ms ease` | Quick interactions |

---

## JavaScript architecture

`js/main.js` is organised into self-contained feature functions:

| Function | Purpose |
|---|---|
| `qs` / `qsa` | DOM selection helpers |
| `on` | Event listener with cleanup return |
| `trapFocus` | Trap keyboard focus inside an overlay |
| `debounce` | Rate-limit a function call |
| `initMobileNav` | Mobile hamburger toggle + keyboard handling |
| `initFooterYear` | Insert current year into footer |
| `initContactForm` | Client-side validation + async submit |
| `initSmoothScroll` | Offset-aware smooth scroll for anchor links |
| `initActiveNav` | IntersectionObserver-based nav highlighting |
| `init` | Calls all features after DOMContentLoaded |

**Extension pattern:**

```js
// 1. Write a new isolated function
function initMyFeature() {
  const el = qs('#trigger');
  if (!el) return; // always guard
  on(el, 'click', () => { /* … */ });
}

// 2. Add it to init()
function init() {
  // …
  initMyFeature();
}
```

---

## Accessibility

This boilerplate meets WCAG 2.1 Level AA intent by default:

- **Skip link** — visible on focus; bypasses navigation
- **Semantic HTML5** — `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, `<article>`
- **Landmark roles** — implied by semantic elements; no redundant ARIA
- **ARIA attributes** — `aria-expanded`, `aria-controls`, `aria-required`, `aria-invalid`, `aria-live`, `aria-current`
- **Focus management** — mobile nav closes and returns focus to trigger; smooth scroll moves focus to target
- **Focus styles** — visible `:focus-visible` outlines on all interactive elements
- **Colour contrast** — primary blue (#2563eb) on white passes AA for normal text
- **Reduced motion** — `@media (prefers-reduced-motion: reduce)` disables all transitions/animations
- **Form errors** — inline `role="alert"` with `aria-live="polite"`; first invalid field is auto-focused

---

## Deploying to GitHub Pages

### Step-by-step

**1. Create a GitHub repository**

Go to [github.com/new](https://github.com/new), create a public repository.

**2. Push your files**

```sh
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

**3. Enable GitHub Pages**

- Go to your repository → **Settings** → **Pages**
- Under **Source**, select **Deploy from a branch**
- Branch: `main` / Folder: `/ (root)`
- Click **Save**

**4. Wait ~60 seconds**, then visit:

```
https://yourusername.github.io/your-repo/
```

### Path considerations

All asset paths in this boilerplate are **relative** (e.g. `./css/style.css`, `./assets/icons/favicon.svg`). This means they work whether your site is at the root domain or in a sub-path like `/your-repo/`. Do not use absolute paths (`/css/style.css`) unless your site is at a root domain.

### Common pitfalls

| Problem | Fix |
|---|---|
| Site shows README instead of HTML | Ensure `index.html` is in the root of the branch |
| Assets 404 on GitHub Pages but work locally | Check all paths are relative, not absolute |
| PWA not installing | Service workers need HTTPS — GitHub Pages provides this |
| 404 page not showing | GitHub Pages automatically serves `404.html` if present |
| Changes not reflecting | GitHub Pages cache can take a few minutes; hard-refresh |

### Custom domain (optional)

1. Add a `CNAME` file to the repository root containing your domain: `www.yourdomain.com`
2. Configure your DNS provider to point to GitHub Pages
3. In repository Settings → Pages, enter your custom domain
4. Enable "Enforce HTTPS" once DNS propagates

---

## PWA support (optional)

PWA support is included but **disabled by default**. You opt in by uncommenting two things:

**1. In `index.html` — uncomment the SW registration block:**

```html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./service-worker.js')
        .then(reg => console.log('[SW] Registered:', reg.scope))
        .catch(err => console.error('[SW] Registration failed:', err));
    });
  }
</script>
```

**2. Provide real icon files** in `assets/icons/` (see icon sizes in `manifest.json`).

**What you get:**

- Installable on desktop and mobile (Add to Home Screen)
- Offline access for cached pages via cache-first strategy
- Fast repeat visits from cache

**What you don't get (and don't need to):**

- Background sync
- Push notifications
- Complex routing

**Local testing:**
Service workers require `localhost` or HTTPS. Use a local server (see Quick Start). They will not activate over `file://`.

**Cache busting:**
Increment `CACHE_VERSION` in `service-worker.js` with each deployment to invalidate the old cache.

---

## Limitations of static local apps

Being dependency-free and locally-runnable is a strength, but it comes with real constraints:

| Limitation | Workaround |
|---|---|
| No server-side logic | Use a third-party API, Formspree, Netlify Functions, or similar |
| No database | Use `localStorage`, `IndexedDB`, or a hosted backend |
| No authentication | Use a service like Auth0, Supabase, or Clerk with their client-side SDKs |
| No dynamic routing | Multiple `.html` files; or a client-side router using `hashchange` / `popstate` |
| CORS on local `file://` | Some browser APIs are restricted; use a local server |
| No server-side rendering | Content must be in HTML or rendered by client JS |

**When to reach for a framework:**
This boilerplate is intentionally simple. If your app needs real-time collaboration, complex state, or hundreds of components, consider a lightweight framework. But try to solve the actual problem first — you may be surprised how far plain HTML/CSS/JS can take you.

---

## Prompting guide — extending with AI

This boilerplate is structured to be extended collaboratively with an AI assistant (Claude, GPT, etc.). The clear file organisation, extensive comments, and predictable patterns make it easy for an AI to understand context and produce accurate code.

### How to give good prompts

Always tell the AI:
1. **Which file** you want to change
2. **What you want to add or change** — be specific
3. **What constraints apply** (no frameworks, keep it vanilla, keep comments, etc.)

### Example prompts you can copy

**Add a new component:**
```
Add a reusable "toast notification" component to this boilerplate.
It should appear in the bottom-right corner, auto-dismiss after 4 seconds,
and support success/error/info variants.
Add CSS to css/style.css following the existing section format,
and a JS function initToast() to js/main.js following the existing pattern.
No frameworks. No dependencies. Keep all existing code intact.
```

**Add a new page:**
```
Create a new page called pricing.html based on index.html's structure.
It should share the same header and footer, use the same CSS,
and contain a 3-column pricing card layout.
Keep all paths relative for GitHub Pages compatibility.
```

**Add localStorage persistence:**
```
In js/main.js, add a user preferences feature that saves a "dark mode" boolean
to localStorage under the key "user-prefs".
Use the saveToStorage/loadFromStorage pattern shown in the file's EXTENSION EXAMPLES.
Toggle a data-color-scheme="dark" attribute on <html>.
Add the corresponding dark mode CSS variables to css/style.css.
Do not add any external libraries.
```

**Improve accessibility:**
```
Review the contact form in index.html and css/style.css for WCAG 2.1 AA issues.
Fix any problems you find. Keep all existing markup and class names.
Explain each change you make and why.
```

**Refactor CSS:**
```
The card component in css/style.css (Section 9) needs a new modifier class
for a "featured" card that has a primary-coloured border and a subtle background tint.
Add only the modifier class. Do not change any existing classes.
Use existing design token variables only — do not introduce any new colour values.
```

**Add offline support:**
```
Enable the PWA service worker in this boilerplate.
Uncomment the registration block in index.html.
Update CACHE_URLS in service-worker.js to include all current assets.
Explain what I need to do to test this locally and how it will behave on GitHub Pages.
```

**Add a fetch/API integration:**
```
Add a function to js/main.js that fetches a list of items from
https://jsonplaceholder.typicode.com/posts?_limit=6
and renders them into the card grid section.
Use the fetchJSON pattern from the EXTENSION EXAMPLES in main.js.
Handle loading and error states visually.
No frameworks. No external libraries.
```

**Add a simple router:**
```
Add a hash-based router to js/main.js that shows/hides sections
based on the URL hash (e.g. #features, #about, #contact).
Use pushState for clean URLs where supported.
Keep the existing smooth scroll behaviour intact.
```

### Constraints to always include in prompts

When prompting about this codebase, include one or more of these reminders as needed:

- "No frameworks, no npm, no build step."
- "Keep all paths relative for GitHub Pages compatibility."
- "Follow the section comment format in css/style.css."
- "Follow the isolated function + init() pattern in js/main.js."
- "Preserve all existing comments."
- "Use CSS custom properties from :root — do not hardcode colours."
- "Keep the file runnable by opening index.html directly in a browser."

---

## Agent guidelines

See [AGENT_GUIDELINES.md](./AGENT_GUIDELINES.md) for the rules that govern how AI agents should contribute to this codebase.

---

## License

MIT. Use freely, modify freely, ship freely.
Attribution appreciated but not required.
