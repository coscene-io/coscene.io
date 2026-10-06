# Overview Preview Sources

## Street Context Refresh (2026-09-09)

`overview.webp` and `neighborhood.webp` were refreshed after adding the commercial
frontage and service-apron details in `src/robot-data-miniature-site.ts`.
Latest capture: `scripts/qa-miniature-street-context.js`, 1440 x 900, canvas only,
with hotspot labels and the floating control bar hidden, and models/camera
settled. Repeat with `run-street-context-qa.mjs <session> --stills`.
Encoding uses the same
settings below. All 18 collection environments and robot assets remain unchanged;
the new street furniture is illustrative context, not another task environment.

## Outdoor Extension (2026-09-09)

The latest overview contains 15 unchanged interiors and three selectable outdoor
planning environments: cleanup, garden and popup. Neighborhood focus contains
six interiors plus cleanup and garden. The overview captures below were refreshed
after the extension and the mobile hotspot corrections.

`{cleanup,garden,popup}-{g1,h2,s1,luna}-{wuji,reference}.webp` are 24 authored
Three.js close-view renders, captured at 1600 x 1000 (canvas region only) with
daylight, stage 0 and everyday conditions. They are static illustrations, not
photographs, recordings, measured venue plans or validated robot execution.
Source: `src/robot-data-miniature-outdoor-room.ts`,
`src/robot-data-miniature-outdoor-tasks.ts` and the unchanged robot asset builders.
Capture: `scripts/run-outdoor-qa.mjs miniature-next --stills`.
Encoding: `scripts/prepare-miniature-stills.mjs cleanup garden popup`, using the
same WebP settings below. Outdoor captures have empty canvas margins trimmed
against the study background (#edf0ed, threshold 8), with 24 pixels of padding
restored on each edge; no scene object is edited. This keeps fallback framing
legible on mobile. Robot geometry provenance remains in existing records.

## Overview Captures

`overview.webp` and `neighborhood.webp` are static fallbacks captured on
2026-09-09 from the authored Three.js study at
`/robot-data-miniature-study.html?view=overview` with `district=all` and
`district=neighborhood`, respectively. They are illustrative renders, not
photographs or measured venue reconstructions.

Source geometry: `src/robot-data-miniature-site.ts` and the existing room and
robot builders. Existing robot source and asset records remain unchanged.

Capture script: `scripts/qa-miniature-neighborhood.js` at 1440 x 900, canvas
region only, after all models and the camera settle. Hotspot labels are hidden.
Intermediate captures: `output/playwright/miniature-still-overview.png` and
`output/playwright/miniature-still-neighborhood.png`.

Encoding: `scripts/prepare-miniature-stills.mjs overview neighborhood`, WebP
quality 88, at most 1440 pixels wide, no enlargement or additional image editing.
