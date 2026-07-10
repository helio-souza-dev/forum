import React from 'react';
import MediaCard from './MediaCard';
import { Film, Image as ImageIcon, Zap, Grid, Flame, Clock, Heart, Terminal } from 'lucide-react';

export default function MediaFeed({
  posts = [],
  loading = false,
  selectedType = 'all',
  onSelectType,
  sortBy = 'popular',
  onSortChange,
  onCardClick,
  onLike,
  onTagClick,
  selectedTags = [],
  searchQuery = ''
}) {
  return (
    <main className="feed-section">
      {/* Type Tabs */}
      <div className="tabs-bar">
        <button
          className={`tab-item ${selectedType === 'all' ? 'active' : ''}`}
          onClick={() => onSelectType('all')}
        >
          <Grid size={16} /> TODOS OS ITENS
        </button>
        <button
          className={`tab-item ${selectedType === 'video' ? 'active' : ''}`}
          onClick={() => onSelectType('video')}
        >
          <Film size={16} color="#a78bfa" /> VÍDEOS
        </button>
        <button
          className={`tab-item ${selectedType === 'image' ? 'active' : ''}`}
          onClick={() => onSelectType('image')}
        >
          <ImageIcon size={16} color="#a855f7" /> IMAGENS
        </button>
        <button
          className={`tab-item ${selectedType === 'gif' ? 'active' : ''}`}
          onClick={() => onSelectType('gif')}
        >
          <Zap size={16} color="#00ff66" /> GIFS
        </button>
      </div>

      {/* Header Info & Sorting */}
      <div className="feed-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="font-mono" style={{ fontSize: '0.85rem', color: '#888' }}>
            EXIBINDO <strong style={{ color: '#fff' }}>{posts.length}</strong> ITENS NO FEED LOCAL
          </span>
          {(selectedTags.length > 0 || searchQuery) && (
            <span style={{ fontSize: '0.75rem', backgroundColor: '#1a1a1a', border: '1px solid #a78bfa', color: '#a78bfa', padding: '0.2rem 0.6rem', fontFamily: 'JetBrains Mono, monospace' }}>
              FILTRO ATIVO
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="font-mono" style={{ fontSize: '0.75rem', color: '#666', marginRight: '0.5rem' }}>
            ORDENAR POR:
          </span>
          <button
            onClick={() => onSortChange('popular')}
            style={{
              background: sortBy === 'popular' ? '#fff' : '#0c0c0c',
              color: sortBy === 'popular' ? '#000' : '#888',
              border: '1px solid #333',
              padding: '0 0.85rem',
              height: '34px',
              boxSizing: 'border-box',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Flame size={13} color={sortBy === 'popular' ? '#ff0055' : '#888'} /> EM ALTA
          </button>
          <button
            onClick={() => onSortChange('newest')}
            style={{
              background: sortBy === 'newest' ? '#fff' : '#0c0c0c',
              color: sortBy === 'newest' ? '#000' : '#888',
              border: '1px solid #333',
              padding: '0 0.85rem',
              height: '34px',
              boxSizing: 'border-box',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Clock size={13} /> MAIS RECENTES
          </button>
          <button
            onClick={() => onSortChange('likes')}
            style={{
              background: sortBy === 'likes' ? '#fff' : '#0c0c0c',
              color: sortBy === 'likes' ? '#000' : '#888',
              border: '1px solid #333',
              padding: '0 0.85rem',
              height: '34px',
              boxSizing: 'border-box',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Heart size={13} /> CURTIDAS
          </button>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', fontFamily: 'JetBrains Mono, monospace', color: '#a78bfa' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>SISTEMA CARREGANDO MÍDIAS...</div>
          <div style={{ color: '#666', fontSize: '0.85rem' }}>Buscando arquivos e tags no banco de dados local.</div>
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 1rem', border: '1px dashed #333', backgroundColor: '#050505' }}>
          <Terminal size={48} color="#444" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontFamily: 'JetBrains Mono, monospace' }}>
            NENHUM REGISTRO ENCONTRADO
          </h3>
          <p style={{ color: '#888', maxWidth: '400px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
            Não encontramos nenhum vídeo, imagem ou GIF correspondente às suas tags ou busca atual.
          </p>
          {(selectedTags.length > 0 || searchQuery || selectedType !== 'all') && (
            <button
              className="btn btn-primary"
              onClick={() => {
                onSelectType('all');
                onTagClick(null, true);
              }}
            >
              REDEFINIR TODOS OS FILTROS
            </button>
          )}
        </div>
      ) : (
        <div className="masonry-grid">
          {posts.map((post) => (
            <MediaCard
              key={post.id}
              post={post}
              onCardClick={onCardClick}
              onLike={onLike}
              onTagClick={onTagClick}
            />
          ))}
        </div>
      )}
    </main>
  );
}
