import { Globe2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function LanguageSelector({ transparent = false }: { transparent?: boolean }) {
  const { currentLanguage, enabledLanguages, loading, setLanguage } = useLanguage();

  if (loading || enabledLanguages.length <= 1) return null;

  return (
    <label
      className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors ${
        transparent
          ? 'text-white/85 hover:bg-white/10'
          : 'text-earth-600 dark:text-earth-300 hover:bg-earth-100 dark:hover:bg-earth-800'
      }`}
      title="Language"
    >
      <Globe2 size={16} />
      <select
        value={currentLanguage}
        onChange={e => setLanguage(e.target.value)}
        className={`bg-transparent text-xs font-semibold outline-none cursor-pointer ${
          transparent ? 'text-white' : 'text-earth-700 dark:text-earth-200'
        }`}
      >
        {enabledLanguages.map(lang => (
          <option key={lang.code} value={lang.code} className="text-earth-900">
            {lang.code}
          </option>
        ))}
      </select>
    </label>
  );
}
