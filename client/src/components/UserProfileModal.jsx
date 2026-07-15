import React, { useState, useEffect } from 'react';
import { X, User, Heart, Image as ImageIcon, Shield, Settings, Check, Lock, Calendar, Edit3, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import MediaCard from './MediaCard';
import AgeGateModal from './AgeGateModal';
import { useLanguage } from '../i18n/LanguageContext';

export default function UserProfileModal({ username, currentUser, onClose, onSelectPost, onOpenUpload, onRequireAuth, onLike }) {
  const { t } = useLanguage();
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
  const [contentPref, setContentPref] = useState('blur');
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [pendingContentPref, setPendingContentPref] = useState(null);

  const isOwner = currentUser && currentUser.username && username && currentUser.username.toLowerCase() === username.toLowerCase();

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const handleContentPrefChange = async (newPref) => {
    if (!isOwner) return;
    if (newPref === 'show_all') {
      const isVerified = Boolean(currentUser?.ageVerified || (currentUser?.username && localStorage.getItem(`age_verified_${currentUser.username}`) === 'verified_adult'));
      if (!isVerified) {
        setPendingContentPref(newPref);
        setShowAgeGate(true);
        return;
      }
    }

    setContentPref(newPref);
    localStorage.setItem('user_content_pref', newPref);
    if (currentUser?.username) {
      localStorage.setItem(`user_content_pref_${currentUser.username}`, newPref);
    }
    if (newPref === 'hide_mature') {
      localStorage.setItem('booru_nsfw_mode', 'hide');
    } else if (newPref === 'show_all') {
      localStorage.setItem('booru_nsfw_mode', 'reveal_all');
    } else if (newPref === 'blur') {
      localStorage.setItem('booru_nsfw_mode', 'blur_all');
    }

    const token = localStorage.getItem('prismshare_auth_token');
    if (token) {
      try {
        await fetch('/api/users/settings/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            contentPreference: newPref,
            ageVerified: Boolean(currentUser?.ageVerified || (currentUser?.username && localStorage.getItem(`age_verified_${currentUser.username}`) === 'verified_adult'))
          })
        });
      } catch (err) {
        console.error('Erro ao salvar pref de conteudo:', err);
      }
    }
  };

  const handleAgeVerificationSuccess = async (data) => {
    localStorage.setItem('age_verified', 'verified_adult');
    if (currentUser?.username) {
      localStorage.setItem(`age_verified_${currentUser.username}`, 'verified_adult');
    }
    const targetPref = pendingContentPref || 'blur';
    setContentPref(targetPref);
    localStorage.setItem('user_content_pref', targetPref);
    if (currentUser?.username) {
      localStorage.setItem(`user_content_pref_${currentUser.username}`, targetPref);
    }
    if (targetPref === 'show_all') {
      localStorage.setItem('booru_nsfw_mode', 'reveal_all');
    } else {
      localStorage.setItem('booru_nsfw_mode', 'blur_all');
    }

    const token = localStorage.getItem('prismshare_auth_token');
    if (token) {
      try {
        await fetch('/api/users/settings/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ageVerified: true,
            birthDate: data?.birthDate,
            contentPreference: targetPref
          })
        });
      } catch (err) {
        console.error('Erro ao salvar verificação de idade no servidor:', err);
      }
    }
    setPendingContentPref(null);
  };

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
      setContentPref(data.contentPreference || localStorage.getItem('user_content_pref') || 'blur');
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

      if (token && contentPref) {
        await fetch('/api/users/settings/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            contentPreference: contentPref,
            ageVerified: localStorage.getItem('age_verified') === 'verified_adult' || currentUser?.ageVerified || false
          })
        }).catch(err => console.error('Erro ao salvar pref de conteudo:', err));
      }
      localStorage.setItem('user_content_pref', contentPref);

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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 2500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1000px',
          maxHeight: '90vh',
          backgroundColor: '#0c0c0c',
          border: '1px solid #a78bfa',
          boxShadow: '0 0 35px rgba(167, 139, 250, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Top bar with close button */}
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 10,
            display: 'flex',
            gap: '0.5rem'
          }}
        >
          {isOwner && !isEditing && (
            <button
              type="button"
              onClick={() => { setIsEditing(true); setActiveTab('settings'); }}
              style={{
                background: 'rgba(12, 12, 12, 0.85)',
                border: '1px solid #a78bfa',
                color: '#a78bfa',
                padding: '0.5rem 1rem',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 0 10px rgba(0,0,0,0.5)'
              }}
            >
              <Settings size={15} /> {t('userProfile.editProfile').toUpperCase()}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(12, 12, 12, 0.85)',
              border: '1px solid #ff0055',
              color: '#ff0055',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 0 10px rgba(0,0,0,0.5)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Loading / Error states */}
        {loading ? (
          <div style={{ padding: '5rem', textAlign: 'center', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace' }}>
            {t('userProfile.loading').toUpperCase()}
          </div>
        ) : error ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#ff0055', fontFamily: 'JetBrains Mono, monospace' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 800 }}>{error}</p>
            <button type="button" onClick={onClose} style={{ marginTop: '1.5rem', background: 'transparent', border: '1px solid #ff0055', color: '#ff0055', padding: '0.5rem 1.5rem', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }}>
              {t('common.close').toUpperCase()}
            </button>
          </div>
        ) : profile ? (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
            {/* Banner & Avatar Header */}
            <div
              style={{
                height: '200px',
                width: '100%',
                backgroundImage: profile.bannerUrl ? `url("${profile.bannerUrl}")` : 'linear-gradient(135deg, #1b1035 0%, #0d1e2c 50%, #2b0c2a 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                borderBottom: '1px solid #1f1f1f'
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0c0c0c 0%, transparent 80%)' }} />
            </div>

            {/* Profile Info Overlay */}
            <div style={{ padding: '0 2rem 1.5rem 2rem', marginTop: '-60px', position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', borderBottom: '1px solid #1a1a1a' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '8px',
                    backgroundColor: '#151515',
                    border: '2px solid #a78bfa',
                    boxShadow: '0 0 20px rgba(167, 139, 250, 0.4)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a78bfa',
                    fontSize: '3rem',
                    fontWeight: 900,
                    fontFamily: 'JetBrains Mono, monospace'
                  }}
                >
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    profile.username[0].toUpperCase()
                  )}
                </div>

                {/* Username & Badges */}
                <div style={{ paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', margin: 0, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.5px' }}>
                      @{profile.username}
                    </h1>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        fontSize: '0.75rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 800,
                        border: profile.role === 'admin' || profile.role === 'dev' ? '1px solid #ff0055' : '1px solid #00ff66',
                        color: profile.role === 'admin' || profile.role === 'dev' ? '#ff0055' : '#00ff66',
                        backgroundColor: profile.role === 'admin' || profile.role === 'dev' ? 'rgba(255, 0, 85, 0.1)' : 'rgba(0, 255, 102, 0.1)',
                        boxShadow: profile.role === 'admin' || profile.role === 'dev' ? '0 0 10px rgba(255, 0, 85, 0.2)' : '0 0 10px rgba(0, 255, 102, 0.2)'
                      }}
                    >
                      {profile.role === 'dev' ? t('userProfile.devBadge').toUpperCase() : profile.role === 'admin' ? t('userProfile.adminBadge').toUpperCase() : t('userProfile.memberBadge').toUpperCase()}
                    </span>
                  </div>
                  <p style={{ color: '#aaa', fontSize: '0.9rem', margin: '0.5rem 0 0 0', maxWidth: '600px', lineHeight: 1.4 }}>
                    {profile.bio || 'Olá! Sou um membro ativo do PrismShare.'}
                  </p>
                  <div style={{ display: 'flex', gap: '1.2rem', marginTop: '0.6rem', fontSize: '0.75rem', color: '#666', fontFamily: 'JetBrains Mono, monospace' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={13} /> {t('userProfile.memberSince', { date: formatDate(profile.createdAt) })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Cards Grid */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ background: '#121212', border: '1px solid #222', padding: '0.7rem 1.2rem', textAlign: 'center', minWidth: '100px' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace' }}>
                    {profile.stats ? profile.stats.postsCount : (profile.posts ? profile.posts.length : 0)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#888', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.2rem' }}>{t('userProfile.statPosts').toUpperCase()}</div>
                </div>
                <div style={{ background: '#121212', border: '1px solid #222', padding: '0.7rem 1.2rem', textAlign: 'center', minWidth: '100px' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ff0055', fontFamily: 'JetBrains Mono, monospace' }}>
                    {profile.stats ? profile.stats.likesReceived : 0}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#888', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.2rem' }}>{t('userProfile.statLikes').toUpperCase()}</div>
                </div>
                <div style={{ background: '#121212', border: '1px solid #222', padding: '0.7rem 1.2rem', textAlign: 'center', minWidth: '100px' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#00ff66', fontFamily: 'JetBrains Mono, monospace' }}>
                    {profile.stats ? profile.stats.likedPostsCount : (profile.likedPosts ? profile.likedPosts.length : 0)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#888', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.2rem' }}>{t('userProfile.statFavorites').toUpperCase()}</div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #1f1f1f', backgroundColor: '#0f0f0f' }}>
              <button
                type="button"
                onClick={() => { setActiveTab('posts'); setIsEditing(false); }}
                style={{
                  padding: '1rem 1.8rem',
                  background: activeTab === 'posts' && !isEditing ? '#1a1a1a' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'posts' && !isEditing ? '2px solid #a78bfa' : '2px solid transparent',
                  color: activeTab === 'posts' && !isEditing ? '#a78bfa' : '#888',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <ImageIcon size={16} /> {t('userProfile.tabPosts', { count: profile.posts ? profile.posts.length : 0 }).toUpperCase()}
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('likes'); setIsEditing(false); }}
                style={{
                  padding: '1rem 1.8rem',
                  background: activeTab === 'likes' && !isEditing ? '#1a1a1a' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'likes' && !isEditing ? '2px solid #ff0055' : '2px solid transparent',
                  color: activeTab === 'likes' && !isEditing ? '#ff0055' : '#888',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Heart size={16} /> {t('userProfile.tabLikes', { count: profile.likedPosts ? profile.likedPosts.length : 0 }).toUpperCase()}
              </button>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => { setIsEditing(true); setActiveTab('settings'); }}
                  style={{
                    padding: '1rem 1.8rem',
                    background: isEditing || activeTab === 'settings' ? '#1a1a1a' : 'transparent',
                    border: 'none',
                    borderBottom: isEditing || activeTab === 'settings' ? '2px solid #00ff66' : '2px solid transparent',
                    color: isEditing || activeTab === 'settings' ? '#00ff66' : '#888',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Settings size={16} /> {t('userProfile.tabSettings').toUpperCase()}
                </button>
              )}
            </div>

            {/* Tab Contents */}
            <div style={{ padding: '2rem', flex: 1 }}>
              {saveSuccess && (
                <div style={{ background: 'rgba(0, 255, 102, 0.15)', border: '1px solid #00ff66', color: '#00ff66', padding: '0.8rem 1rem', marginBottom: '1.5rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={18} /> {t('userProfile.saveSuccess').toUpperCase()}
                </div>
              )}

              {isEditing || activeTab === 'settings' ? (
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '650px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontFamily: 'JetBrains Mono, monospace', borderBottom: '1px solid #222', paddingBottom: '0.5rem' }}>
                    {t('userProfile.settingsTitle').toUpperCase()}
                  </h3>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, marginBottom: '0.4rem' }}>
                      {t('userProfile.avatarLabel').toUpperCase()}:
                    </label>
                    <input
                      type="url"
                      placeholder={t('userProfile.avatarUrlPlaceholder')}
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#151515',
                        border: '1px solid #333',
                        color: '#fff',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box'
                      }}
                    />
                    <p style={{ fontSize: '0.7rem', color: '#666', margin: '0.3rem 0 0 0', fontFamily: 'JetBrains Mono, monospace' }}>
                      {t('userProfile.avatarHint')}
                    </p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, marginBottom: '0.4rem' }}>
                      {t('userProfile.bannerLabel').toUpperCase()}:
                    </label>
                    <input
                      type="url"
                      placeholder={t('userProfile.bannerUrlPlaceholder')}
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#151515',
                        border: '1px solid #333',
                        color: '#fff',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, marginBottom: '0.4rem' }}>
                      {t('userProfile.bioLabel').toUpperCase()}:
                    </label>
                    <textarea
                      rows="3"
                      placeholder={t('userProfile.bioPlaceholder')}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#151515',
                        border: '1px solid #333',
                        color: '#fff',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.9rem',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Content Preferences Section */}
                  <div style={{ background: '#121212', border: '1px solid #222', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ff0055', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Shield size={16} /> {(t('app.contentSection.title') || 'CONTEÚDO E FILTROS DE MÍDIA SENSÍVEL (+18)').toUpperCase()}
                    </div>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#ccc' }}>
                      <input
                        type="radio"
                        name="contentPref"
                        value="hide_mature"
                        checked={contentPref === 'hide_mature'}
                        onChange={() => handleContentPrefChange('hide_mature')}
                        style={{ width: '18px', height: '18px', accentColor: '#a78bfa', cursor: 'pointer', marginTop: '3px' }}
                      />
                      <div>
                        <strong>{t('app.contentSection.hideMature') || 'Esconder posts maduros'}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#777', marginTop: '0.2rem' }}>{t('app.contentSection.hideMatureDesc') || 'Não mostra nenhum post que tem NSFW e esconde as abas dos boorus que têm esse tipo de conteúdo'}</div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#ccc' }}>
                      <input
                        type="radio"
                        name="contentPref"
                        value="blur"
                        checked={contentPref === 'blur'}
                        onChange={() => handleContentPrefChange('blur')}
                        style={{ width: '18px', height: '18px', accentColor: '#a78bfa', cursor: 'pointer', marginTop: '3px' }}
                      />
                      <div>
                        <strong>{t('app.contentSection.blur') || 'Esvair'}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#777', marginTop: '0.2rem' }}>{t('app.contentSection.blurDesc') || 'Permite o usuário ver a mídia mas ela fica borrada até ser revelada'}</div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#ccc' }}>
                      <input
                        type="radio"
                        name="contentPref"
                        value="show_all"
                        checked={contentPref === 'show_all'}
                        onChange={() => handleContentPrefChange('show_all')}
                        style={{ width: '18px', height: '18px', accentColor: '#a78bfa', cursor: 'pointer', marginTop: '3px' }}
                      />
                      <div>
                        <strong>{t('app.contentSection.showAll') || 'Mostrar tudo'}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#777', marginTop: '0.2rem' }}>{t('app.contentSection.showAllDesc') || 'Não esconde nada e exibe todas as mídias sem desfoque'}</div>
                      </div>
                    </label>
                  </div>

                  {/* Privacy Configs */}
                  <div style={{ background: '#121212', border: '1px solid #222', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#00ff66', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Lock size={16} /> {(t('userProfile.privacyTitle') || 'PRIVACIDADE DO PERFIL').toUpperCase()}
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#ccc' }}>
                      <input
                        type="checkbox"
                        checked={showPosts}
                        onChange={(e) => setShowPosts(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#a78bfa', cursor: 'pointer' }}
                      />
                      <span>{t('userProfile.privacyShowPosts') || 'Tornar meus posts públicos'}</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#ccc' }}>
                      <input
                        type="checkbox"
                        checked={showLikes}
                        onChange={(e) => setShowLikes(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#ff0055', cursor: 'pointer' }}
                      />
                      <span>{t('userProfile.privacyShowLikes') || 'Tornar minha lista de curtidas pública'}</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{
                        background: '#00ff66',
                        color: '#000',
                        border: 'none',
                        padding: '0.8rem 1.8rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.9rem',
                        fontWeight: 900,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        boxShadow: '0 0 15px rgba(0, 255, 102, 0.4)'
                      }}
                    >
                      {saving ? t('userProfile.saving').toUpperCase() : t('userProfile.saveChanges').toUpperCase()}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsEditing(false); setActiveTab('posts'); }}
                      style={{
                        background: 'transparent',
                        color: '#888',
                        border: '1px solid #444',
                        padding: '0.8rem 1.5rem',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {t('userProfile.cancel').toUpperCase()}
                    </button>
                  </div>
                </form>
              ) : activeTab === 'posts' ? (
                <div>
                  {profile.privacy && !profile.privacy.showPosts && !isOwner ? (
                    <div style={{ padding: '3rem', textAlign: 'center', background: '#121212', border: '1px solid #222', color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>
                      <Lock size={32} style={{ margin: '0 auto 1rem auto', color: '#a78bfa' }} />
                      <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{t('userProfile.privatePostsTitle')}</p>
                      <p style={{ fontSize: '0.85rem' }}>{t('userProfile.privatePostsText')}</p>
                    </div>
                  ) : profile.posts && profile.posts.length > 0 ? (
                    <div className="media-grid">
                      {profile.posts.map(post => (
                        <MediaCard
                          key={post.id}
                          post={post}
                          currentUser={currentUser}
                          onLike={() => onLike && onLike(post.id)}
                          onSelect={() => onSelectPost && onSelectPost(post)}
                          onRequireAuth={onRequireAuth}
                        />
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '3rem', textAlign: 'center', background: '#121212', border: '1px solid #222', color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>
                      <ImageIcon size={32} style={{ margin: '0 auto 1rem auto', color: '#444' }} />
                      <p style={{ fontSize: '1rem', color: '#aaa' }}>{t('userProfile.emptyPostsTitle')}</p>
                      {isOwner && (
                        <button type="button" onClick={onOpenUpload} style={{ marginTop: '1rem', background: '#a78bfa', color: '#000', border: 'none', padding: '0.6rem 1.5rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, cursor: 'pointer' }}>
                          + {t('userProfile.uploadBtn').toUpperCase()}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {profile.privacy && !profile.privacy.showLikes && !isOwner ? (
                    <div style={{ padding: '3rem', textAlign: 'center', background: '#121212', border: '1px solid #222', color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>
                      <Lock size={32} style={{ margin: '0 auto 1rem auto', color: '#ff0055' }} />
                      <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{t('userProfile.privateLikesTitle')}</p>
                      <p style={{ fontSize: '0.85rem' }}>{t('userProfile.privateLikesText')}</p>
                    </div>
                  ) : profile.likedPosts && profile.likedPosts.length > 0 ? (
                    <div className="media-grid">
                      {profile.likedPosts.map(post => (
                        <MediaCard
                          key={post.id}
                          post={post}
                          currentUser={currentUser}
                          onLike={() => onLike && onLike(post.id)}
                          onSelect={() => onSelectPost && onSelectPost(post)}
                          onRequireAuth={onRequireAuth}
                        />
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '3rem', textAlign: 'center', background: '#121212', border: '1px solid #222', color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>
                      <Heart size={32} style={{ margin: '0 auto 1rem auto', color: '#444' }} />
                      <p style={{ fontSize: '1rem', color: '#aaa' }}>Nenhuma mídia favoritada / curtida por este usuário ainda.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {showAgeGate && (
        <AgeGateModal
          isOpen={showAgeGate}
          isBooruGate={false}
          onClose={() => {
            setShowAgeGate(false);
            setPendingContentPref(null);
          }}
          onSuccess={(data) => {
            setShowAgeGate(false);
            handleAgeVerificationSuccess(data);
          }}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
