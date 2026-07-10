import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Globe, Film, Search, Zap, Hash, Loader2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

// Injeta o keyframe da animação uma única vez (evita depender do Tailwind,
// que é a razão do spinner girar aqui no preview mas não no seu site).
if (typeof document !== 'undefined' && !document.getElementById('boorubar-spin-keyframes')) {
  const styleTag = document.createElement('style');
  styleTag.id = 'boorubar-spin-keyframes';
  styleTag.textContent = `
    @keyframes boorubar-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleTag);
}

export default function BooruBar({
  sites = [],
  selectedSite = 'sb',
  onSelectSite,
  booruTags = '',
  onBooruTagsChange,
  booruType = 'all',
  onBooruTypeChange,
  onSearchSubmit,
  loading = false
}) {
  const { t } = useLanguage();
  const [localTagInput, setLocalTagInput] = useState(booruTags);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Controla requisições em voo para evitar que uma resposta antiga
  // sobrescreva uma mais nova (a causa da "instabilidade" original).
  const abortRef = useRef(null);
  const requestIdRef = useRef(0);
  const blurTimeoutRef = useRef(null);

  useEffect(() => {
    setLocalTagInput(booruTags);
  }, [booruTags]);

  useEffect(() => {
    // Sempre que o input muda, qualquer sugestão antiga fica obsoleta.
    setActiveIndex(-1);

    if (!localTagInput || !localTagInput.trim()) {
      setSuggestions([]);
      setSuggestLoading(false);
      return;
    }

    const words = localTagInput.split(/[ ,]+/);
    const lastWord = words[words.length - 1].trim();

    if (lastWord.length < 2) {
      setSuggestions([]);
      setSuggestLoading(false);
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setSuggestLoading(true);

    const timer = setTimeout(async () => {
      // Cancela a requisição anterior, se ainda estiver em andamento.
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `/api/booru/tags?site=${encodeURIComponent(selectedSite)}&query=${encodeURIComponent(lastWord)}`,
          { signal: controller.signal }
        );

        // Se outra requisição mais nova já foi disparada, ignora esta resposta.
        if (currentRequestId !== requestIdRef.current) return;

        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Erro no autocomplete booru:', err);
          if (currentRequestId === requestIdRef.current) setSuggestions([]);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) setSuggestLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localTagInput, selectedSite]);

  // Limpa qualquer timeout de blur pendente ao desmontar.
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const closeSuggestions = useCallback(() => {
    setShowSuggestions(false);
    setActiveIndex(-1);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    closeSuggestions();
    onBooruTagsChange(localTagInput);
    if (onSearchSubmit) onSearchSubmit(localTagInput);
  };

  const applySuggestion = useCallback((suggestionName) => {
    setLocalTagInput((prev) => {
      const words = prev.split(/[ ,]+/);
      words.pop(); // Remove tag incompleta
      words.push(suggestionName);
      const newTags = words.filter(Boolean).join(' ');
      onBooruTagsChange(newTags);
      if (onSearchSubmit) onSearchSubmit(newTags);
      return newTags;
    });
    // Evita que o efeito de autocomplete dispare de novo com o texto recém-aplicado.
    requestIdRef.current += 1;
    setSuggestions([]);
    closeSuggestions();
  }, [onBooruTagsChange, onSearchSubmit, closeSuggestions]);

  const handleSuggestionClick = (suggestionName) => {
    applySuggestion(suggestionName);
  };

  const handleInputBlur = () => {
    // Timeout curto só pra permitir que o onMouseDown da sugestão dispare antes do blur fechar a lista.
    blurTimeoutRef.current = setTimeout(() => closeSuggestions(), 150);
  };

  const handleInputFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    if (suggestions.length > 0) setShowSuggestions(true);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSuggestions();
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      applySuggestion(suggestions[activeIndex].name);
    }
  };

  const safeSites = Array.isArray(sites) ? sites : [];
  const getSiteName = (site) => {
    if (!site) return 'Booru';
    const trans = t(`booruSites.${site.id}.name`);
    return trans !== `booruSites.${site.id}.name` ? trans : (site.name || 'Booru');
  };
  const getSiteDesc = (site) => {
    if (!site) return '';
    const trans = t(`booruSites.${site.id}.desc`);
    return trans !== `booruSites.${site.id}.desc` ? trans : (site.desc || '');
  };
  const currentSiteInfo = safeSites.find(s => s.id === selectedSite) || safeSites[0] || {};

  return (
    <div style={{ backgroundColor: '#0a0a0a', borderBottom: '1px solid #333', padding: '1.25rem 2rem' }}>
      {/* Top row: Mode Title & Site Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Globe size={20} color="#a78bfa" />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
            {t('booruBar.title').toUpperCase()}
          </span>
          <span style={{ backgroundColor: 'rgba(167, 139, 250, 0.1)', border: '1px solid #a78bfa', color: '#a78bfa', fontSize: '0.7rem', padding: '0.2rem 0.6rem', fontFamily: 'JetBrains Mono, monospace' }}>
            {t('booruBar.proxyBadge').toUpperCase()}
          </span>
        </div>

        {/* Video Only Switch */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => onBooruTypeChange('all')}
            style={{
              background: booruType === 'all' ? '#fff' : '#111',
              color: booruType === 'all' ? '#000' : '#888',
              border: '1px solid #333',
              padding: '0 0.85rem',
              height: '34px',
              boxSizing: 'border-box',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            {t('booruBar.allMedia').toUpperCase()}
          </button>
          <button
            type="button"
            onClick={() => onBooruTypeChange('video')}
            style={{
              background: booruType === 'video' ? '#a78bfa' : '#111',
              color: booruType === 'video' ? '#000' : '#a78bfa',
              border: '1px solid #a78bfa',
              padding: '0 0.85rem',
              height: '34px',
              boxSizing: 'border-box',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: booruType === 'video' ? '0 0 12px rgba(167, 139, 250, 0.4)' : 'none'
            }}
          >
            <Film size={14} /> {t('booruBar.videoOnly').toUpperCase()}
          </button>
        </div>
      </div>

      {/* Sites Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {safeSites.map((s) => {
          const isSelected = s.id === selectedSite;
          return (
            <button
              type="button"
              key={s.id}
              onClick={() => onSelectSite(s.id)}
              style={{
                backgroundColor: isSelected ? '#1a1a1a' : '#050505',
                border: `1px solid ${isSelected ? '#a78bfa' : '#222'}`,
                color: isSelected ? '#fff' : '#777',
                padding: '0.55rem 1rem',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.85rem',
                fontWeight: isSelected ? 800 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.2rem'
              }}
              onMouseEnter={(e) => !isSelected && (e.currentTarget.style.borderColor = '#444')}
              onMouseLeave={(e) => !isSelected && (e.currentTarget.style.borderColor = '#222')}
            >
              <div style={{ color: isSelected ? '#a78bfa' : '#fff' }}>{getSiteName(s)}</div>
              <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 400 }}>{getSiteDesc(s)}</div>
            </button>
          );
        })}
      </div>

      {/* Search Input Box with Live Autocomplete */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
          <input
            type="text"
            placeholder={t('booruBar.searchPlaceholder', { site: getSiteName(currentSiteInfo) })}
            value={localTagInput}
            onChange={(e) => {
              setLocalTagInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              height: '44px',
              boxSizing: 'border-box',
              backgroundColor: '#000000',
              border: '1px solid #444',
              color: '#fff',
              padding: '0 1rem 0 3rem',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.9rem'
            }}
          />

          {showSuggestions && (suggestLoading || suggestions.length > 0) && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#0c0c0c',
                border: '1px solid #a78bfa',
                boxShadow: '8px 8px 0px rgba(167, 139, 250, 0.2)',
                zIndex: 9999,
                maxHeight: '280px',
                overflowY: 'auto',
                marginTop: '4px'
              }}
            >
              <div style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: '#888', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {suggestLoading && (
                  <Loader2
                    size={12}
                    color="#a78bfa"
                    style={{ animation: 'boorubar-spin 0.8s linear infinite' }}
                  />
                )}
                {t('booruBar.suggestionsTitle', { site: currentSiteInfo.name || 'BOORU' }).toUpperCase()}
              </div>
              {suggestions.map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  onMouseDown={() => handleSuggestionClick(item.name)}
                  onMouseEnter={(e) => {
                    setActiveIndex(idx);
                    e.currentTarget.style.backgroundColor = '#181818';
                  }}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx === activeIndex ? '#181818' : 'transparent')}
                  style={{
                    padding: '0.6rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.85rem',
                    borderBottom: '1px solid #1a1a1a',
                    color: '#fff',
                    backgroundColor: idx === activeIndex ? '#181818' : 'transparent'
                  }}
                >
                  <span style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                    <Hash size={14} /> {item.name}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    color: item.count > 0 ? '#00ff66' : '#888',
                    backgroundColor: item.count > 0 ? '#09150e' : '#111',
                    border: `1px solid ${item.count > 0 ? '#00ff66' : '#222'}`,
                    padding: '0.2rem 0.6rem',
                    fontWeight: 700,
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>
                    {item.count > 0 ? t('booruBar.resultsCount', { count: Number(item.count).toLocaleString('pt-BR') }) : t('booruBar.tagAvailable')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ height: '44px', padding: '0 1.75rem', boxSizing: 'border-box' }}
        >
          {loading ? t('booruBar.searching').toUpperCase() : t('booruBar.searchSubmit').toUpperCase()}
        </button>
      </form>

      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#666', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Zap size={12} color="#a78bfa" />
        <span>{t('booruBar.footerHint')}</span>
      </div>
    </div>
  );
}