# First-Person Data Study Assets

This is a local layout and target-capability study, not a released product page.
The clips are public dataset samples, not Kexing collection footage.

## Three-act extension (2026-09-11)

The combined study reuses the unchanged robot-data module before the three
first-person sections. `wall/catalog.json` records the public video samples;
these are short study excerpts, not a claim about Kexing's corpus size.

- TrainThemAI, Industrial Workplace Egocentric FHD Samples:
  https://huggingface.co/datasets/TrainThemAI/Industrial-Workplace-Egocentric-FHD-Samples
  Publisher README and clip manifest explicitly permit commercial use,
  redistribution and training under MIT. Original contributor rights statements
  and the pinned revision are retained in the preparation provenance.
- OpenGraph Labs, Ego-Tactile Manipulation:
  https://huggingface.co/datasets/OpenGraphLabs-Research/ego-tactile-manipulation
  CC-BY-4.0, explicitly including commercial use with attribution. Distinct
  episodes are distinct recordings, not necessarily distinct scenes or tasks.
- The two original Manus samples below remain Apache-2.0 public samples.
- HumynLabs, APAC Egocentric Residential Voiceover:
  https://huggingface.co/datasets/humyn-labs/APAC-Egocentric-Residential-Voiceover
  CC-BY-4.0 with a separate publisher statement of participant consent for
  research use. Seven muted excerpts are included in this local study only;
  participant, voice and interior rights for public marketing remain unconfirmed.
  These examples must be cleared or replaced before any external publication.

Preparation: `scripts/prepare-ego-wall.py`;
source revisions, excerpt time ranges, transformation settings, licenses and
derivative hashes live in `output/ego-data-study/source-20260911/`.
Videos are muted H.264 derivatives. Small previews and real extracted posters
are separate from the larger on-demand sample videos. Source field of view is
preserved with letterboxing where needed.

## Computed static hand examples

2026-09-14 selection update: cup-cleaning frames at local 11.375s and 11.5s
replace the visually incorrect, crossed-hand 4.0s/8.0s results. Source/overlay
comparisons and the selection rationale are in
`output/ego-data-study/pose-review-20260914/`. Detection count and handedness
scores are not landmark-accuracy measurements. No landmark coordinates were
manually repositioned.

`wall/processing.json` and `wall/processed/` contain selected image frames and
actual offline MediaPipe Hand Landmarker results. This is the public Google
model, not Kexing proprietary inference. The tasks-vision package is 0.10.17;
the model is the float16 v1 hand_landmarker.task from Google's public model
storage. Model and frame SHA-256 hashes, including unsuccessful detections,
are retained in `output/ego-data-study/source-20260911/hand-inference.json`.

- Input: decoded 960x540 sample frames. Output: image-normalized hand keypoints.
- Selected landmarks are rendered directly from the model output. No hand
  points are invented for missed detections. These are visually reviewed study
  examples, not a quantitative accuracy evaluation or calibrated 3D recovery.
- Object boxes, object identities, actions and visible-state descriptions are
  human-authored demonstration annotations in `annotation-plan.json`, not
  pixel-level ground truth or automatic semantic inference.
- UI timestamps refer to the local sample excerpt. See each sample's source
  offset in the media provenance for its corresponding original recording.
- Neither the model weights nor its inference runtime are loaded by these
  static overlays in the customer-facing study.
- The Data Model section is a target-state feedback workflow. It performs no
  proprietary quality inference and reports no measured training gains.

## Original two-sample study (retained assets)

## Source

- Dataset: OpenGraph Labs, Manus Egocentric Hand Tracking Dataset (2025).
- URL: https://huggingface.co/datasets/OpenGraphLabs-Research/manus-egocentric-sample
- Pinned revision: 05cfc068ad0388f7e186606e0fcefb18c4634c0e.
- The publisher's README declares Apache License 2.0; its full text is retained
  in DATASET-README.md and its schema in DATASET-INFO.json.
- Episodes 0 (Pick_and_pack_task) and 1 (fold_laundry), RGB video and the matching
  Parquet hand-joint records only. No identities or inferred worker performance.

## Transformations

- Full episodes, no temporal edits: downscaled to 1280x720 H.264 for browser
  compatibility; audio omitted (the sources declare no audio).
- Posters extracted from video at 12 seconds. RGB subjects are not generated.
- Hand-joint records are sampled at approximately 15 Hz and linearly interpolated
  for display. Source times, frame counts, original and derivative SHA-256 hashes
  are in MANIFEST.json. Coordinates are wrist-relative: both recorded wrist
  origins are zero. They do not establish global wrist or object trajectories.
- The 3D viewer separates and rigidly orients the two hands for legibility. Finger
  groups follow the documented 25-joint structure; display connections use the
  proximal ordering visible in the provided coordinates (the second and third
  positions within non-thumb finger groups are interchanged). This is display
  topology, not a validated anatomical or camera calibration.
- Temporal/action labels and Data Model review examples are authored UI study
  content. They are not model inference results, measured data-quality scores,
  pixel segmentation ground truth or evidence of training improvement.

## Boundaries

The Hubdata stereo sample was inspected but not used: its evaluation terms
prohibit redistribution/rehosting. No gated dataset access was bypassed.
Production builds must exclude this page and its assets. Replace these examples
with cleared Kexing material and verified processing results before publication.
