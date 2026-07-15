import React, { useRef, useState, useEffect } from 'react';
import { Heart, Eye, Film, Image as ImageIcon, Zap, Hash, Download, Globe, AlertTriangle, MessageSquare, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import AgeGateModal from './AgeGateModal';
import ReportModal from './ReportModal';

export default function MediaCard({ post, onCardClick, onLike, onTagClick, onImportPost, importingIds = [], currentUser = null, onOpenProfile }) {
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const [externalLiked, setExternalLiked] = useState(false);
  const [externalLikeDelta, setExternalLikeDelta] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [, setRefreshIdx] = useState(0);

  useEffect(() => {
    const handleSettingsChange = () => setRefreshIdx(prev => prev + 1);
    window.addEventListener('user_settings_changed', handleSettingsChange);
    return () => window.removeEventListener('user_settings_changed', handleSettingsChange);
  }, []);

  if (!post) return null;

  const safeImportingIds = Array.isArray(importingIds) ? importingIds : [];
  const isImporting = safeImportingIds.includes(post.id);

  const isLiked = post.external
    ? externalLiked
    : Boolean(currentUser && Array.isArray(post.likedBy) && post.likedBy.includes(currentUser.username));

  const likesCount = post.external
    ? ((post.likes || 0) + externalLikeDelta)
    : (post.likes !== undefined ? post.likes : 0);

  const viewsCount = post.views !== undefined ? post.views : 0;
  const commentsCount = Array.isArray(post.comments) ? post.comments.length : 0;

  const contentPref = currentUser
    ? (currentUser.contentPreference || (currentUser.username ? localStorage.getItem(`user_content_pref_${currentUser.username}`) : null) || localStorage.getItem('user_content_pref') || 'blur')
    : (localStorage.getItem('guest_content_pref') || localStorage.getItem('user_content_pref') || 'blur');

  const isNsfw = Boolean(post.nsfw || (post.external && post.siteDomain && !post.siteDomain.toLowerCase().includes('safebooru')) || (post.external && post.siteName && !post.siteName.toLowerCase().includes('safebooru')));

  if (isNsfw && contentPref === 'hide_mature') {
    return null;
  }

  const isAdultVerified = Boolean(
    currentUser?.ageVerified ||
    localStorage.getItem('age_verified') === 'verified_adult' ||
    (currentUser?.username && localStorage.getItem(`age_verified_${currentUser.username}`) === 'verified_adult') ||
    localStorage.getItem('guest_age_verified') === 'verified_adult'
  );

  const booruMode = localStorage.getItem('booru_nsfw_mode');

  let shouldBlur = false;
  if (isNsfw) {
    if (isAdultVerified && (contentPref === 'show_all' || booruMode === 'reveal_all')) {
      shouldBlur = false;
    } else {
      shouldBlur = !isRevealed;
    }
  }

  const handleMediaError = (e) => {
    const step = e.target.dataset.errStep || '0';
    if (step === '0' && e.target.src.includes('.jpg')) {
      e.target.dataset.errStep = '1';
      e.target.src = e.target.src.replace(/\.jpg/i, '.png');
      return;
    }
    if (step !== '2' && post.previewUrl && e.target.src !== post.previewUrl) {
      e.target.dataset.errStep = '2';
      e.target.src = post.previewUrl;
      return;
    }
    if (step !== '3' && post.rawUrl && e.target.src !== post.rawUrl) {
      e.target.dataset.errStep = '3';
      e.target.src = post.rawUrl;
      return;
    }
    if (post.type !== 'video') {
      e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop';
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (post.type === 'video' && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (post.type === 'video' && videoRef.current) {
      videoRef.current.pause();
      try {
        videoRef.current.currentTime = 0;
      } catch (err) {}
    }
  };

  const handleLikeClick = async (e) => {
    e.stopPropagation();
    if (post.external) {
      if (!externalLiked) {
        setExternalLiked(true);
        setExternalLikeDelta(prev => prev + 1);
      }
      return;
    }
    if (onLike) {
      await onLike(post.id);
    }
  };

  const handleImportClick = (e) => {
    e.stopPropagation();
    if (onImportPost && !isImporting) {
      onImportPost(post);
    }
  };

  const renderBadge = () => {
    if (post.type === 'video') {
      return <span className="type-badge"><Film size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> {t('mediaCard.badgeVideo').toUpperCase()}</span>;
    }
    if (post.type === 'gif') {
      return <span className="type-badge"><Zap size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle', color: '#00ff66' }} /> {t('mediaCard.badgeGif').toUpperCase()}</span>;
    }
    return <span className="type-badge"><ImageIcon size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> {t('mediaCard.badgeImage').toUpperCase()}</span>;
  };

  const safeTags = Array.isArray(post.tags) ? post.tags : [];

  return (
    <div 
      className="media-card" 
      onClick={() => {
        if (shouldBlur) {
          // Usuário já verificado → revela direto
          // Convidado sem verificação → abre age gate
          if (isAdultVerified) {
            setIsRevealed(true);
          } else {
            setShowAgeGate(true);
          }
          return;
        }
        if (onCardClick) onCardClick(post);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="media-preview-container" style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
        {renderBadge()}

        {post.banned && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(7, 7, 7, 0.85)',
              border: '2px solid #ff0055',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              zIndex: 3,
              color: '#ff0055',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 800,
              fontSize: '0.8rem',
              letterSpacing: '0.05em'
            }}
          >
            <AlertTriangle size={24} />
            <span>{t('mediaCard.banned').toUpperCase()}</span>
          </div>
        )}

        {post.external && (
          <span
            style={{
              position: 'absolute',
              top: '0.75rem',
              left: '0.75rem',
              backgroundColor: 'rgba(167, 139, 250, 0.9)',
              color: '#000000',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.65rem',
              fontWeight: 800,
              padding: '0.2rem 0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              zIndex: 2
            }}
          >
            <Globe size={11} /> {post.siteName ? String(post.siteName).split(' ')[0] : 'HOTLINK'}
          </span>
        )}
        
        {post.type === 'video' ? (
          !isHovered && post.previewUrl && typeof post.previewUrl === 'string' && !/\.(mp4|webm|mov)(\?|$)/i.test(post.previewUrl) ? (
            <img
              src={post.previewUrl}
              alt={post.title || 'Media preview'}
              className="media-preview-img"
              loading="lazy"
              style={{ filter: shouldBlur ? 'blur(24px)' : 'none', transform: shouldBlur ? 'scale(1.15)' : 'none', transition: 'filter 0.3s ease, transform 0.3s ease', pointerEvents: 'none', width: '100%', height: '100%', objectFit: 'cover' }}
              onError={handleMediaError}
            />
          ) : (
            <video
              ref={videoRef}
              src={post.url || post.previewUrl}
              className="media-preview-video"
              muted
              loop={isHovered}
              autoPlay={isHovered}
              playsInline
              preload="metadata"
              style={{ filter: shouldBlur ? 'blur(24px)' : 'none', transform: shouldBlur ? 'scale(1.15)' : 'none', transition: 'filter 0.3s ease, transform 0.3s ease', pointerEvents: 'none', width: '100%', height: '100%', objectFit: 'cover' }}
              onError={handleMediaError}
            />
          )
        ) : (
          <img
            src={post.previewUrl || post.url}
            alt={post.title || 'Media preview'}
            className="media-preview-img"
            loading="lazy"
            style={{ filter: shouldBlur ? 'blur(24px)' : 'none', transform: shouldBlur ? 'scale(1.15)' : 'none', transition: 'filter 0.3s ease, transform 0.3s ease', pointerEvents: 'none', width: '100%', height: '100%', objectFit: 'cover' }}
            onError={handleMediaError}
          />
        )}

        {shouldBlur && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (!isAdultVerified) {
                setShowAgeGate(true);
              } else {
                setIsRevealed(true);
              }
            }}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(10, 0, 5, 0.55)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              zIndex: 3,
              cursor: 'pointer',
              color: '#fff',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 800,
              fontSize: '0.75rem',
              textAlign: 'center',
              padding: '1rem'
            }}
          >
            <div style={{ backgroundColor: '#ff0055', color: '#fff', padding: '0.45rem 1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 0 15px rgba(255, 0, 85, 0.4)', letterSpacing: '0.08em' }}>
              <span>{t('mediaCard.reveal') || 'REVELAR'}</span>
            </div>
            <span style={{ fontSize: '0.65rem', color: '#ccc', fontWeight: 500 }}>
              {t('mediaCard.sensitiveDesc') || 'Conteúdo sensível ou maduro'}
            </span>
          </div>
        )}
      </div>

      <div className="card-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
          <h3 className="card-title" style={{ margin: 0, flex: 1 }}>{post.title || t('mediaCard.untitled')}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {(post.author || post.uploader || (post.external && post.siteName)) && (
              <span 
                className="author-badge"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenProfile) onOpenProfile(post.author || post.uploader || post.siteName.split(' ')[0]);
                }}
                style={{ cursor: 'pointer', fontSize: '0.7rem', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, backgroundColor: 'rgba(167, 139, 250, 0.12)', padding: '0.15rem 0.45rem', border: '1px solid rgba(167, 139, 250, 0.35)', whiteSpace: 'nowrap', borderRadius: '3px' }}
              >
                {t('mediaCard.by')} @{post.author || post.uploader || post.siteName.split(' ')[0]}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowReportModal(true);
              }}
              title={t('reportModal.title')}
              style={{
                background: 'transparent',
                border: '1px solid #331118',
                color: '#ff3300',
                cursor: 'pointer',
                padding: '0.15rem 0.35rem',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s'
              }}
            >
              <AlertTriangle size={13} />
            </button>
          </div>
        </div>
        {post.description && (
          <p className="card-desc">{post.description}</p>
        )}

        <div className="tags-row">
          {safeTags.map((tag, idx) => (
            <span
              key={`${tag}-${idx}`}
              className="card-tag"
              onClick={(e) => {
                e.stopPropagation();
                if (onTagClick) onTagClick(tag);
              }}
            >
              <Hash size={10} style={{ display: 'inline', marginRight: '2px' }} />
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="card-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="stat-item" title={t('mediaCard.viewsTitle', { count: viewsCount })}>
            <Eye size={14} color="#a78bfa" />
            <span>{viewsCount}</span>
          </div>

          <div className="stat-item" title={t('mediaCard.commentsTitle', { count: commentsCount })}>
            <MessageSquare size={14} color="#a78bfa" />
            <span>{commentsCount}</span>
          </div>

          {post.external && (
            <button
              onClick={handleImportClick}
              disabled={isImporting}
              style={{
                background: isImporting ? '#222' : '#a78bfa',
                color: '#000000',
                border: 'none',
                padding: '0.25rem 0.6rem',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.7rem',
                fontWeight: 800,
                cursor: isImporting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Download size={11} />
              {isImporting ? t('mediaCard.importing').toUpperCase() : t('mediaCard.importSave').toUpperCase()}
            </button>
          )}
        </div>

        <button 
          className={`like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLikeClick}
        >
          <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
          <span>{likesCount}</span>
        </button>
      </div>

      {showAgeGate && (
        <AgeGateModal
          isOpen={showAgeGate}
          isBooruGate={false}
          onClose={() => setShowAgeGate(false)}
          onSuccess={() => {
            setShowAgeGate(false);
            setIsRevealed(true);
          }}
          currentUser={currentUser}
        />
      )}

      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          post={post}
          onSuccess={(data) => {
            setShowReportModal(false);
          }}
        />
      )}
    </div>
  );
}
