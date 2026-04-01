ICONS — Vibe Boilerplate
=======================

Place your icon files in this folder. The following filenames are expected
by index.html and manifest.json:

  favicon.svg              — Primary SVG favicon (modern browsers prefer this)
  favicon.ico              — Fallback ICO for older browsers/tools
  apple-touch-icon.png     — 180×180 PNG for iOS "Add to Home Screen"
  icon-192.png             — 192×192 PNG for PWA manifest
  icon-512.png             — 512×512 PNG for PWA manifest
  icon-maskable-512.png    — 512×512 PNG with safe zone for Android adaptive icons
  og-image.png             — 1200×630 PNG for Open Graph / social share previews


HOW TO CREATE ICONS FOR FREE
=============================

Option 1 — favicon.io (recommended for quick starts)
  https://favicon.io
  Upload an image, emoji, or text → downloads all sizes + favicon.ico

Option 2 — RealFaviconGenerator
  https://realfavicongenerator.net
  Most comprehensive option; generates all sizes and the <head> snippet

Option 3 — SVG favicon (modern approach)
  Create a simple SVG in any editor or directly in a text file.
  A minimal example (saves as favicon.svg):

    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill="#2563eb"/>
      <text x="16" y="22" text-anchor="middle" fill="white"
            font-size="16" font-family="sans-serif" font-weight="bold">A</text>
    </svg>

Option 4 — Maskable icon guide
  https://web.dev/maskable-icon/
  Use https://maskable.app to test and generate maskable versions


MINIMUM REQUIRED FILES
=======================
For a basic site (no PWA):
  - favicon.svg or favicon.ico

For PWA support:
  - favicon.svg
  - apple-touch-icon.png (180×180)
  - icon-192.png
  - icon-512.png
  - icon-maskable-512.png

For social sharing:
  - og-image.png (1200×630)


NOTE
====
This README.txt file is for developer reference only.
It is safe to delete once you have added your real icon files.
