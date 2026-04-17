import { Logo } from './Logo';

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'h-4 w-4', md: 'h-7 w-7', lg: 'h-10 w-10' }[size];
  return (
    <div className={`animate-spin rounded-full border-2 border-earth-200 border-t-primary-600 ${s}`} />
  );
}

/** Full-screen loader — used by ProtectedRoute while auth resolves */
export function PageSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-earth-50 gap-5">
      <Logo variant="dark" className="h-10 w-auto animate-pulse" />
      <Spinner size="lg" />
    </div>
  );
}

/** Section-level loader — use this inside pages instead of bare <Spinner /> */
export function SectionSpinner({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Logo variant="dark" className="h-7 w-auto opacity-70" />
      <Spinner size={size} />
    </div>
  );
}
