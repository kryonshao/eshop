import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationEn from './locales/en-US.json';
import translationZh from './locales/zh-CN.json';
import translationJa from './locales/ja-JP.json';
import translationKo from './locales/ko-KR.json';

export type Locale = 'en-US' | 'zh-CN' | 'ja-JP' | 'ko-KR';

const resources = {
  'en-US': {
    translation: translationEn,
  },
  'zh-CN': {
    translation: translationZh,
  },
  'ja-JP': {
    translation: translationJa,
  },
  'ko-KR': {
    translation: translationKo,
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
