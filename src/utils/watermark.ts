/**
 * Downloads an image with:
 *  - A blur applied to the whole image
 *  - A large prominent watermark in the centre
 *  - Tiled diagonal watermarks across the full image
 *  - A branded footer strip
 */
export async function downloadWithWatermark(
  imageUrl: string,
  filename = 'afristudio-artwork.jpg'
): Promise<void> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error('Failed to fetch image');
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const W = img.naturalWidth;
      const H = img.naturalHeight;

      const canvas = document.createElement('canvas');
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }

      // ── 1. Draw image with blur ───────────────────────────────────
      ctx.filter = 'blur(3px)';
      ctx.drawImage(img, 0, 0, W, H);
      ctx.filter = 'none';
      URL.revokeObjectURL(objectUrl);

      // ── 2. Tiled diagonal watermarks (background layer) ──────────
      const tileText = '© AfriStudio';
      const tileSize = Math.max(W / 12, 18);
      ctx.save();
      ctx.font         = `italic ${tileSize}px "Playfair Display", serif`;
      ctx.fillStyle    = 'rgba(255,255,255,0.22)';
      ctx.shadowColor  = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur   = 4;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';

      const tileW  = ctx.measureText(tileText).width;
      const colGap = tileW + tileSize * 2;
      const rowGap = tileSize * 3.5;

      ctx.translate(W / 2, H / 2);
      ctx.rotate(-Math.PI / 5);
      for (let row = -H * 1.5; row < H * 1.5; row += rowGap) {
        for (let col = -W * 1.5; col < W * 1.5; col += colGap) {
          ctx.fillText(tileText, col, row);
        }
      }
      ctx.restore();

      // ── 3. Centre watermark — large & prominent ──────────────────
      const centerSize = Math.max(W / 6, 36);
      ctx.save();
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';

      // Rotated background pill
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-Math.PI / 12); // slight tilt

      // Shadow for depth
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur  = 18;

      // Main text — stroke outline first for crispness
      ctx.font      = `bold italic ${centerSize}px "Playfair Display", serif`;
      ctx.lineWidth = centerSize * 0.08;
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.strokeText('© AfriStudio', 0, 0);

      // Fill
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText('© AfriStudio', 0, 0);

      // Sub-label below
      const subSize = Math.max(W / 22, 14);
      ctx.font      = `${subSize}px "Playfair Display", serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.40)';
      ctx.shadowBlur = 8;
      ctx.fillText('afristudio.site', 0, centerSize * 0.9);

      ctx.restore();

      // ── 4. Dark footer strip ─────────────────────────────────────
      const stripH = H * 0.08;
      const grad = ctx.createLinearGradient(0, H - stripH * 2, 0, H);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, H - stripH * 2, W, stripH * 2);

      // Footer label bottom-right
      const footerSize = Math.max(W / 30, 12);
      ctx.font         = `bold ${footerSize}px "Playfair Display", serif`;
      ctx.fillStyle    = 'rgba(255,255,255,0.88)';
      ctx.shadowColor  = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur   = 5;
      ctx.textAlign    = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('© AfriStudio — afristudio.site', W - footerSize * 0.5, H - footerSize * 0.5);

      // ── 5. Export & trigger download ─────────────────────────────
      canvas.toBlob(
        (out) => {
          if (!out) { reject(new Error('Export failed')); return; }
          const a = document.createElement('a');
          a.href     = URL.createObjectURL(out);
          a.download = filename.replace(/\.[^.]+$/, '') + '-afristudio.jpg';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(a.href);
          resolve();
        },
        'image/jpeg',
        0.92
      );
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
    img.src = objectUrl;
  });
}
