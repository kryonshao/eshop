import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationEn from './locales/en-US.json';
import translationZh from './locales/zh-CN.json';
import translationEs from './locales/es-ES.json';
import translationFr from './locales/fr-FR.json';
import translationDe from './locales/de-DE.json';

export type Locale = 'en-US' | 'zh-CN' | 'es-ES' | 'fr-FR' | 'de-DE';

const resources = {
  'en-US': {
    translation: translationEn,
  },
  'zh-CN': {
    translation: translationZh,
  },
  'es-ES': {
    translation: translationEs,
  },
  'fr-FR': {
    translation: translationFr,
  },
  'de-DE': {
    translation: translationDe,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh-CN',
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
    },
    interpolation: {
      escapeValue: false,
    },
    debug: false,
  });

export default i18n;