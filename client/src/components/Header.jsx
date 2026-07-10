import React, { useState, useEffect } from 'react';
import { Search, Plus, Terminal, Hash, X, Globe, Database } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';

export default function Header({ 
  searchQuery, 
  onSearchChange, 
  onOpenUpload, 
  allTags = [], 
  onSelectTag,
  selectedTags = [],
  mode = 'local',
  onModeChange,
  currentUser = null,
  onOpenAuth,
  onLogout,
  onOpenProfile
}) {
  const { t } = useLanguage();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const safeTags = Array.isArray(allTags) ? allTags : [];
  const safeSelectedTags = Array.isArray(selectedTags) ? selectedTags : [];

  useEffect(() => {
    if (!searchQuery.trim() || mode === 'booru') {
      setSuggestions([]);
      return;
    }
    const cleanQ = searchQuery.toLowerCase().replace(/^#/, '').trim();
    const matches = safeTags.filter(t => t && t.name && t.name.includes(cleanQ));
    setSuggestions(matches.slice(0, 6));
  }, [searchQuery, safeTags, mode]);

  const handleSuggestionClick = (tagObject) => {
    if (onSelectTag && tagObject) onSelectTag(tagObject.name);
    if (onSearchChange) onSearchChange('');
    setShowSuggestions(false);
  };

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <a href="#" className="logo-text" onClick={(e) => { e.preventDefault(); window.location.reload(); }}>
          <Terminal size={22} color="#a78bfa" />
          <span>PRISM<span style={{ color: '#a78bfa' }}>SHARE</span></span>
        </a>

        {/* Mode Switcher */}
        <div style={{ display: 'flex', border: '1px solid #333', backgroundColor: '#080808', height: '38px', boxSizing: 'border-box' }}>
          <button
            type="button"
            onClick={() => onModeChange && onModeChange('local')}
            style={{
              backgroundColor: mode === 'local' ? '#fff' : 'transparent',
              color: mode === 'local' ? '#000' : '#888',
              border: 'none',
              padding: '0 1rem',
              height: '100%',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8rem',
              fontWeight: mode === 'local' ? 800 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Database size={14} color={mode === 'local' ? '#000' : '#888'} />
            {t('header.tabLocal')}
          </button>
          <button
            type="button"
            onClick={() => onModeChange && onModeChange('booru')}
            style={{
              backgroundColor: mode === 'booru' ? '#a78bfa' : 'transparent',
              color: mode === 'booru' ? '#000' : '#a78bfa',
              border: 'none',
              padding: '0 1rem',
              height: '100%',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8rem',
              fontWeight: mode === 'booru' ? 800 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Globe size={14} color={mode === 'booru' ? '#000' : '#a78bfa'} />
            {t('header.tabBooru')}
          </button>
        </div>
      </div>

      {mode === 'local' ? (
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={t('header.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => {
              if (onSearchChange) onSearchChange(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange && onSearchChange('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                background: 'none',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              <X size={16} />
            </button>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#0c0c0c',
                border: '1px solid #a78bfa',
                boxShadow: '8px 8px 0px rgba(167, 139, 250, 0.2)',
                zIndex: 999,
                marginTop: '4px'
              }}
            >
              <div style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: '#888', borderBottom: '1px solid #222' }}>
                {t('header.tagSuggestions')}
              </div>
              {suggestions.map((tagObj, idx) => {
                const isSelected = safeSelectedTags.includes(tagObj.name);
                return (
                  <div
                    key={`${tagObj.name}-${idx}`}
                    onMouseDown={() => handleSuggestionClick(tagObj)}
                    style={{
                      padding: '0.6rem 1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.85rem',
                      borderBottom: '1px solid #1a1a1a',
                      backgroundColor: isSelected ? '#1a1a1a' : 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#151515'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSelected ? '#1a1a1a' : 'transparent'}
                  >
                    <span style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Hash size={14} /> {tagObj.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>{t('header.mediaCount', { count: tagObj.count })}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, textAlign: 'center', color: '#888', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }}>
          {t('header.exploringExternal')}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <LanguageSelector />

        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'dev') && (
          <button
            type="button"
            className="btn-sm"
            onClick={() => onModeChange && onModeChange(currentUser.role)}
            style={{
              background: (mode === 'admin' || mode === 'dev') ? '#a78bfa' : 'transparent',
              border: '1px solid #a78bfa',
              color: (mode === 'admin' || mode === 'dev') ? '#000000' : '#a78bfa',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 0.8rem',
              height: '34px',
              boxSizing: 'border-box'
            }}
          >
            {t('header.panelButton', { role: currentUser.role.toUpperCase() })}
          </button>
        )}

        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#08080a', border: '1px solid #282830', borderRadius: '24px', padding: '0.2rem 0.6rem 0.2rem 0.3rem', height: '38px', boxSizing: 'border-box', transition: 'border-color 0.2s' }}>
            <button
              type="button"
              onClick={() => onOpenProfile && onOpenProfile(currentUser.username)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
              title={t('header.openProfile')}
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.username}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #a78bfa' }}
                />
              ) : (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#181028', border: '1px solid #a78bfa', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', fontWeight: 900 }}>
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
                @{currentUser.username}
              </span>
            </button>
            
            <button
              type="button"
              onClick={onLogout}
              style={{ background: 'transparent', border: 'none', color: '#ff5588', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s', marginLeft: '0.2rem' }}
              title={t('header.logout')}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ff0055'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#ff5588'}
            >
              <span style={{ fontSize: '0.7rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', border: '1px solid #ff3366', borderRadius: '12px', padding: '0.15rem 0.55rem', background: 'rgba(255, 0, 85, 0.08)' }}>
                {t('header.logout').toUpperCase()}
              </span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="btn"
            style={{
              background: 'transparent',
              border: '1px solid #a78bfa',
              color: '#a78bfa',
              fontWeight: 800
            }}
          >
            <span>{t('header.login')}</span>
          </button>
        )}

        <button type="button" className="btn btn-primary" onClick={onOpenUpload}>
          <Plus size={18} />
          <span>{t('header.uploadMedia')}</span>
        </button>
      </div>
    </header>
  );
}
