import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Heart, Image as ImageIcon, Shield, Settings, Check, Lock, Calendar, Edit3, Eye, EyeOff, Terminal } from 'lucide-react';
import MediaCard from './MediaCard';
import PhotoCropperModal from './PhotoCropperModal';

export default function UserProfilePage({ username, currentUser, onBack, onSelectPost, onOpenUpload, onRequireAuth, onLike, onOpenProfile }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'likes' | 'settings'
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states for editing
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bio, setBio] = useState('');
  const [showLikes, setShowLikes] = useState(true);
  const [showPosts, setShowPosts] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Cropper states
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState(null);
  const [cropperTargetField, setCropperTargetField] = useState('avatar');

  const handleFileSelectForCropper = (e, targetField) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // reset input value for re-selection
    e.target.value = null;

    const objectUrl = URL.createObjectURL(file);
    setCropperImageSrc(objectUrl);
    setCropperTargetField(targetField);
    setCropperOpen(true);
  };

  const handleConfirmCroppedUpload = async (blob) => {
    if (!blob) return;

    if (cropperTargetField === 'avatar') setUploadingAvatar(true);
    else setUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append('file', blob, cropperTargetField === 'avatar' ? 'avatar_cropped.webp' : 'banner_cropped.webp');

      const res = await fetch('/api/upload/free', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Falha ao enviar foto recortada.');
      }

      const data = await res.json();
      if (data.url) {
        if (cropperTargetField === 'avatar') setAvatarUrl(data.url);
        else setBannerUrl(data.url);
        setCropperOpen(false);
      }
    } catch (err) {
      alert(`Erro no upload: ${err.message}`);
    } finally {
      if (cropperTargetField === 'avatar') setUploadingAvatar(false);
      else setUploadingBanner(false);
    }
  };

  const isOwner = currentUser && currentUser.username && username && currentUser.username.toLowerCase() === username.toLowerCase();

  useEffect(() => {
    fetchProfile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [username, currentUser]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const viewerParam = currentUser ? `?viewer=${encodeURIComponent(currentUser.username)}` : '';
      const res = await fetch(`/api/users/${encodeURIComponent(username)}${viewerParam}`);
      if (!res.ok) {
        throw new Error('Não foi possível carregar o perfil deste usuário.');
      }
      const data = await res.json();
      setProfile(data);
      setAvatarUrl(data.avatarUrl || '');
      setBannerUrl(data.bannerUrl || '');
      setBio(data.bio || 'Olá! Sou um membro ativo do PrismShare.');
      setShowLikes(data.privacy ? data.privacy.showLikes !== false : true);
      setShowPosts(data.privacy ? data.privacy.showPosts !== false : true);
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados do usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!isOwner) return;
    try {
      setSaving(true);
      setSaveSuccess(false);
      const token = localStorage.getItem('prismshare_auth_token');
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          avatarUrl: avatarUrl.trim(),
          bannerUrl: bannerUrl.trim(),
          bio: bio.trim(),
          privacy: {
            showLikes,
            showPosts
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao atualizar perfil.');
      }

      const updated = await res.json();
      setProfile(prev => ({ ...prev, ...updated }));
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchProfile();
    } catch (err) {
      alert(err.message || 'Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recente';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    } catch {
      return 'Recente';
    }
  };

  return (
    <main style={{ width: '100%', minHeight: 'calc(100vh - 70px)', backgroundColor: '#050505', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-out' }}>
      {/* Back button strip */}
      <div style={{ backgroundColor: '#0a0a0a', borderBottom: '1px solid #1a1a1a', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'transparent',
            border: '1px solid #a78bfa',
            color: '#a78bfa',
            padding: '0.45rem 1.1rem',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#a78bfa'; e.currentTarget.style.color = '#000'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a78bfa'; }}
        >
          <ArrowLeft size={16} /> VOLTAR AO FEED
        </button>

        {isOwner && !isEditing && (
          <button
            type="button"
            onClick={() => { setIsEditing(true); setActiveTab('settings'); }}
            style={{
              background: '#151515',
              border: '1px solid #00ff66',
              color: '#00ff66',
              padding: '0.45rem 1.2rem',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 0 10px rgba(0, 255, 102, 0.2)'
            }}
          >
            <Settings size={15} /> CONFIGURAR PERFIL E PRIVACIDADE
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '8rem 2rem', textAlign: 'center', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace' }}>
          <Terminal size={48} color="#a78bfa" style={{ margin: '0 auto 1.5rem auto', animation: 'pulse 1.5s infinite' }} />
          <div style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.5rem' }}>CARREGANDO PÁGINA DO PERFIL...</div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Conectando ao banco de dados e verificando mídias de @{username}.</div>
        </div>
      ) : error ? (
        <div style={{ padding: '6rem 2rem', textAlign: 'center', color: '#ff0055', fontFamily: 'JetBrains Mono, monospace' }}>
          <p style={{ fontSize: '1.4rem', fontWeight: 800 }}>⚠️ {error}</p>
          <button type="button" onClick={onBack} style={{ marginTop: '1.5rem', background: 'transparent', border: '1px solid #ff0055', color: '#ff0055', padding: '0.6rem 1.8rem', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }}>
            ← VOLTAR
          </button>
        </div>
      ) : profile ? (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Hero Banner Section */}
          <div
            style={{
              height: '280px',
              width: '100%',
              backgroundImage: profile.bannerUrl ? `url("${profile.bannerUrl}")` : 'linear-gradient(135deg, #1f1c2c 0%, #928DAB 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              borderBottom: '1px solid #222'
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #050505 0%, rgba(5,5,5,0.3) 70%, transparent 100%)' }} />
          </div>

          {/* Profile Header Block */}
          <div style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '0 2.5rem', marginTop: '-75px', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #1f1f1f' }}>
              
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2rem', flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div
                  style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '12px',
                    backgroundColor: '#121212',
                    border: '3px solid #a78bfa',
                    boxShadow: '0 0 30px rgba(167, 139, 250, 0.45)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a78bfa',
                    fontSize: '4rem',
                    fontWeight: 900,
                    fontFamily: 'JetBrains Mono, monospace',
                    flexShrink: 0
                  }}
                >
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    profile.username[0].toUpperCase()
                  )}
                </div>

                {/* Info Text */}
                <div style={{ paddingBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: 0, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-1px' }}>
                      @{profile.username}
                    </h1>
                    <span
                      style={{
                        padding: '0.3rem 0.8rem',
                        fontSize: '0.8rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 800,
                        border: profile.role === 'admin' || profile.role === 'dev' ? '1px solid #ff0055' : '1px solid #00ff66',
                        color: profile.role === 'admin' || profile.role === 'dev' ? '#ff0055' : '#00ff66',
                        backgroundColor: profile.role === 'admin' || profile.role === 'dev' ? 'rgba(255, 0, 85, 0.12)' : 'rgba(0, 255, 102, 0.12)',
                        boxShadow: profile.role === 'admin' || profile.role === 'dev' ? '0 0 12px rgba(255, 0, 85, 0.3)' : '0 0 12px rgba(0, 255, 102, 0.3)'
                      }}
                    >
                      {profile.role === 'dev' ? '🔧 DESENVOLVEDOR DO SISTEMA' : profile.role === 'admin' ? '⚡ ADMINISTRADOR GERAL' : '✨ MEMBRO DA COMUNIDADE'}
                    </span>
                  </div>

                  <p style={{ color: '#ccc', fontSize: '1.05rem', margin: '0.75rem 0 0.5rem 0', maxWidth: '750px', lineHeight: 1.5, fontFamily: 'sans-serif' }}>
                    {profile.bio || 'Olá! Sou um membro ativo do PrismShare.'}
                  </p>

                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.8rem', color: '#777', fontFamily: 'JetBrains Mono, monospace' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} color="#a78bfa" /> Membro desde {formatDate(profile.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
                <div style={{ background: '#0e0e0e', border: '1px solid #222', padding: '1rem 1.6rem', textAlign: 'center', minWidth: '120px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace' }}>
                    {profile.stats ? profile.stats.postsCount : (profile.posts ? profile.posts.length : 0)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#888', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.3rem', fontWeight: 800 }}>POSTS PUBLICADOS</div>
                </div>

                <div style={{ background: '#0e0e0e', border: '1px solid #222', padding: '1rem 1.6rem', textAlign: 'center', minWidth: '120px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ff0055', fontFamily: 'JetBrains Mono, monospace' }}>
                    {profile.stats ? profile.stats.likesReceived : 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#888', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.3rem', fontWeight: 800 }}>CURTIDAS RECEBIDAS</div>
                </div>

                <div style={{ background: '#0e0e0e', border: '1px solid #222', padding: '1rem 1.6rem', textAlign: 'center', minWidth: '120px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#00ff66', fontFamily: 'JetBrains Mono, monospace' }}>
                    {profile.stats ? profile.stats.likedPostsCount : (profile.likedPosts ? profile.likedPosts.length : 0)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#888', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.3rem', fontWeight: 800 }}>MÍDIAS FAVORITAS</div>
                </div>
              </div>

            </div>
          </div>

          {/* Page Tabs Strip */}
          <div style={{ backgroundColor: '#0a0a0a', borderBottom: '1px solid #1f1f1f', position: 'sticky', top: 0, zIndex: 100 }}>
            <div style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', display: 'flex', padding: '0 2.5rem' }}>
              <button
                type="button"
                onClick={() => { setActiveTab('posts'); setIsEditing(false); }}
                style={{
                  padding: '1.25rem 2.2rem',
                  background: activeTab === 'posts' && !isEditing ? '#141414' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'posts' && !isEditing ? '3px solid #a78bfa' : '3px solid transparent',
                  color: activeTab === 'posts' && !isEditing ? '#a78bfa' : '#888',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <ImageIcon size={18} /> POSTS PUBLICADOS ({profile.posts ? profile.posts.length : 0})
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('likes'); setIsEditing(false); }}
                style={{
                  padding: '1.25rem 2.2rem',
                  background: activeTab === 'likes' && !isEditing ? '#141414' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'likes' && !isEditing ? '3px solid #ff0055' : '3px solid transparent',
                  color: activeTab === 'likes' && !isEditing ? '#ff0055' : '#888',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Heart size={18} /> CURTIDAS ({profile.likedPosts ? profile.likedPosts.length : 0})
              </button>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => { setIsEditing(true); setActiveTab('settings'); }}
                  style={{
                    padding: '1.25rem 2.2rem',
                    background: isEditing || activeTab === 'settings' ? '#141414' : 'transparent',
                    border: 'none',
                    borderBottom: isEditing || activeTab === 'settings' ? '3px solid #00ff66' : '3px solid transparent',
                    color: isEditing || activeTab === 'settings' ? '#00ff66' : '#888',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Settings size={18} /> EDITAR PERFIL & PRIVACIDADE
                </button>
              )}
            </div>
          </div>

          {/* Page Body Content */}
          <div style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '2.5rem', flex: 1 }}>
            {saveSuccess && (
              <div style={{ background: 'rgba(0, 255, 102, 0.15)', border: '1px solid #00ff66', color: '#00ff66', padding: '1rem 1.5rem', marginBottom: '2rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '4px' }}>
                <Check size={20} /> SEU PERFIL E CONFIGURAÇÕES DE PRIVACIDADE FORAM ATUALIZADOS COM SUCESSO!
              </div>
            )}

            {isEditing || activeTab === 'settings' ? (
              <div style={{ background: '#0e0e0e', border: '1px solid #222', padding: '2.5rem', maxWidth: '800px', borderRadius: '8px' }}>
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#fff', fontFamily: 'JetBrains Mono, monospace', borderBottom: '1px solid #222', paddingBottom: '0.75rem' }}>
                    ⚙️ CONFIGURAÇÕES DA SUA CONTA PRISMSHARE
                  </h3>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, marginBottom: '0.5rem' }}>
                      FOTO DE PERFIL / AVATAR:
                    </label>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        placeholder="Cole a URL ou clique em escolher do PC ->"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: '220px',
                          padding: '0.85rem',
                          backgroundColor: '#151515',
                          border: '1px solid #333',
                          color: '#fff',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.9rem',
                          borderRadius: '4px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <label style={{
                        background: '#1a1a1a',
                        border: '1px solid #a78bfa',
                        color: '#a78bfa',
                        padding: '0 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        cursor: uploadingAvatar ? 'wait' : 'pointer',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        borderRadius: '4px',
                        whiteSpace: 'nowrap'
                      }}>
                        {uploadingAvatar ? '⏳ ENVIANDO (GRÁTIS)...' : '📁 ESCOLHER & RECORTAR'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelectForCropper(e, 'avatar')}
                          disabled={uploadingAvatar}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: '0.4rem 0 0 0', fontFamily: 'JetBrains Mono, monospace' }}>
                      ✨ 100% Gratuito! Com recorte interativo, zoom automotimizado e compatível com links locais e da internet.
                    </p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, marginBottom: '0.5rem' }}>
                      BANNER DE FUNDO (TOPO DO PERFIL):
                    </label>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        placeholder="Cole a URL ou clique no botão ao lado ->"
                        value={bannerUrl}
                        onChange={(e) => setBannerUrl(e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: '220px',
                          padding: '0.85rem',
                          backgroundColor: '#151515',
                          border: '1px solid #333',
                          color: '#fff',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.9rem',
                          borderRadius: '4px',
                          boxSizing: 'border-box'
                        }}
                      />
                      <label style={{
                        background: '#1a1a1a',
                        border: '1px solid #a78bfa',
                        color: '#a78bfa',
                        padding: '0 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        cursor: uploadingBanner ? 'wait' : 'pointer',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        borderRadius: '4px',
                        whiteSpace: 'nowrap'
                      }}>
                        {uploadingBanner ? '⏳ ENVIANDO (GRÁTIS)...' : '📁 ESCOLHER & RECORTAR'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelectForCropper(e, 'banner')}
                          disabled={uploadingBanner}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: '0.4rem 0 0 0', fontFamily: 'JetBrains Mono, monospace' }}>
                      Recomendado: imagens widescreen ou paisagem (com recorte/zoom integrado).
                    </p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, marginBottom: '0.5rem' }}>
                      SUA BIOGRAFIA / APRESENTAÇÃO:
                    </label>
                    <textarea
                      rows="4"
                      placeholder="Fale um pouco sobre você, seus artistas favoritos, estilos, redes sociais..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.85rem',
                        backgroundColor: '#151515',
                        border: '1px solid #333',
                        color: '#fff',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.95rem',
                        borderRadius: '4px',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Privacy Configs */}
                  <div style={{ background: '#121212', border: '1px solid #222', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#00ff66', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Lock size={18} /> CONFIGURAÇÕES DE PRIVACIDADE DO SEU PERFIL
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: '#ccc' }}>
                      <input
                        type="checkbox"
                        checked={showPosts}
                        onChange={(e) => setShowPosts(e.target.checked)}
                        style={{ width: '20px', height: '20px', accentColor: '#a78bfa', cursor: 'pointer' }}
                      />
                      <span>Mostrar meus posts publicados publicamente para outros membros</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: '#ccc' }}>
                      <input
                        type="checkbox"
                        checked={showLikes}
                        onChange={(e) => setShowLikes(e.target.checked)}
                        style={{ width: '20px', height: '20px', accentColor: '#ff0055', cursor: 'pointer' }}
                      />
                      <span>Mostrar minha lista de curtidas/favoritos publicamente na aba de curtidas</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '1.2rem', marginTop: '0.5rem' }}>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{
                        background: '#00ff66',
                        color: '#000',
                        border: 'none',
                        padding: '0.9rem 2rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.95rem',
                        fontWeight: 900,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        boxShadow: '0 0 20px rgba(0, 255, 102, 0.4)',
                        borderRadius: '4px'
                      }}
                    >
                      {saving ? 'SALVANDO DADOS...' : '💾 SALVAR ALTERAÇÕES'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsEditing(false); setActiveTab('posts'); }}
                      style={{
                        background: 'transparent',
                        color: '#aaa',
                        border: '1px solid #444',
                        padding: '0.9rem 1.8rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                    >
                      CANCELAR
                    </button>
                  </div>
                </form>
              </div>
            ) : activeTab === 'posts' ? (
              <div>
                {profile.privacy && !profile.privacy.showPosts && !isOwner ? (
                  <div style={{ padding: '5rem 2rem', textAlign: 'center', background: '#0e0e0e', border: '1px solid #222', color: '#888', fontFamily: 'JetBrains Mono, monospace', borderRadius: '8px' }}>
                    <Lock size={40} style={{ margin: '0 auto 1.2rem auto', color: '#a78bfa' }} />
                    <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem 0' }}>Postagens Privadas</p>
                    <p style={{ fontSize: '0.95rem', color: '#777' }}>O usuário @{profile.username} configurou a privacidade para não exibir suas publicações de forma pública.</p>
                  </div>
                ) : profile.posts && profile.posts.length > 0 ? (
                  <div className="masonry-grid">
                    {profile.posts.map(post => (
                      <MediaCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        onCardClick={() => onSelectPost && onSelectPost(post)}
                        onLike={() => onLike && onLike(post.id)}
                        onRequireAuth={onRequireAuth}
                        onOpenProfile={onOpenProfile}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '5rem 2rem', textAlign: 'center', background: '#0e0e0e', border: '1px solid #222', color: '#888', fontFamily: 'JetBrains Mono, monospace', borderRadius: '8px' }}>
                    <ImageIcon size={40} style={{ margin: '0 auto 1.2rem auto', color: '#444' }} />
                    <p style={{ fontSize: '1.15rem', color: '#aaa', fontWeight: 800 }}>Este usuário ainda não publicou nenhuma mídia na plataforma.</p>
                    {isOwner && (
                      <button type="button" onClick={onOpenUpload} style={{ marginTop: '1.25rem', background: '#a78bfa', color: '#000', border: 'none', padding: '0.75rem 1.8rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, cursor: 'pointer', borderRadius: '4px' }}>
                        + ENVIAR PRIMEIRA MÍDIA
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {profile.privacy && !profile.privacy.showLikes && !isOwner ? (
                  <div style={{ padding: '5rem 2rem', textAlign: 'center', background: '#0e0e0e', border: '1px solid #222', color: '#888', fontFamily: 'JetBrains Mono, monospace', borderRadius: '8px' }}>
                    <Lock size={40} style={{ margin: '0 auto 1.2rem auto', color: '#ff0055' }} />
                    <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem 0' }}>Curtidas Privadas</p>
                    <p style={{ fontSize: '0.95rem', color: '#777' }}>O usuário @{profile.username} configurou sua lista de mídias favoritas como confidencial.</p>
                  </div>
                ) : profile.likedPosts && profile.likedPosts.length > 0 ? (
                  <div className="masonry-grid">
                    {profile.likedPosts.map(post => (
                      <MediaCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        onCardClick={() => onSelectPost && onSelectPost(post)}
                        onLike={() => onLike && onLike(post.id)}
                        onRequireAuth={onRequireAuth}
                        onOpenProfile={onOpenProfile}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '5rem 2rem', textAlign: 'center', background: '#0e0e0e', border: '1px solid #222', color: '#888', fontFamily: 'JetBrains Mono, monospace', borderRadius: '8px' }}>
                    <Heart size={40} style={{ margin: '0 auto 1.2rem auto', color: '#444' }} />
                    <p style={{ fontSize: '1.15rem', color: '#aaa', fontWeight: 800 }}>Nenhuma mídia favoritada por @{profile.username} até o momento.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}

      <PhotoCropperModal
        isOpen={cropperOpen}
        imageUrl={cropperImageSrc}
        type={cropperTargetField}
        uploading={uploadingAvatar || uploadingBanner}
        onClose={() => setCropperOpen(false)}
        onConfirm={handleConfirmCroppedUpload}
      />
    </main>
  );
}
