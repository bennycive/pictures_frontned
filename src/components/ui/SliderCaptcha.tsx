/**
 * SliderCaptcha — drag the handle all the way to the right to verify.
 * Pure client-side; no external service required.
 * Usage:
 *   <SliderCaptcha onVerified={() => setVerified(true)} />
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';

interface Props {
  onVerified: () => void;
  /** Reset key — increment to reset the captcha back to unverified */
  resetKey?: number;
}

const THUMB_W = 48;   // px — width of the draggable handle
const VERIFY_PCT = 0.92; // fraction of track that counts as "done"

export function SliderCaptcha({ onVerified, resetKey = 0 }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);       // current thumb left px
  const [verified, setVerified] = useState(false);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startOffset = useRef(0);

  // Reset when resetKey changes
  useEffect(() => {
    setOffset(0);
    setVerified(false);
  }, [resetKey]);

  const trackWidth = useCallback(() =>
    (trackRef.current?.clientWidth ?? 300) - THUMB_W, []);

  const clamp = (v: number) => Math.max(0, Math.min(v, trackWidth()));

  const finish = useCallback((px: number) => {
    const max = trackWidth();
    if (px >= max * VERIFY_PCT) {
      setOffset(max);
      setVerified(true);
      onVerified();
    } else {
      // Snap back
      setOffset(0);
    }
  }, [onVerified, trackWidth]);

  // ── Mouse ──────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    if (verified) return;
    dragging.current = true;
    startX.current = e.clientX;
    startOffset.current = offset;
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      setOffset(clamp(startOffset.current + delta));
    };
    const onUp = (e: MouseEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      const delta = e.clientX - startX.current;
      finish(clamp(startOffset.current + delta));
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [finish, clamp]);

  // ── Touch ──────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    if (verified) return;
    dragging.current = true;
    startX.current = e.touches[0].clientX;
    startOffset.current = offset;
  };

  useEffect(() => {
    const onMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      const delta = e.touches[0].clientX - startX.current;
      setOffset(clamp(startOffset.current + delta));
    };
    const onEnd = (e: TouchEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      const last = e.changedTouches[0].clientX;
      finish(clamp(last - startX.current + startOffset.current));
    };
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [finish, clamp]);

  const pct = trackRef.current
    ? (offset / trackWidth()) * 100
    : 0;

  return (
    <div className="select-none">
      {/* Track */}
      <div
        ref={trackRef}
        className={`relative h-12 rounded-xl overflow-hidden border transition-colors duration-300 ${
          verified
            ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
            : 'border-earth-200 dark:border-earth-600 bg-earth-50 dark:bg-earth-700'
        }`}
      >
        {/* Fill */}
        <div
          className={`absolute inset-y-0 left-0 transition-colors duration-300 ${
            verified ? 'bg-green-400/30' : 'bg-primary-400/20'
          }`}
          style={{ width: `${offset + THUMB_W}px` }}
        />

        {/* Label */}
        <span
          className={`absolute inset-0 flex items-center justify-center text-xs font-medium pointer-events-none transition-opacity duration-200 ${
            verified
              ? 'text-green-600 dark:text-green-400 opacity-100'
              : 'text-earth-400 dark:text-earth-500 opacity-100'
          }`}
          style={{ paddingLeft: `${offset + THUMB_W + 8}px` }}
        >
          {verified ? 'Verified — you\'re human!' : 'Slide to verify you\'re not a robot'}
        </span>

        {/* Thumb */}
        <div
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          className={`absolute top-0 bottom-0 flex items-center justify-center rounded-xl shadow transition-colors duration-200 ${
            verified
              ? 'bg-green-500 cursor-default'
              : 'bg-primary-600 hover:bg-primary-500 cursor-grab active:cursor-grabbing'
          }`}
          style={{ width: `${THUMB_W}px`, left: `${offset}px` }}
        >
          {verified
            ? <CheckCircle2 size={20} className="text-white" />
            : <ChevronRight size={20} className="text-white" />
          }
        </div>
      </div>
    </div>
  );
}
