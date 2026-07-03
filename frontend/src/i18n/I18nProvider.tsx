import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { LANGUAGE_STORAGE_KEY, supportedLanguages, translations, type Language } from "./translations";

type TranslationValue = string | { [key: string]: TranslationValue };
const blockedTranslationKeys = new Set(["__proto__", "prototype", "constructor"]);

export interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string, replacements?: Record<string, string>) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

function isSupportedLanguage(value: string | null): value is Language {
  return supportedLanguages.includes(value as Language);
}

function getInitialLanguage(): Language {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("lang");
  if (isSupportedLanguage(fromUrl)) return fromUrl;

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (isSupportedLanguage(stored)) return stored;

  return "fr";
}

function readTranslation(language: Language, key: string): string | null {
  const parts = key.split(".");
  let value: TranslationValue = translations[language];

  for (const part of parts) {
    if (
      part === ""
      || blockedTranslationKeys.has(part)
      || !value
      || typeof value === "string"
      || !Object.hasOwn(value, part)
    ) {
      return null;
    }

    const descriptor = Object.getOwnPropertyDescriptor(value, part);

    if (!descriptor || !("value" in descriptor)) {
      return null;
    }

    value = descriptor.value;
  }

  return typeof value === "string" ? value : null;
}

function formatValue(value: string, replacements: Record<string, string> = {}) {
  return Object.entries(replacements).reduce(
    (result, [key, replacement]) => result.split(`{${key}}`).join(replacement),
    value,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((current) => (current === "fr" ? "en" : "fr"));
  }, []);

  const t = useCallback(
    (key: string, fallback = key, replacements: Record<string, string> = {}) =>
      formatValue(readTranslation(language, key) ?? readTranslation("fr", key) ?? fallback, replacements),
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, toggleLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
