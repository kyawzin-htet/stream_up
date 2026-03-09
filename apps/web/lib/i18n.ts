import en from '../locale/en.json';
import mm from '../locale/mm.json';

export type AppLanguage = 'en' | 'mm';
export const LANGUAGE_COOKIE_NAME = 'app_lang';

const catalogs: Record<AppLanguage, Record<string, string>> = {
  en: en as Record<string, string>,
  mm: mm as Record<string, string>,
};

const enValueToKey = new Map<string, string>(
  Object.entries(catalogs.en).map(([key, value]) => [String(value), key]),
);

export function normalizeLanguage(value?: string | null): AppLanguage {
  return value === 'mm' ? 'mm' : 'en';
}

export function parseLanguageFromCookieString(cookieString?: string): AppLanguage {
  if (!cookieString) return 'en';
  const token = cookieString
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LANGUAGE_COOKIE_NAME}=`));
  if (!token) return 'en';
  return normalizeLanguage(token.split('=').slice(1).join('='));
}

export function getCatalog(language: AppLanguage) {
  return catalogs[language] || catalogs.en;
}

export function translateByKey(language: AppLanguage, key: string, fallback?: string) {
  const active = getCatalog(language);
  return active[key] ?? catalogs.en[key] ?? fallback ?? key;
}

export function translateText(language: AppLanguage, value: string): string {
  if (language === 'en') return value;
  const key = enValueToKey.get(value);
  if (!key) return value;
  return catalogs[language][key] ?? value;
}

export function getLocalizedMap(language: AppLanguage): Record<string, string> {
  const target = getCatalog(language);
  const map: Record<string, string> = {};
  for (const [key, englishValue] of Object.entries(catalogs.en)) {
    map[String(englishValue)] = target[key] ?? String(englishValue);
  }
  return map;
}
