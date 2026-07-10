import React, { useState, useEffect } from 'react';
import { Globe, Film, Search, Zap, Hash } from 'lucide-react';

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
  const [localTagInput, setLocalTagInput] = useState(booruTags);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setLocalTagInput(booruTags);
  }, [booruTags]);

  useEffect(() => {
    if (!localTagInput || !localTagInput.trim()) {
      setSuggestions([]);
      return;
    }

    const words = localTagInput.split(/[ ,]+/);
    const lastWord = words[words.length - 1].trim();

    if (lastWord.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/booru/tags?site=${encodeURIComponent(selectedSite)}&query=${encodeURIComponent(lastWord)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Erro no autocomplete booru:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [localTagInput, selectedSite]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    onBooruTagsChange(localTagInput);
    if (onSearchSubmit) onSearchSubmit(localTagInput);
  };

  const handleSuggestionClick = (suggestionName) => {
    const words = localTagInput.split(/[ ,]+/);
    words.pop(); // Remove tag incompleta
    words.push(suggestionName);
    const newTags = words.filter(Boolean).join(' ');
    setLocalTagInput(newTags);
    setShowSuggestions(false);
    onBooruTagsChange(newTags);
    if (onSearchSubmit) onSearchSubmit(newTags);
  };

  const safeSites = Array.isArray(sites) ? sites : [];
  const currentSiteInfo = safeSites.find(s => s.id === selectedSite) || safeSites[0] || {};

  return (
    <div style={{ backgroundColor: '#0a0a0a', borderBottom: '1px solid #333', padding: '1.25rem 2rem' }}>
      {/* Top row: Mode Title & Site Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Globe size={20} color="#a78bfa" />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
            MOTOR DE BUSCA E HOTLINKING BOORU (@himeka/booru)
          </span>
          <span style={{ backgroundColor: 'rgba(167, 139, 250, 0.1)', border: '1px solid #a78bfa', color: '#a78bfa', fontSize: '0.7rem', padding: '0.2rem 0.6rem', fontFamily: 'JetBrains Mono, monospace' }}>
            PROXY STREAMING ATIVO
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
            TODAS AS MÍDIAS
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
            <Film size={14} /> SOMENTE VÍDEOS (.MP4/.WEBM)
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
              <div style={{ color: isSelected ? '#a78bfa' : '#fff' }}>{s.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 400 }}>{s.desc}</div>
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
            placeholder={`Buscar tags em "${currentSiteInfo.name || 'Booru'}" (ex: cyberpunk, neon, animated, explosion)...`}
            value={localTagInput}
            onChange={(e) => {
              setLocalTagInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
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
                zIndex: 9999,
                maxHeight: '280px',
                overflowY: 'auto',
                marginTop: '4px'
              }}
            >
              <div style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: '#888', borderBottom: '1px solid #222' }}>
                SUGESTÕES DE TAGS DA API ({currentSiteInfo.name || 'BOORU'}):
              </div>
              {suggestions.map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  onMouseDown={() => handleSuggestionClick(item.name)}
                  style={{
                    padding: '0.6rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.85rem',
                    borderBottom: '1px solid #1a1a1a',
                    color: '#fff'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#181818'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Hash size={14} /> {item.name}
                  </span>
                  {item.count > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>{item.count} mídias</span>
                  )}
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
          {loading ? 'BUSCANDO...' : 'CONSULTAR E STREAMING'}
        </button>
      </form>

      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#666', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Zap size={12} color="#a78bfa" />
        <span>Técnica de Hotlink Proxy habilitada: Os vídeos originais são transmitidos em tempo real pelo servidor sem erro de CORS/403. Clique em qualquer card para importar em definitivo ao seu feed!</span>
      </div>
    </div>
  );
}
