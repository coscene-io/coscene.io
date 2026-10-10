# Accepted homepage ending integration — 2026-10-10

The accepted DataValueEnding is now the only official homepage ending. It contains the liquid English headline, three value cards, and the shared black/white cooperation form and footer.

Removed the VITE_LEGACY_CLOSING switch, old evolution/production/contact/placeholder markup, SignalField renderer, associated motion hooks and constants, and obsolete App.css selectors/keyframes. SceneHandoffSequence defaults to DataValueEnding for either hero version. It no longer imports historical delivery/footer studies; those are explicitly supplied only by the independent scene-handoff study entry. About keeps its contextual shared-module variant.

## Verification

- npm run build: PASS after cleanup, six official HTML entries in dist; study HTML entries excluded. Public assets copied successfully. Existing font-resolution/copy and large Three.js chunk warnings remain.
- Scoped oxlint: PASS, no warnings. TypeScript passed as part of the final build.
- Official App bundle JS/CSS: no VITE_LEGACY_CLOSING/showLegacyClosing, evolution-section, closing-section, footer placeholder, old site-footer positioning or delivery-footer handoff markers.
- Independent source audit: PASS. Earth retirement, viewport timing and sticky handoff retained; old ending modules are absent from the official App's local import graph.
- Built-site preview, desktop 1280×720: Earth scrolls away to the liquid headline; Explore link reaches all three accepted cards. First card expands and returns to its graphic. Main contact link reaches the new form. Exactly one #data-value and one #contact; zero old ending sections. No horizontal overflow or observed browser error logs.
- Desktop form: title 随时响应您的数据需要, settled reveal phase done, RGB(255,255,255), coScene with exact casing, no pause controls, black symbol/white arrow.
- Mobile 390×844: one contact, zero old ending sections, settled form x20/width335/top94.09/bottom654.72, pure white, readable and fully displayed. No horizontal overflow or observed browser error logs.

Evidence: desktop-value.png, desktop-cards.png, desktop-contact.json/png, mobile-contact.json/png. Source backups are retained under before for recovery and are not production entries.

The local official build is refreshed; no public deployment occurred. The form remains a local preview without a collection endpoint.
