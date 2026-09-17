import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from '../i18n/en.json';
import hiTranslations from '../i18n/hi.json';

const LanguageContext = createContext();

const translationsMap = {
  en: enTranslations,
  hi: hiTranslations
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('mota_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('mota_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLanguage = (selectedLang) => {
    setLang(selectedLang);
  };

  /**
   * Translate helper with nested key lookup (e.g., t('nav.home'))
   */
  const t = (pathKey, fallback = '') => {
    const currentDict = translationsMap[lang] || enTranslations;
    const parts = pathKey.split('.');
    let cur = currentDict;

    for (const p of parts) {
      if (cur && cur[p] !== undefined) {
        cur = cur[p];
      } else {
        return fallback || pathKey;
      }
    }

    return cur !== undefined ? cur : (fallback || pathKey);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
