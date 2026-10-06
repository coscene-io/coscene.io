# Robot Data Website Integration

Date: 2026-09-09

## Scope

The approved miniature experience is integrated into the local website at
`/training/robot-data/`, replacing the old hardware-first route. This is a
source/build integration, not an external deployment or a Git merge commit;
the workspace is not a Git repository. The first-person video data page is
intentionally untouched, pending the user's design direction.

The 18 authored environments, robot identities, H2 face/stance, WUJI assemblies,
task definitions, variants and lighting values are retained. Of the 22 protected
source hashes, only the renderer differs; the other 21 remain identical to
`overview-ui-model-baseline.json`.

## Runtime Changes

- Static room and overview robot meshes are combined by equivalent material,
  vertex layout, shadow flags and render order. Transparent, multi-material,
  clipped and otherwise dynamic meshes are not indiscriminately combined.
  Close-view geometry remains separately editable. Mirrored winding, normal
  transforms and caller ownership are covered by three unit tests.
- The full overview measured 14,040 draw calls before and 458 after batching,
  with GPU geometry objects reduced from 5,681 to 238 and the same 7,797,395
  source vertices. These are drawing-submission measurements, not a claim of
  equivalent frame-rate improvement on every device.
- Identically framed before/after captures at 1600 and 390 px showed only 17
  and 3 pixels differing by more than 24 channel levels, respectively, with
  no missing visible area. Raw evidence: `integration-*-*-perf.json` and
  `integration-{before,after}-chromium-{1600,390}.png` under `output/playwright/`.
- A permanent portal host moves the same canvas between the overview and
  close-layout slots. This removes repeated WebGL context creation. Only one
  capability probe and one live context are created during the entire browsing
  session; the test also tracks the same canvas DOM identity across transitions.
- Close-model GPU buffers are released when a body leaves the view; cached CPU
  meshes remain available. Room/material/batch resources retain explicit owners.
- Readiness requires the requested scene and model set, its fitted room bounds,
  and a camera layout matching the current physical canvas container. This
  prevents a prior layout's size or another room's fit points from enabling
  controls before the new view is ready.
- Existing preview images cover initial loading. Unsupported WebGL, model
  failure, context loss or a 45-second visible-page loading timeout use static
  previews with usable scene selection/contact and disabled camera controls.
  Background time does not consume that visible-page timeout.

## Website And Assets

- Normal builds now intentionally contain three HTML entries: `/`,
  `/training/robot-data/`, and `/training/robot-data/sources/`. The explicit
  `/training/robot-data/index.html` alias is also recognized by the page loader.
  Study HTML files remain outside normal `dist`.
- The formal route uses static title/description metadata and does not inherit
  study `noindex` metadata. The shared experience has no self-mount side effect;
  a separate study entry boots the comparison surface. Classic layout remains
  study-only even when its query is supplied to the formal route.
- Header/home links, browser Back/Forward, selected scene, task/condition state,
  actual data-catalog links and contextual `mailto:hello@kexing.space` inquiries
  are connected. The public catalog returned HTTP 200 in the integration check.
  The homepage's sample-menu entry now links to that same catalog.
- `miniature-production-assets.mjs` expands a whitelist from the typed catalog
  and structured GLB metadata. All 169 miniature/license dependencies are present;
  raw STL/XML, legacy G1 GLB and superseded H2 meshes are excluded. The required
  miniature runtime directory is about 61 MiB versus 115 MiB for the source tree.
  Assets are fetched on demand, not all at initial page entry.
- Model notices, font licenses and a model/material explanation page accompany
  the experience. Vite emits `third-party-licenses.md` for bundled software.
  The unverified legacy study font stays in the study entry, not this route.
  Luna remains a locally authored appearance approximation, WUJI mounts remain
  display-level combinations, and the page separates illustrative task states
  from the linked real data catalog. No venue drawings are redistributed.
- Compatible dependency patches only: nanoid 3.3.15 to 3.3.18, postcss 8.5.15
  to 8.5.28, nested fflate 0.6.10 to 0.6.11. Final npm audit reports zero
  vulnerabilities; no other installed package versions changed.

## Verification

Final acceptance is recorded in `production-{chromium,webkit}-qa.json` under
`output/playwright/`. Both final full reports have empty `errors` and `findings`.
Lint, the three batching unit tests, the normal build, the study build and the
final asset inventory also pass. Each full run exercises:

- 36 scene entry/return cycles, 144 body/hand configurations and 216 task states.
- Same-canvas identity and exactly two context creations, including the probe.
- Overview and close views at 1920/1600/1280/1024/768/390/320 px, nonblank canvas
  pixels, complete framing, no horizontal overflow, unchanged camera on condition
  changes, browser history, free orbit, reset and correctly restored selection.
- A real forced WebGL context loss, and a separate no-WebGL touch workflow.
- Metadata, formal navigation, sample/inquiry destinations, model/font/software
  notice delivery, homepage lazy-loading isolation and six-panel footer checks.

The earlier `production-webkit-confirm-qa.json` is diagnostic, before the fitted-
layout readiness correction; it is not final acceptance. The final full report
supersedes its timing/framing findings. The former full-world WebKit gate has
been reproduced and addressed in the tested WebKit runtime, not merely bypassed
with a close-only test. This does not certify every Safari version or physical
phone GPU. No external release has occurred.

Repeat commands, using an owned browser CLI session:

```bash
npm run lint
node --test scripts/test-miniature-batch.mjs
npm run build
npm run build:studies
PLAYWRIGHT_CLI=/path/to/playwright-cli.js node scripts/run-robot-data-production-qa.mjs <session>
```

The unit-test command uses this workspace's Node 24 TypeScript support. The asset
copy step uses the existing TypeScript compiler and does not require native
TypeScript import support in the deployment build runtime. Expected build notices
about six runtime assets are resolved by the copy step; the Three.js chunk-size
notice remains. Neither warning is a missing runtime file.

## Preview And Rollback

Local website build preview: `http://127.0.0.1:5180/training/robot-data/`.
The separate study server remains on port 5181. Both listen on loopback only.

Pre-integration snapshot: `before-production-integration-20260909.tar.gz` in this
folder, containing source, scripts, package files and build entry configuration.
The old `src/RobotDataPage.tsx` is retained. A narrow route rollback can restore
its lazy import in `src/main.tsx`; the new renderer then ceases to load for that
route. Use the snapshot for targeted comparisons if a broader rollback is needed,
not an indiscriminate overwrite of later user edits. No Git reset is involved.

Before an external deployment, configure the actual host's HTML/cache/compression
policy and final domain metadata, and do a physical iPhone/Android spot-check on
the target network. Fingerprinted bundles can be immutable; unhashed GLBs/stills
need revalidation or versioned URLs. These host/device checks are publication
steps, not a reason to change the approved scene design or start the next page.
