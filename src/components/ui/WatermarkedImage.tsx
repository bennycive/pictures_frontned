import { useEffect, useRef, useState } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Renders an image on a <canvas> with a watermark already burned in.
 *
 * Why canvas instead of <img>:
 *  - Right-clicking a <canvas> and "Save image as" saves the canvas pixel
 *    data — which already contains the watermark.
 *  - The original image URL is never exposed in the DOM as an <img src>.
 *  - We also suppress the context menu so casual saving is blocked entirely.
 */
export function WatermarkedImage({ src, alt, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;

    let blobUrl: string | null = null;
    let cancelled = false;

    const draw = (img: HTMLImageElement) => {
      if (cancelled) return;
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      canvas.width  = W;
      canvas.height = H;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // ── Draw original image ────────────────────────────────────
      ctx.drawImage(img, 0, 0, W, H);

      // ── Tiled diagonal watermark (subtle — visible but not distracting) ──
      const tileSize = Math.max(W / 14, 16);
      ctx.save();
      ctx.font         = `italic ${tileSize}px "Playfair Display", serif`;
      ctx.fillStyle    = 'rgba(255,255,255,0.20)';
      ctx.shadowColor  = 'rgba(0,0,0,0.30)';
      ctx.shadowBlur   = 3;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';

      const tileW  = ctx.measureText('© AfriStudio').width;
      const colGap = tileW + tileSize * 2;
      const rowGap = tileSize * 3.5;

      ctx.translate(W / 2, H / 2);
      ctx.rotate(-Math.PI / 5);
      for (let row = -H * 1.5; row < H * 1.5; row += rowGap) {
        for (let col = -W * 1.5; col < W * 1.5; col += colGap) {
          ctx.fillText('© AfriStudio', col, row);
        }
      }
      ctx.restore();

      // ── Prominent centre watermark ─────────────────────────────
      const centerSize = Math.max(W / 7, 28);
      ctx.save();
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-Math.PI / 12);

      ctx.font        = `bold italic ${centerSize}px "Playfair Display", serif`;
      ctx.lineWidth   = centerSize * 0.07;
      ctx.strokeStyle = 'rgba(0,0,0,0.40)';
      ctx.shadowColor = 'rgba(0,0,0,0.50)';
      ctx.shadowBlur  = 14;
      ctx.strokeText('© AfriStudio', 0, 0);

      ctx.fillStyle = 'rgba(255,255,255,0.50)';
      ctx.fillText('© AfriStudio', 0, 0);

      const subSize = Math.max(W / 24, 12);
      ctx.font      = `${subSize}px "Playfair Display", serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.shadowBlur = 6;
      ctx.fillText('afristudio.site', 0, centerSize * 0.85);
      ctx.restore();

      // ── Footer strip + label ───────────────────────────────────
      const stripH = H * 0.08;
      const grad = ctx.createLinearGradient(0, H - stripH * 2, 0, H);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.60)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, H - stripH * 2, W, stripH * 2);

      const footerSize = Math.max(W / 32, 11);
      ctx.font         = `bold ${footerSize}px "Playfair Display", serif`;
      ctx.fillStyle    = 'rgba(255,255,255,0.85)';
      ctx.shadowColor  = 'rgba(0,0,0,0.65)';
      ctx.shadowBlur   = 4;
      ctx.textAlign    = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        '© AfriStudio — afristudio.site',
        W - footerSize * 0.5,
        H - footerSize * 0.5
      );

      setReady(true);
    };

    // Fetch as blob so the object URL is opaque — not the real media path
    fetch(src)
      .then(r => r.blob())
      .then(blob => {
        blobUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload  = () => draw(img);
        img.onerror = () => { /* silently fail */ };
        img.src = blobUrl;
      })
      .catch(() => { /* network error — canvas stays blank */ });

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={alt}
      className={`${className} ${ready ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      /* Block all context menu / right-click interactions */
      onContextMenu={e => e.preventDefault()}
      /* Block drag-to-desktop */
      draggable={false}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    />
  );
}
