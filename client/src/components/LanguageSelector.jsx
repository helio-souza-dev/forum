import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageSelector() {
  const { lang, setLang, languages, t } = useLanguage();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        border: '1px solid #333',
        backgroundColor: '#0a0a0a',
        height: '34px',
        padding: '0 0.6rem',
        boxSizing: 'border-box',
      }}
      title={t('header.language')}
    >
      <Languages size={14} color="#888" />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        aria-label={t('header.language')}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#ccc',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code} style={{ backgroundColor: '#0a0a0a', color: '#fff' }}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
