import { useState, useEffect } from 'react';
import { usePreferencesStore } from '../stores/preferencesStore';

// Import all translation files
import enTranslations from '../locales/en.json';
import esTranslations from '../locales/es.json';
import frTranslations from '../locales/fr.json';
import deTranslations from '../locales/de.json';
import itTranslations from '../locales/it.json';
import ptTranslations from '../locales/pt.json';
import jaTranslations from '../locales/ja.json';
import koTranslations from '../locales/ko.json';
import zhTranslations from '../locales/zh.json';

export interface Translation {
  [key: string]: any;
}

export const translations: { [locale: string]: Translation } = {
  en: enTranslations,
  es: esTranslations,
  fr: frTranslations,
  de: deTranslations,
  it: itTranslations,
  pt: ptTranslations,
  ja: jaTranslations,
  ko: koTranslations,
  zh: zhTranslations
};

// Get nested value from object using dot notation
const getNestedValue = (obj: any, path: string): string => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : path;
  }, obj);
};

// Simple translation function
export const t = (key: string, locale: string = 'en'): string => {
  const translation = translations[locale] || translations.en;
  return getNestedValue(translation, key);
};

// Enhanced hook for i18n connected to preferences store
export const useI18n = () => {
  const { preferences } = usePreferencesStore();
  const [currentLocale, setCurrentLocale] = useState(preferences.language || 'en');
  
  // Update locale when preference changes
  useEffect(() => {
    const newLocale = preferences.language || 'en';
    if (newLocale !== currentLocale) {
      setCurrentLocale(newLocale);
      console.log('🌍 Language changed to:', newLocale);
    }
  }, [preferences.language, currentLocale]);
  
  return {
    t: (key: string) => t(key, currentLocale),
    locale: currentLocale,
    setLocale: (locale: string) => {
      setCurrentLocale(locale);
      // Update preferences store
      const { updateThemeSetting } = usePreferencesStore.getState();
      updateThemeSetting('language', locale);
    }
  };
}; 