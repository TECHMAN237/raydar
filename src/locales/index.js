import { en } from './en.js';
import { fr } from './fr.js';

export const LOCALES = { en, fr };
export const DEFAULT_LOCALE = 'en';
export const STORAGE_KEY = 'raydar_lang';

/**
 * Gets the stored language from localStorage if valid.
 */
export function getStoredLanguage() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const val = window.localStorage.getItem(STORAGE_KEY);
    return val === 'en' || val === 'fr' ? val : null;
  } catch {
    return null;
  }
}

/**
 * Persists the chosen language to localStorage.
 */
export function setStoredLanguage(lang) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (lang === 'en' || lang === 'fr') {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
  } catch (err) {
    console.warn('Could not persist language preference:', err);
  }
}

/**
 * Updates page title, meta description, and document lang attribute for SEO and accessibility.
 */
export function applyLocaleMetadata(lang) {
  if (typeof document === 'undefined') return;
  const data = LOCALES[lang] || LOCALES.en;

  // 1. Update <html lang="...">
  document.documentElement.lang = lang;

  // 2. Update <title>
  if (data.meta?.title) {
    document.title = data.meta.title;
  }

  // 3. Update meta description and og tags
  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta && data.meta?.description) {
    descMeta.setAttribute('content', data.meta.description);
  }
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && data.meta?.title) {
    ogTitle.setAttribute('content', data.meta.title);
  }
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc && data.meta?.description) {
    ogDesc.setAttribute('content', data.meta.description);
  }
}
