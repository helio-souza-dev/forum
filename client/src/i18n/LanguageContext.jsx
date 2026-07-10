import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { translations } from './translations';

export const LANGUAGES = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
];

const STORAGE_KEY = 'prismshare_lang';
const DEFAULT_LANG = 'pt';

const LanguageContext = createContext(null);

function detectInitialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) return saved;
  } catch {
    // localStorage indisponível (modo privado, etc.) — ignora e usa o padrão
  }
  const browserLang = (navigator.language || '').slice(0, 2);
  return translations[browserLang] ? browserLang : DEFAULT_LANG;
}

// Busca "header.login" dentro do dicionário do idioma atual.
// Se a chave não existir no idioma escolhido, cai para o pt como fallback
// e, por último, retorna a própria chave (facilita notar strings faltando).
function lookup(dict, fallbackDict, key) {
  const parts = key.split('.');
  let node = dict;
  for (const p of parts) {
    node = node?.[p];
    if (node === undefined) break;
  }
  if (node === undefined) {
    node = fallbackDict;
    for (const p of parts) {
      node = node?.[p];
      if (node === undefined) break;
    }
  }
  return node === undefined ? key : node;
}

function interpolate(str, vars) {
  if (typeof str !== 'string' || !vars) return str;
  return str.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang);

  const setLang = useCallback((code) => {
    if (!translations[code]) return;
    setLangState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // sem localStorage disponível — segue apenas em memória
    }
  }, []);

  const t = useCallback((key, vars) => {
    const value = lookup(translations[lang], translations[DEFAULT_LANG], key);
    return interpolate(value, vars);
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t, languages: LANGUAGES }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage precisa ser usado dentro de <LanguageProvider>');
  }
  return ctx;
}
