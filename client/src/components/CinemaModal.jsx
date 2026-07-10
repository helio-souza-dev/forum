import React, { useState, useRef } from 'react';
import { X, Heart, Eye, Film, Image as ImageIcon, Zap, Hash, MessageSquare, Send, Calendar, Download, Globe } from 'lucide-react';

export default function CinemaModal({ post, onClose, onLike, onTagClick, onCommentAdd, onImportPost, importingIds = [], currentUser = null, onRequireAuth, onOpenProfile }) {
  if (!post) return null;

  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  // Video playback states
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const safeImportingIds = Array.isArray(importingIds) ? importingIds : [];
  const isImporting = safeImportingIds.includes(post.id);

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || !timeInSeconds) return '00:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime || 0);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleOpenFullscreen = () => {
    const el = videoRef.current || stageRef.current;
    if (!el) return;
    try {
      if (el.webkitEnterFullscreen) {
        el.webkitEnterFullscreen();
      } else if (stageRef.current && stageRef.current.requestFullscreen) {
        stageRef.current.requestFullscreen().catch(() => {
          if (el.requestFullscreen) el.requestFullscreen();
        });
      } else if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
      }
    } catch (err) {
      console.error('Erro ao expandir tela cheia:', err);
    }
  };

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

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (onRequireAuth && !onRequireAuth()) {
      return;
    }

    setSendingComment(true);
    let targetPostId = post.id;

    try {
      if (post.external) {
        const importRes = await fetch('/api/booru/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: post.title,
            description: post.description,
            filename: post.filename,
            url: post.url,
            type: post.type,
            tags: post.tags
          })
        });
        if (importRes.ok) {
          const newLocalPost = await importRes.json();
          targetPostId = newLocalPost.id;
        } else {
          throw new Error('Falha ao registrar mídia no banco de dados local para comentário.');
        }
      }

      const res = await fetch(`/api/media/${targetPostId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: currentUser ? currentUser.username : (authorName.trim() || 'Usuário Anônimo'),
          text: commentText.trim()
        })
      });
      if (res.ok) {
        const newComment = await res.json();
        if (onCommentAdd) onCommentAdd(targetPostId, newComment);
        setCommentText('');
        if (post.external && onImportPost) {
          onImportPost(post);
        }
      }
    } catch (err) {
      console.error('Erro ao enviar comentário:', err);
      alert('Erro ao enviar comentário: ' + err.message);
    } finally {
      setSendingComment(false);
    }
  };

  const renderBadge = () => {
    if (post.type === 'video') {
      return <span className="type-badge" style={{ position: 'static', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Film size={12} /> VÍDEO</span>;
    }
    if (post.type === 'gif') {
      return <span className="type-badge" style={{ position: 'static', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#00ff66', borderColor: '#00ff66' }}><Zap size={12} /> GIF</span>;
    }
    return <span className="type-badge" style={{ position: 'static', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><ImageIcon size={12} /> IMAGEM</span>;
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const safeTags = Array.isArray(post.tags) ? post.tags : [];
  const safeComments = Array.isArray(post.comments) ? post.comments : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          width: '100%', 
          maxWidth: '960px', 
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column', 
          overflowY: 'auto', 
          backgroundColor: '#0a0a0a', 
          border: '1px solid #a78bfa', 
          boxShadow: '0 0 35px rgba(167, 139, 250, 0.25)',
          margin: 'auto'
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ position: 'sticky', top: 0, zIndex: 100, padding: '1rem 1.5rem', backgroundColor: '#050505', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, width: '100%' }}>
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', color: '#fff', fontWeight: 800 }}>
            <span>VISUALIZAÇÃO EXPANDIDA</span>
            {renderBadge()}
            {post.external && (
              <span style={{ backgroundColor: '#a78bfa', color: '#000', fontSize: '0.65rem', padding: '0.2rem 0.5rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Globe size={12} /> {post.siteName ? String(post.siteName).split(' ')[0] : 'HOTLINKED'}
              </span>
            )}
          </div>
          <button className="modal-close-btn" onClick={onClose} style={{ background: '#111', border: '1px solid #333', color: '#fff', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Media Showcase Stage */}
        <div 
          ref={stageRef} 
          style={{ 
            position: 'relative',
            zIndex: 10,
            backgroundColor: '#000000', 
            borderBottom: '1px solid #1f1f1f', 
            padding: '1.5rem 1rem', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%',
            minHeight: '280px',
            flexShrink: 0
          }}
        >
          {post.banned ? (
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '1rem', 
                padding: '3rem 2rem',
                border: '2px solid #ff0055',
                backgroundColor: '#0a0505',
                color: '#ff0055',
                fontFamily: 'JetBrains Mono, monospace',
                maxWidth: '600px',
                width: '100%',
                boxShadow: '8px 8px 0px rgba(255, 0, 85, 0.15)'
              }}
            >
              <AlertTriangle size={48} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, textAlign: 'center' }}>
                Esta mídia foi removida pela moderação
              </h2>
              <div style={{ width: '100%', borderTop: '1px solid rgba(255,0,85,0.3)', paddingTop: '1rem', marginTop: '0.5rem', color: '#fff', fontSize: '0.9rem' }}>
                <strong>MOTIVO DO BANIMENTO:</strong>
                <p style={{ margin: '0.5rem 0 0', padding: '0.75rem', backgroundColor: '#000', border: '1px solid #ff0055', color: '#ff88aa', fontStyle: 'italic', wordBreak: 'break-word' }}>
                  {post.banReason || 'Nenhum motivo informado.'}
                </p>
              </div>
              <div style={{ alignSelf: 'flex-start', fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>
                <span>BANIDO POR: <strong>@{post.bannedBy || 'Moderação'}</strong></span>
                {post.bannedAt && <span style={{ marginLeft: '1rem' }}>EM: {formatDate(post.bannedAt)}</span>}
              </div>
            </div>
          ) : post.type === 'video' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '880px', gap: '0.85rem' }}>
              <video
                ref={videoRef}
                src={post.url || post.previewUrl}
                controls
                controlsList="nodownload"
                autoPlay
                playsInline
                onDoubleClick={handleOpenFullscreen}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
                onError={handleMediaError}
                style={{
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '100%',
                  maxHeight: '65vh',
                  objectFit: 'contain',
                  display: 'block',
                  backgroundColor: '#000'
                }}
              />
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0a0a0a', padding: '0.6rem 1rem', border: '1px solid #222' }}>
                <button
                  type="button"
                  onClick={togglePlay}
                  style={{ background: 'transparent', border: '1px solid #a78bfa', color: '#a78bfa', padding: '0.25rem 0.65rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  {isPlaying ? 'PAUSE' : 'PLAY'}
                </button>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#ccc', minWidth: '45px' }}>{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  style={{ flex: 1, accentColor: '#a78bfa', cursor: 'pointer', height: '5px' }}
                />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#ccc', minWidth: '45px' }}>{formatTime(duration)}</span>
                <button
                  type="button"
                  onClick={handleOpenFullscreen}
                  style={{ background: '#a78bfa', color: '#000', border: 'none', padding: '0.3rem 0.75rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  TELA CHEIA
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '1rem' }}>
              <img
                src={post.url || post.previewUrl}
                alt={post.title || 'Media view'}
                onDoubleClick={handleOpenFullscreen}
                onError={handleMediaError}
                style={{
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '100%',
                  maxHeight: '68vh',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto',
                  cursor: 'zoom-in'
                }}
              />
              <button
                type="button"
                onClick={handleOpenFullscreen}
                style={{
                  background: 'transparent',
                  color: '#a78bfa',
                  border: '1px solid #a78bfa',
                  padding: '0.45rem 1rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                ⛶ ABRIR IMAGEM EM TELA CHEIA
              </button>
            </div>
          )}
        </div>

        {/* Post Details & Comments Section */}
        <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#0c0c0c' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1.3, margin: 0, flex: 1 }}>
                {post.title || 'Mídia sem título'}
              </h2>
              {(post.author || post.uploader || (post.external && post.siteName)) && (
                <div
                  onClick={() => onOpenProfile && onOpenProfile(post.author || post.uploader || post.siteName.split(' ')[0])}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: 'rgba(167, 139, 250, 0.15)',
                    border: '1px solid #a78bfa',
                    color: '#a78bfa',
                    padding: '0.4rem 0.85rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    boxShadow: '0 0 12px rgba(167, 139, 250, 0.25)',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  👤 ARTISTA / AUTOR: @{post.author || post.uploader || post.siteName.split(' ')[0]}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.8rem', color: '#888', fontFamily: 'JetBrains Mono, monospace', borderBottom: '1px solid #1f1f1f', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Eye size={14} color="#a78bfa" /> {post.views !== undefined ? post.views : 0} VISUALIZAÇÕES
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={14} /> {formatDate(post.createdAt || new Date())}
              </span>
              {post.source && post.source.startsWith('http') && (
                <a
                  href={post.source}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#00ff66', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 800 }}
                >
                  🔗 Post / Perfil do Artista ({post.source.includes('x.com') || post.source.includes('twitter') ? 'Twitter/X' : post.source.includes('pixiv') ? 'Pixiv' : 'Fonte Original'})
                </a>
              )}
              {post.external && post.rawUrl && (
                <a
                  href={post.rawUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#a78bfa', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Globe size={13} /> Link Original da Plataforma
                </a>
              )}
            </div>

            {post.description && (
              <p style={{ fontSize: '0.95rem', color: '#ddd', lineHeight: 1.6, marginBottom: '1.25rem', whiteSpace: 'pre-wrap' }}>
                {post.description}
              </p>
            )}

            {/* Tags Row */}
            {safeTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                {safeTags.map((tag, idx) => (
                  <span
                    key={`${tag}-${idx}`}
                    className="card-tag"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', cursor: 'pointer' }}
                    onClick={() => {
                      if (onTagClick) onTagClick(tag);
                      if (onClose) onClose();
                    }}
                  >
                    <Hash size={12} style={{ display: 'inline', marginRight: '3px' }} />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action Bar */}
            {!post.banned ? (
              <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #1f1f1f', paddingBottom: '1.5rem' }}>
                {post.external ? (
                  <button 
                    className="btn btn-primary"
                    onClick={() => onImportPost && onImportPost(post)}
                    disabled={isImporting}
                    style={{ padding: '0.75rem 1.75rem', backgroundColor: '#a78bfa', color: '#000000', borderColor: '#a78bfa', fontWeight: 800, cursor: isImporting ? 'wait' : 'pointer' }}
                  >
                    <Download size={16} />
                    <span>{isImporting ? 'SALVANDO EM MEU FEED LOCAL...' : '+ SALVAR PERMANENTEMENTE EM MEU FEED LOCAL'}</span>
                  </button>
                ) : (
                  <>
                    <button 
                      className="btn btn-primary"
                      onClick={() => onLike && onLike(post.id)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        backgroundColor: (currentUser && Array.isArray(post.likedBy) && post.likedBy.includes(currentUser.username)) ? '#a78bfa' : '#1a1a1a',
                        color: (currentUser && Array.isArray(post.likedBy) && post.likedBy.includes(currentUser.username)) ? '#000' : '#fff',
                        borderColor: '#a78bfa'
                      }}
                    >
                      <Heart size={16} fill={(currentUser && Array.isArray(post.likedBy) && post.likedBy.includes(currentUser.username)) ? 'currentColor' : 'none'} color={(currentUser && Array.isArray(post.likedBy) && post.likedBy.includes(currentUser.username)) ? '#000' : '#a78bfa'} />
                      <span>{(currentUser && Array.isArray(post.likedBy) && post.likedBy.includes(currentUser.username)) ? 'CURTIDO' : 'CURTIR MÍDIA'} ({post.likes !== undefined ? post.likes : 0})</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        const el = document.getElementById('comments-section-anchor');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      style={{ padding: '0.75rem 1.5rem', fontWeight: 800, cursor: 'pointer', backgroundColor: '#1a1a1a', color: '#fff', borderColor: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <MessageSquare size={16} color="#a78bfa" />
                      <span>COMENTAR ({safeComments.length})</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div style={{ borderBottom: '1px solid #1f1f1f', paddingBottom: '1rem', color: '#ff0055', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', fontWeight: 800 }}>
                [ INTERAÇÕES E CURTIDAS DESATIVADAS PARA ESTA MÍDIA BANIDA ]
              </div>
            )}
          </div>

          {/* Comments Section */}
          {!post.banned ? (
            <div id="comments-section-anchor" className="comments-section" style={{ borderTop: 'none', paddingTop: '0' }}>
              <h3 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <MessageSquare size={16} /> COMENTÁRIOS ({safeComments.length})
              </h3>

              {!currentUser ? (
                <div style={{ backgroundColor: '#0a0a0a', border: '1px dashed #a78bfa', padding: '1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#aaa' }}>
                    FAÇA LOGIN PARA PARTICIPAR DOS COMENTÁRIOS OU CURTIR ESTA MÍDIA
                  </div>
                  <button
                    type="button"
                    onClick={() => onRequireAuth && onRequireAuth()}
                    style={{ background: '#a78bfa', color: '#000000', border: 'none', padding: '0.65rem 1.25rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer', textTransform: 'uppercase' }}
                  >
                    ENTRAR OU CRIAR CONTA AGORA
                  </button>
                </div>
              ) : (
                <form id="comment-form-box" onSubmit={handleCommentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: '#060606', padding: '1rem', border: '1px solid #1f1f1f' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#00ff66' }}>
                    <span>COMENTANDO COMO:</span>
                    <strong style={{ background: '#0a1a1c', padding: '0.2rem 0.5rem', border: '1px solid #00ff66' }}>@{currentUser.username}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1, minWidth: '200px', fontSize: '0.85rem', background: '#0a0a0a', border: '1px solid #222', color: '#fff', padding: '0.6rem 0.8rem' }}
                      placeholder="Escreva seu comentário aqui..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-accent" disabled={sendingComment} style={{ padding: '0.6rem 1.25rem', fontWeight: 800 }}>
                      <Send size={15} /> {sendingComment ? 'ENVIANDO...' : 'ENVIAR'}
                    </button>
                  </div>
                </form>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                {safeComments.length === 0 ? (
                  <div style={{ color: '#666', fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace', padding: '1.25rem', textAlign: 'center', border: '1px dashed #1f1f1f' }}>
                    [ Nenhum comentário até o momento. Seja o primeiro a comentar! ]
                  </div>
                ) : (
                  safeComments.slice().reverse().map((c) => (
                    <div key={c.id} className="comment-card" style={{ backgroundColor: '#060606', border: '1px solid #1f1f1f', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span className="comment-author" style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#a78bfa' }}>&gt; {c.author}</span>
                        <span style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'JetBrains Mono, monospace' }}>
                          {formatDate(c.createdAt)}
                        </span>
                      </div>
                      <div className="comment-text" style={{ color: '#eee', fontSize: '0.95rem' }}>{c.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div style={{ color: '#555', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', padding: '1rem', border: '1px dashed #222', textAlign: 'center' }}>
              [ COMENTÁRIOS E FEEDBACKS DESABILITADOS DEVIDO À REMOÇÃO DESTE CONTEÚDO ]
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
