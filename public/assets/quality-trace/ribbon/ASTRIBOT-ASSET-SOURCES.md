# C06 Astribot S1 visual assets

Prepared 2026-09-20 from previously archived local manufacturer media. No card content, sensor facts, or UI code changed.

## Preferred: astribot-s1-front.webp

- 924 × 856, RGB, opaque background `#eceef0`.
- Existing local image: `public/assets/robot-data/astribot-portrait.webp`; byte-for-byte copy.
- Manufacturer image: https://www.astribot.com/images/index/index-s1-o4-bg.webp
- Source page: https://www.astribot.com/product
- Original local archive: `output/robot-data/opening-sources/astribot-product-stage.webp` (2880 × 1380).
- Existing preparation is recorded in `scripts/prepare-robot-opening.py`: crop manufacturer photograph to upper body, foreground segmentation with BiRefNet, uniform scaling, composite over `#eceef0`. No generated hardware.
- Head, chest, and both wrists are clearly visible. Recommended for device identification and view-position callouts. This is a manufacturer S1 reference photograph, not evidence of the exact physical asset that produced the refrigerator task.

## Alternate: astribot-s1-operation.webp

- 957 × 949, RGBA with retained existing alpha.
- Existing local image: `output/robot-data/editorial-sources/astribot-cutout-v2.png`; re-encoded to WebP, no crop or additional segmentation.
- Manufacturer source video: https://www.astribot.com/index/s2test/index-s2-test.m3u8
- 1080p rendition: https://www.astribot.com/index/s2test/v_1080p/out.m3u8
- Original frame: `output/robot-data/editorial-sources/astribot-original.png`, 1920 × 1080, frame at 18.6 seconds.
- Manufacturer S1 task image shows a bent torso and two arms handling a container by a bowl. More spatial and expressive, but less direct for sensor-position callouts. Does not depict this project's refrigerator task.

Full prior provenance and processing notes: `output/robot-data/SOURCES.md`.

The older `public/assets/robot-data/astribot-product.webp` was not chosen: it derives from a low-opacity reveal render with visible tonal banding when enlarged.
