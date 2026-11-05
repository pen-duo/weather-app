import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { messages } from './messages';
export type Locale = 'zh-CN' | 'zh-TW' | 'yue' | 'en';
export const localeTags: Record<Locale, string> = {
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  yue: 'zh-HK',
  en: 'en-GB',
};
export function translate(
  locale: Locale,
  key: string,
  values: Record<string, string | number> = {},
) {
  const entry = messages[key as keyof typeof messages];
  const text = locale === 'zh-CN' || !entry ? key : entry[locale];
  return text.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));
}
function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem('weather-language');
    if (saved === 'zh-CN' || saved === 'zh-TW' || saved === 'yue' || saved === 'en') return saved;
  } catch {
    /* Storage may be disabled. */
  }
  return 'zh-CN';
}
const LanguageContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void }>({
  locale: 'zh-CN',
  setLocale: () => {},
});
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  useEffect(() => {
    document.documentElement.lang = locale === 'yue' ? 'yue-Hant' : locale;
    document.title = `${translate(locale, '晴间')} · Weather`;
    try {
      localStorage.setItem('weather-language', locale);
    } catch {
      /* The switch still works in memory. */
    }
  }, [locale]);
  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>{children}</LanguageContext.Provider>
  );
}
export function useLanguage() {
  const { locale, setLocale } = useContext(LanguageContext);
  return {
    locale,
    setLocale,
    t: (key: string, values?: Record<string, string | number>) => translate(locale, key, values),
  };
}
