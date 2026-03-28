import { useLanguage } from './LanguageContext';
import { translations, Translations } from './translations';

export function useTranslation(): { t: Translations; currentLang: string } {
  const { currentLang } = useLanguage();
  const t = translations[currentLang] || translations.EN;
  
  return { t, currentLang };
}

// Helper function to get nested translation values
export function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, part) => acc?.[part], obj) || path;
}
