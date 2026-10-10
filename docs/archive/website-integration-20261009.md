# Website integration — 2026-10-09

The four accepted primary pages are now included in the regular website build:
home, training, delivery assurance and About Kexing. Existing sources and task
records pages are included as supporting readers. About reuses the accepted
study's exact component and CSS.

Shared navigation leads to the actual page routes and About scene anchors. Shared
contact links, delivery contact actions and general training consultation links
lead to `/about/#contact`. Home footer categories lead to the corresponding
website pages. The training shell reserves the shared navigation band and keeps
incoming chapter hashes when the miniature updates its scene query.

## Checks completed

- `npm run build`: passed, including TypeScript; 857 production asset paths copied.
- Scoped Oxlint on the changed TypeScript, TSX, script and Vite files: passed.
- Layout detector on the navigation and new training wrapper CSS: passed.
- Six built HTML entries: present; referenced script/style assets present.
- About closing frost PNG and light-field SVG: included in `dist/assets/about-team/`.
- 128 static absolute asset references across built HTML/CSS/JS: no missing files.
- Normal build: no study HTML entries.
- IAB production preview at `http://127.0.0.1:5197/`, 1440×900 and 390×844:
  shared page navigation, About chapter links, contact, training chapter links
  and return-home links work. Checked pages have no horizontal overflow.
- Desktop About philosophy aligns at 72px below the navigation; mobile team and
  contact align at approximately 58px. Training experience/infrastructure align
  at 142px on desktop, reserving navigation and the chapter band; mobile
  experience aligns at 128px. Miniature query updates preserve each chapter hash.
- Training miniature and delivery ribbon reach their ready states. About's
  opening video loads and autoplays in the desktop preview.
- Captured browser logs contain no errors. Existing Three.js Clock deprecation
  warnings remain; the build reports the existing large Three.js chunk warning.

## Preview boundaries

No external deployment was performed. Form submission remains the accepted local
preview behavior and has no collection endpoint. Remote Wix reference media in
the About opening is retained for this local integration. Existing scene-specific
mail drafts and external sample links keep their context. Social labels and the
careers links keep the accepted implementation.

## Visual evidence

Screenshots are in `output/playwright/website-integration-20261009/`:

- `home-navigation.png`: homepage with the integrated About menu.
- `about-contact-desktop.png`, `about-contact-mobile.png`: accepted closing scene.
- `training-desktop.png`, `training-mobile.png`: training with the shared navigation.
- `quality-desktop.png`, `quality-mobile.png`: delivery assurance.
- `mobile-navigation.png`: integrated About chapters in mobile navigation.

Build output is recorded in `build.log`.
