/**
 * i18next configuration for QuotaDeck AI.
 *
 * Supports English, Spanish (LATAM), and Portuguese (Brazil).
 * Default language is Spanish since this is a LATAM-focused tool.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en/translation.json";
import es from "./locales/es/translation.json";
import pt from "./locales/pt/translation.json";

const resources = {
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "es", // Default to Spanish for LATAM market
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes by default
  },
  react: {
    useSuspense: false, // Avoid loading flicker in desktop app
  },
});

export default i18n;
