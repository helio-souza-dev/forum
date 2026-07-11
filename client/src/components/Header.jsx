import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Terminal, Hash, X, Globe, Database, User, Image as ImageIcon, Video, ArrowRight } from 'lucide-react';
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
  onOpenProfile,
  onBooruSearchSubmit,
  booruTags = '',
  onSelectPost
}) {
  const { t } = useLanguage();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [universalResults, setUniversalResults] = useState({ users: [], posts: [], tags: [] });
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const searchContainerRef = useRef(null);

  const safeTags = Array.isArray(allTags) ? allTags : [];
  const safeSelectedTags = Array.isArray(selectedTags) ? selectedTags : [];

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca universal debounced (usuários, posts e tags)
  useEffect(() => {
    if (!searchQuery || !searchQuery.trim()) {
      setUniversalResults({ users: [], posts: [], tags: [] });
      return;
    }
    const cleanQ = searchQuery.trim();
    setLoadingSuggest(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(cleanQ)}`);
        if (res.ok) {
          const data = await res.json();
          setUniversalResults(data || { users: [], posts: [], tags: [] });
        }
      } catch (err) {
        console.error('Erro em busca universal:', err);
      } finally {
        setLoadingSuggest(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

      {/* BARRA DE PESQUISA DO SITE (USUÁRIOS E POSTS) */}
      <div ref={searchContainerRef} className="search-container" style={{ flex: 1, maxWidth: '680px', position: 'relative' }}>
        <Search size={18} className="search-icon" style={{ color: '#a78bfa' }} />
        <input
          type="text"
          className="search-input"
          placeholder="Pesquisar usuários e posts do site... (Enter para buscar)"
          value={searchQuery}
          onChange={(e) => {
            if (onSearchChange) onSearchChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setShowSuggestions(false);
              if (onSearchChange) {
                onSearchChange(searchQuery);
              }
            }
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              if (onSearchChange) onSearchChange('');
              setUniversalResults({ users: [], posts: [], tags: [] });
            }}
            style={{
              position: 'absolute',
              right: '0.75rem',
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        )}

        {/* PAINEL DE SUGESTÕES (USUÁRIOS E POSTS DO SITE) */}
        {showSuggestions && searchQuery.trim() && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#0a0a0c',
              border: '1px solid #a78bfa',
              boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 15px rgba(167, 139, 250, 0.2)',
              zIndex: 9999,
              marginTop: '6px',
              borderRadius: '8px',
              maxHeight: '420px',
              overflowY: 'auto',
              fontFamily: 'JetBrains Mono, monospace'
            }}
          >
            {/* 1. USUÁRIOS */}
            {universalResults.users && universalResults.users.length > 0 && (
              <div style={{ borderBottom: '1px solid #1c1c22' }}>
                <div style={{ padding: '0.5rem 0.9rem', fontSize: '0.75rem', color: '#888', backgroundColor: '#111116', fontWeight: 800 }}>
                  USUÁRIOS ENCONTRADOS
                </div>
                {universalResults.users.map((u, idx) => (
                  <div
                    key={`user-${u.username}-${idx}`}
                    onMouseDown={() => {
                      if (onOpenProfile) onOpenProfile(u.username);
                      setShowSuggestions(false);
                    }}
                    style={{
                      padding: '0.65rem 1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #16161c',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#181822'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.username} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #a78bfa' }} />
                      ) : (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1c1628', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem' }}>
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span style={{ color: '#fff', fontWeight: 800 }}>@{u.username}</span>
                      {u.role && u.role !== 'user' && (
                        <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', border: u.role === 'admin' || u.role === 'dev' ? '1px solid #ff0055' : '1px solid #00ff66', color: u.role === 'admin' || u.role === 'dev' ? '#ff0055' : '#00ff66' }}>
                          {u.role.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>{u.followersCount || 0} SEGUIDORES</span>
                  </div>
                ))}
              </div>
            )}

            {/* 2. POSTS LOCAL */}
            {universalResults.posts && universalResults.posts.length > 0 && (
              <div style={{ borderBottom: '1px solid #1c1c22' }}>
                <div style={{ padding: '0.5rem 0.9rem', fontSize: '0.75rem', color: '#888', backgroundColor: '#111116', fontWeight: 800 }}>
                  POSTS ENCONTRADOS
                </div>
                {universalResults.posts.map((p, idx) => (
                  <div
                    key={`post-${p.id}-${idx}`}
                    onMouseDown={() => {
                      if (onModeChange && mode !== 'local') onModeChange('local');
                      if (onSelectPost) onSelectPost(p);
                      else if (onSearchChange) onSearchChange(p.title);
                      setShowSuggestions(false);
                    }}
                    style={{
                      padding: '0.65rem 1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #16161c'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#181822'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                      {p.type === 'video' ? <Video size={16} color="#38bdf8" flexShrink={0} /> : <ImageIcon size={16} color="#a78bfa" flexShrink={0} />}
                      <span style={{ color: '#ccc', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '380px' }}>
                        {p.title}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#666', flexShrink: 0 }}>por @{p.uploader}</span>
                  </div>
                ))}
              </div>
            )}

            {/* BOTÃO NO RODAPÉ DO DROPDOWN */}
            <div style={{ display: 'flex', borderTop: '1px solid #222', backgroundColor: '#101014', padding: '0.5rem' }}>
              <button
                type="button"
                onMouseDown={() => {
                  if (onModeChange && mode !== 'local') onModeChange('local');
                  if (onSearchChange) onSearchChange(searchQuery);
                  setShowSuggestions(false);
                }}
                style={{ flex: 1, background: 'transparent', border: 'none', color: '#a78bfa', padding: '0.5rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Database size={13} /> Filtrar posts com "{searchQuery}" no Feed Local
              </button>
            </div>
          </div>
        )}
      </div>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', background: '#08080a', border: '1px solid #282830', borderRadius: '30px', padding: '0.25rem 0.75rem 0.25rem 0.35rem', height: '46px', boxSizing: 'border-box', transition: 'border-color 0.2s', boxShadow: '0 0 15px rgba(0,0,0,0.5)' }}>
            <button
              type="button"
              onClick={() => onOpenProfile && onOpenProfile(currentUser.username)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
              title={t('header.openProfile')}
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.username}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #a78bfa', boxShadow: '0 0 10px rgba(167, 139, 250, 0.4)' }}
                />
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#181028', border: '2px solid #a78bfa', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '1.05rem', fontWeight: 900, boxShadow: '0 0 10px rgba(167, 139, 250, 0.4)' }}>
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>
                @{currentUser.username}
              </span>
            </button>
            
            <button
              type="button"
              onClick={onLogout}
              style={{ background: 'transparent', border: 'none', color: '#ff5588', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s', marginLeft: '0.3rem' }}
              title={t('header.logout')}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ff0055'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#ff5588'}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', border: '1px solid #ff3366', borderRadius: '12px', padding: '0.2rem 0.65rem', background: 'rgba(255, 0, 85, 0.08)' }}>
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
