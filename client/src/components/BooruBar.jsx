import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Globe, Film, Search, Zap, Hash, Loader2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import AgeGateModal from './AgeGateModal';

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
  currentUser,
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
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [pendingSiteId, setPendingSiteId] = useState(null);

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

  const contentPref = currentUser?.contentPreference || localStorage.getItem('user_content_pref') || 'blur';
  const rawSites = Array.isArray(sites) ? sites : [];
  const safeSites = rawSites.filter(s => {
    if (contentPref === 'hide_mature') {
      return s.id === 'sb' || (s.name && s.name.toLowerCase().includes('safebooru')) || (s.domain && s.domain.toLowerCase().includes('safebooru'));
    }
    return true;
  });

  const handleSiteClick = (siteId) => {
    const siteObj = rawSites.find(s => s.id === siteId);
    const isSafe = siteId === 'sb' || siteObj?.name?.toLowerCase().includes('safebooru') || siteObj?.domain?.toLowerCase().includes('safebooru');
    if (!isSafe) {
      const storedVerified = localStorage.getItem('age_verified');
      const storedMode = localStorage.getItem('booru_nsfw_mode');
      if (storedVerified !== 'verified_adult' || !storedMode) {
        setPendingSiteId(siteId);
        setShowAgeGate(true);
        return;
      }
    }
    onSelectSite(siteId);
  };

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
              onClick={() => handleSiteClick(s.id)}
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

      {/* Booru Tag Search Station (Exclusiva para o Booru selecionado) */}
      <div style={{ marginTop: '1.25rem', backgroundColor: '#0d0d12', border: '1px solid #2d2640', borderRadius: '8px', padding: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Hash size={16} /> TAGS DO BOORU — {getSiteName(currentSiteInfo).toUpperCase()}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>
            {getSiteDesc(currentSiteInfo) || 'Explore milhares de artes, gifs e vídeos por tags'}
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#a78bfa' }} />
            <input
              type="text"
              placeholder={`Pesquisar tags em ${getSiteName(currentSiteInfo)} (ex: animated loop highres)...`}
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
                height: '46px',
                boxSizing: 'border-box',
                backgroundColor: '#050508',
                border: '1px solid #4a3875',
                borderRadius: '6px',
                color: '#fff',
                padding: '0 1rem 0 3rem',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.9rem',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)'
              }}
            />

            {showSuggestions && (suggestLoading || suggestions.length > 0) && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#0c0c10',
                  border: '1px solid #a78bfa',
                  borderRadius: '6px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.9), 0 0 15px rgba(167, 139, 250, 0.25)',
                  zIndex: 9999,
                  maxHeight: '300px',
                  overflowY: 'auto',
                  marginTop: '6px'
                }}
              >
                <div style={{ padding: '0.5rem 0.9rem', fontSize: '0.75rem', color: '#a78bfa', backgroundColor: '#14111f', borderBottom: '1px solid #2a223d', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
                  {suggestLoading && (
                    <Loader2
                      size={13}
                      color="#a78bfa"
                      style={{ animation: 'boorubar-spin 0.8s linear infinite' }}
                    />
                  )}
                  SUGESTÕES DE TAGS PARA {getSiteName(currentSiteInfo).toUpperCase()}
                </div>
                {suggestions.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    onMouseDown={() => handleSuggestionClick(item.name)}
                    onMouseEnter={(e) => {
                      setActiveIndex(idx);
                      e.currentTarget.style.backgroundColor = '#1d182e';
                    }}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx === activeIndex ? '#1d182e' : 'transparent')}
                    style={{
                      padding: '0.65rem 1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.85rem',
                      borderBottom: '1px solid #1a1625',
                      color: '#fff',
                      backgroundColor: idx === activeIndex ? '#1d182e' : 'transparent',
                      transition: 'background 0.15s'
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
                      borderRadius: '4px',
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
            style={{ height: '46px', padding: '0 1.75rem', boxSizing: 'border-box', borderRadius: '6px', fontWeight: 800 }}
          >
            {loading ? t('booruBar.searching').toUpperCase() : t('booruBar.searchSubmit').toUpperCase()}
          </button>
        </form>
      </div>

      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#666', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Zap size={12} color="#a78bfa" />
        <span>{t('booruBar.footerHint')}</span>
      </div>

      {showAgeGate && (
        <AgeGateModal
          isOpen={showAgeGate}
          isBooruGate={true}
          onClose={() => setShowAgeGate(false)}
          onSuccess={({ booruMode }) => {
            setShowAgeGate(false);
            if (pendingSiteId) {
              onSelectSite(pendingSiteId);
              setPendingSiteId(null);
            }
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}