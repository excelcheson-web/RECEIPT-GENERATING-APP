import { useLanguage } from './LanguageContext';
import { translations, Translations, LanguageCode } from './translations';

export function useTranslation(): { t: Translations; currentLang: LanguageCode } {
  const { currentLang } = useLanguage();
  const t = translations[currentLang] as Translations;
  
  return { t, currentLang };
}

// Helper function to get nested translation values
export function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, part) => acc?.[part], obj) || path;
}
