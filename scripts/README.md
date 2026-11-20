# Image Export Workflow (Lightroom -> WebP)

1. In Lightroom Classic, select the **`Lundblad Studios — WebP 2500px`** Export Preset.
   - Format: JPEG (Quality 100), sRGB, Long Edge 2500px, Screen Sharpening (Standard), Metadata: Copyright Only.
   - Post-Processing -> After Export -> Open in Other Application: `scripts/lr-to-webp.sh` (or the Automator wrapper if Lightroom grays out `.sh` files).
2. Export directly into `assets/images/YYYY/<project>/`.
3. `lr-to-webp.sh` automatically converts each export to `.webp` (`q=87`, `-sharp_yuv`, ICC preserved) and deletes the temporary `.jpg`.
