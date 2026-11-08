# Genie hero art pack (stage v3)

Made 2026-11-08 for the madwackd.ai home stage (`assets/stage.css` / `stage.js`). Stills only, no video.
Every file is an original render; nothing is traced from the Tell Me Why frames (one was tried as a style
reference and dropped because the model copied the riders and the road).

**Tool:** Gemini 3.1 Flash Image (`gemini-3.1-flash-image`) on Vertex AI, project `madwackd-studio`, 2K output,
through the active gcloud login with `prompts/gen.py` (same route as `madwackd-spots-2026-11/flagship/work/gen.py`).
Chroma key, despill, resize: `prompts/key.py`; seamless tiles: `prompts/tile.py`; page export: `prompts/export.py`
(numpy + Pillow, no paid tool). Google's SynthID watermark is embedded in the renders.

**Cost:** 29 calls x $0.101 (Vertex list price for a 2K still, counted even when the safety filter returned no
image) = **$2.93 estimated**, cap was $10. Per-call rows: `COST-LEDGER.csv`. Not checked against the Google bill.

| Group | Calls | Est. |
|---|---|---|
| Genie poses (6 kept; 2 pilots, 6 filter blocks, 3 retakes) | 17 | $1.72 |
| Scene layers (4 kept; first set of 4 discarded) | 8 | $0.81 |
| Paint splats | 2 | $0.20 |
| Velvet + boards tiles | 2 | $0.20 |

## Page files (root of this folder, the names `index.html` uses; all WebP, all under 250 KB)

| File | Size | KB | Notes |
|---|---|---|---|
| lamp.webp | 900x654 | 52 | brass lamp alone, open lid, transparent. **Spout tip at (22, 313)** |
| genie-puff.webp | 1458x1200 | 15 | first puff only, no lamp |
| genie-half.webp | 1458x1200 | 51 | head, arms and smoke column, no lamp |
| genie-out.webp | 1458x1200 | 77 | arms wide ("Poof"), no lamp |
| genie-point.webp | 1458x1200 | 67 | presenting to its own left = viewer's right, no lamp |
| genie-dissolve.webp | 1458x1200 | 113 | breaking into beads, no lamp |
| scene-sky.webp | 2400x1200 | 235 | opaque, big sun left of centre (WebP q45 to fit 250 KB) |
| scene-hills.webp | 2400x1200 | 224 | transparent above the ridge (q80) |
| scene-trees.webp | 2400x1200 | 241 | tree line + creek band, transparent above and below (q55) |
| scene-ground.webp | 2400x1200 | 244 | grass, rocks, flowers, bottom third (q55) |
| velvet-tile.webp | 1024x1024 | 87 | seamless, vertical folds, tested 2x2 |
| boards-tile.webp | 1024x512 | 90 | seamless, horizontal planks with footlight scuffs, tested 2x2 |
| splat-pink.webp | 719x800 | 63 | transparent |
| splat-gold.webp | 664x800 | 82 | transparent |

### How the five poses line up
All five share one 1458x1200 frame. The **smoke tail ends at (729, 1140)**, the point where the lamp spout tip
should sit. Each pose was scaled so the lamp it was rendered with has the same width (379 px at frame scale), then
the lamp was removed by its brass colour and the frame translated so the spout tips coincide. So: place `lamp.webp`
scaled to 379 px wide (0.421x) with its pixel (22, 313) at the frame's (729, 1140) and every pose grows straight out
of the spout. Check: `masters/_preview-genie-aligned.jpg` (yellow cross = that point, lamp composited underneath).

- The 250 KB limit forced the three painted layers and the sky down to WebP quality 45 to 55; the knife texture
  softens a little. PNG masters at full quality are in `masters/` if a larger budget is ever allowed.

## masters/ (not referenced by the page)
- `genie-01-lamp-closed` to `genie-06-dissolve` (PNG + WebP, 896x1200): the frames **with** the lamp in shot,
  plus `lamp-alone` (closed lid). Useful if the lamp should ever be part of the same image.
- Full-quality PNGs of every page file, `scene-1-sky` to `scene-4-foreground` at WebP q90, previews.

## Known rough spots
1. **genie-half was rendered with a different lamp** (ornate lid). Not visible on the page since the lamp is cut
   out, but the smoke column base is a little wider than in the other poses. Three regenerations with the matching
   lamp were blocked by the Vertex safety filter (`IMAGE_PROHIBITED_CONTENT`, no image, still billed).
2. genie-point presents with an open palm, not a single finger (the finger wording is what the filter blocked twice).
3. genie-puff is small; it was boosted 1.6x relative to its lamp so it reads at stage size.
4. scene-trees has painted sky between the canopies (part of the band, so the sky layer does not show through there).
5. Keyed edges checked at 2x on dark: clean. Smoke tails keep a 1 px warm rim that the model painted as rim light.

## Prompts
Full text of every prompt in `prompts/*.txt`. Shared blocks:
- Style: claymation still in the Producer Z material and lighting, reference `assets/z/z-hero.webp`, flat #00FF00
  background, "the reference is for material only, do not copy its backdrop".
- Genie: genderless, soft-teal (#1FB8B0) clay head and torso, big round eyes, no hair or horns, gold hoop, gold Z
  pin, magenta (#FF2E93) sash, magenta-and-teal clay smoke plume with gold beads into the brass lamp spout.
- Scene: impasto oil, palette gold / apricot / cream / ochre / sage / terracotta / lavender grey, big sunrise sun,
  flat #FF00FF where a layer is empty. No people, horses, buildings, text.
- Tiles: "seamless tileable", flat frontal, even light; then `tile.py` blends a half-offset copy across each axis
  separately (so folds and planks stay aligned) and writes a 2x2 check.

## Reproduce
```
python prompts/gen.py NAME --prompt-file prompts/NAME.txt --ref <refs...> --aspect 3:4|16:9|1:1
python prompts/key.py raw/NAME.png out/NAME --key green|magenta --height 1200     (or --size 2400x1200, --trim)
python prompts/tile.py raw/velvet-tile.png velvet-tile.webp 1024 1024 0.18 0.10
python prompts/export.py        (page names, alignment, 250 KB squeeze)
```
`gen.py` refuses to pass its own $5 ledger cap.
