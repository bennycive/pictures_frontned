import { useEffect, useState } from 'react';
import { loadingBar } from '../../lib/loadingBar';

export function LoadingBar() {
  const [active, setActive] = useState(false);
  const [width, setWidth]   = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const unsub = loadingBar.subscribe(isActive => {
      if (isActive) {
        setActive(true);
        setWidth(30);
        timer = setTimeout(() => setWidth(70), 200);
      } else {
        setWidth(100);
        timer = setTimeout(() => { setActive(false); setWidth(0); }, 400);
      }
    });
    return () => { unsub(); clearTimeout(timer); };
  }, []);

  if (!active && width === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[3px] bg-primary-500 transition-all ease-out"
      style={{ width: `${width}%`, opacity: active || width === 100 ? 1 : 0, transitionDuration: width === 100 ? '300ms' : '500ms' }}
    />
  );
}
