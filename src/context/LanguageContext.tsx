import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { siteApi } from '../api';
import type { LanguageConfig, LanguageOption } from '../api/types';

const GOOGLE_CODES: Record<string, string> = {
  EN: 'en',
  FR: 'fr',
  DE: 'de',
  ES: 'es',
  IT: 'it',
  CN: 'zh-CN',
  JP: 'ja',
  AR: 'ar',
  SW: 'sw',
};

const LOCAL_KEY = 'afristudio_language';
const DEFAULT_OPTIONS: LanguageOption[] = [
  { code: 'EN', name: 'English' },
  { code: 'FR', name: 'French (Français)' },
  { code: 'DE', name: 'German (Deutsch)' },
  { code: 'ES', name: 'Spanish (Español)' },
  { code: 'IT', name: 'Italian (Italiano)' },
  { code: 'CN', name: 'Chinese (Mandarin / 中文)' },
  { code: 'JP', name: 'Japanese (日本語)' },
  { code: 'AR', name: 'Arabic (العربية)' },
  { code: 'SW', name: 'Swahili (Kiswahili)' },
];

type LanguageCtx = {
  currentLanguage: string;
  enabledLanguages: LanguageOption[];
  loading: boolean;
  setLanguage: (code: string) => void;
};

const LanguageContext = createContext<LanguageCtx>({
  currentLanguage: 'EN',
  enabledLanguages: DEFAULT_OPTIONS,
  loading: true,
  setLanguage: () => {},
});

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: new (
          options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
          element: string
        ) => void;
      };
    };
  }
}

function setTranslateCookie(googleCode: string) {
  const value = googleCode === 'en' ? '' : `/en/${googleCode}`;
  const expires = value ? 'Fri, 31 Dec 9999 23:59:59 GMT' : 'Thu, 01 Jan 1970 00:00:00 GMT';
  const cookie = `googtrans=${value}; expires=${expires}; path=/`;
  document.cookie = cookie;
  document.cookie = `${cookie}; domain=${window.location.hostname}`;
}

function triggerGoogleSelect(googleCode: string) {
  const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
  if (!select) return false;
  select.value = googleCode === 'en' ? '' : googleCode;
  select.dispatchEvent(new Event('change'));
  return true;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<LanguageConfig | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState(() => localStorage.getItem(LOCAL_KEY) || 'EN');
  const [loading, setLoading] = useState(true);

  const includedLanguages = useMemo(() => {
    const enabled = config?.enabled_languages?.length ? config.enabled_languages : DEFAULT_OPTIONS.map(option => option.code);
    return enabled.map(code => GOOGLE_CODES[code]).filter(Boolean).join(',');
  }, [config?.enabled_languages]);

  const enabledLanguages = useMemo(() => {
    const options = config?.available_languages?.length ? config.available_languages : DEFAULT_OPTIONS;
    const enabled = config?.enabled_languages?.length ? config.enabled_languages : options.map(option => option.code);
    return options.filter(option => enabled.includes(option.code));
  }, [config]);

  useEffect(() => {
    siteApi.getLanguages()
      .then(res => {
        setConfig(res.data);
        const saved = localStorage.getItem(LOCAL_KEY);
        const next = saved && res.data.enabled_languages.includes(saved)
          ? saved
          : res.data.default_language;
        setCurrentLanguage(next);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!includedLanguages) return;

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement(
        { pageLanguage: 'en', includedLanguages, autoDisplay: false },
        'google_translate_element'
      );
    };

    if (!document.querySelector('script[data-google-translate]')) {
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.dataset.googleTranslate = 'true';
      document.body.appendChild(script);
    } else {
      window.googleTranslateElementInit?.();
    }
  }, [includedLanguages]);

  useEffect(() => {
    const googleCode = GOOGLE_CODES[currentLanguage] || 'en';
    localStorage.setItem(LOCAL_KEY, currentLanguage);
    document.documentElement.lang = googleCode;
    document.documentElement.dir = currentLanguage === 'AR' ? 'rtl' : 'ltr';
    setTranslateCookie(googleCode);

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (triggerGoogleSelect(googleCode) || attempts > 20) {
        window.clearInterval(timer);
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [currentLanguage]);

  const setLanguage = (code: string) => {
    if (!GOOGLE_CODES[code]) return;
    setCurrentLanguage(code);
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, enabledLanguages, loading, setLanguage }}>
      <div id="google_translate_element" className="hidden" />
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
