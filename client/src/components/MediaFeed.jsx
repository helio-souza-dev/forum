import React from 'react';
import MediaCard from './MediaCard';
import AdCard from './AdCard';
import { Film, Image as ImageIcon, Zap, Grid, Flame, Clock, Heart, Terminal } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

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
  searchQuery = '',
  onOpenProfile,
  currentUser = null
}) {
  const { t } = useLanguage();
  return (
    <main className="feed-section">
      {/* Type Tabs */}
      <div className="tabs-bar">
        <button
          className={`tab-item ${selectedType === 'all' ? 'active' : ''}`}
          onClick={() => onSelectType('all')}
        >
          <Grid size={16} /> {t('mediaFeed.all').toUpperCase()}
        </button>
        <button
          className={`tab-item ${selectedType === 'video' ? 'active' : ''}`}
          onClick={() => onSelectType('video')}
        >
          <Film size={16} color="#a78bfa" /> {t('mediaFeed.video').toUpperCase()}
        </button>
        <button
          className={`tab-item ${selectedType === 'image' ? 'active' : ''}`}
          onClick={() => onSelectType('image')}
        >
          <ImageIcon size={16} color="#a855f7" /> {t('mediaFeed.image').toUpperCase()}
        </button>
        <button
          className={`tab-item ${selectedType === 'gif' ? 'active' : ''}`}
          onClick={() => onSelectType('gif')}
        >
          <Zap size={16} color="#00ff66" /> {t('mediaFeed.gif').toUpperCase()}
        </button>
      </div>

      {/* Header Info & Sorting */}
      <div className="feed-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="font-mono" style={{ fontSize: '0.85rem', color: '#888' }}>
            {t('mediaFeed.showingItems', { count: posts.length })}
          </span>
          {(selectedTags.length > 0 || searchQuery) && (
            <span style={{ fontSize: '0.75rem', backgroundColor: '#1a1a1a', border: '1px solid #a78bfa', color: '#a78bfa', padding: '0.2rem 0.6rem', fontFamily: 'JetBrains Mono, monospace' }}>
              {t('mediaFeed.filterActive').toUpperCase()}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="font-mono" style={{ fontSize: '0.75rem', color: '#666', marginRight: '0.5rem' }}>
            {t('mediaFeed.sortBy').toUpperCase()}:
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
            <Flame size={13} color={sortBy === 'popular' ? '#ff0055' : '#888'} /> {t('mediaFeed.sortPopular').toUpperCase()}
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
            <Clock size={13} /> {t('mediaFeed.sortNewest').toUpperCase()}
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
            <Heart size={13} /> {t('mediaFeed.sortLikes').toUpperCase()}
          </button>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', fontFamily: 'JetBrains Mono, monospace', color: '#a78bfa' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{t('mediaFeed.loadingMedia').toUpperCase()}</div>
          <div style={{ color: '#666', fontSize: '0.85rem' }}>{t('mediaFeed.loadingSubtext')}</div>
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 1rem', border: '1px dashed #333', backgroundColor: '#050505' }}>
          <Terminal size={48} color="#444" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontFamily: 'JetBrains Mono, monospace' }}>
            {t('mediaFeed.emptyTitle').toUpperCase()}
          </h3>
          <p style={{ color: '#888', maxWidth: '400px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
            {t('mediaFeed.emptyText')}
          </p>
          {(selectedTags.length > 0 || searchQuery || selectedType !== 'all') && (
            <button
              className="btn btn-primary"
              onClick={() => {
                onSelectType('all');
                onTagClick(null, true);
              }}
            >
              {t('mediaFeed.resetFilters').toUpperCase()}
            </button>
          )}
        </div>
      ) : (
        <div className="masonry-grid">
          {posts.map((post, index) => (
            <React.Fragment key={post.id || index}>
              <MediaCard
                post={post}
                currentUser={currentUser}
                onCardClick={onCardClick}
                onLike={onLike}
                onTagClick={onTagClick}
                onOpenProfile={onOpenProfile}
              />
              {(index + 1) % 8 === 0 && (
                <AdCard currentUser={currentUser} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </main>
  );
}
