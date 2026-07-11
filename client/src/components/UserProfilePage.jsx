import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Heart, Image as ImageIcon, Shield, Settings, Check, Lock, Calendar, Edit3, Eye, EyeOff, Terminal, Camera, Upload } from 'lucide-react';
import MediaCard from './MediaCard';
import PhotoCropperModal from './PhotoCropperModal';
import AgeGateModal from './AgeGateModal';
import { getAuthToken } from '../utils/auth';
import { useLanguage } from '../i18n/LanguageContext';

export default function UserProfilePage({ username, currentUser, onBack, onSelectPost, onOpenUpload, onRequireAuth, onLike, onOpenProfile, onLogout, onUpdateUser, onImportPost, importingIds }) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'likes' | 'settings'
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [followAnimating, setFollowAnimating] = useState(false);

  const [contentPreference, setContentPreference] = useState(currentUser?.contentPreference || localStorage.getItem('user_content_pref') || 'blur');
  const [ageVerified, setAgeVerified] = useState(Boolean(currentUser?.ageVerified || localStorage.getItem('age_verified') === 'verified_adult'));
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [pendingPreference, setPendingPreference] = useState(null);

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
      setContentPreference(data.contentPreference || localStorage.getItem('user_content_pref') || 'blur');
      setAgeVerified(Boolean(data.ageVerified || localStorage.getItem('age_verified') === 'verified_adult'));

      if (currentUser && currentUser.username && currentUser.username.toLowerCase() === username.toLowerCase() && onUpdateUser) {
        if (currentUser.avatarUrl !== (data.avatarUrl || '') || currentUser.bio !== (data.bio || '') || currentUser.contentPreference !== data.contentPreference || currentUser.ageVerified !== data.ageVerified) {
          onUpdateUser({ avatarUrl: data.avatarUrl || '', bio: data.bio || '', bannerUrl: data.bannerUrl || '', contentPreference: data.contentPreference || 'blur', ageVerified: Boolean(data.ageVerified) });
        }
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados do usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    const token = getAuthToken(currentUser);
    if (!token) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    try {
      setFollowAnimating(true);
      setTimeout(() => setFollowAnimating(false), 750);

      const res = await fetch(`/api/users/${encodeURIComponent(username)}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Falha ao seguir usuário');
      const data = await res.json();
      setProfile(prev => ({
        ...prev,
        isFollowing: data.isFollowing,
        followers: data.followers || prev.followers,
        stats: prev.stats ? {
          ...prev.stats,
          followersCount: data.followersCount !== undefined ? data.followersCount : prev.stats.followersCount
        } : {
          followersCount: data.followersCount
        }
      }));
    } catch (err) {
      console.error(err);
      setFollowAnimating(false);
    }
  };

  const handleContentPreferenceChange = async (pref) => {
    if (!isOwner) return;
    if (pref === 'show_all' || pref === 'blur') {
      if (!ageVerified) {
        setPendingPreference(pref);
        setShowAgeGate(true);
        return;
      }
    }

    setContentPreference(pref);
    localStorage.setItem('user_content_pref', pref);
    if (currentUser && currentUser.username) {
      localStorage.setItem(`user_content_pref_${currentUser.username}`, pref);
    }
    if (pref === 'hide_mature') {
      localStorage.setItem('booru_nsfw_mode', 'hide');
    } else if (pref === 'show_all') {
      localStorage.setItem('booru_nsfw_mode', 'reveal_all');
    } else if (pref === 'blur') {
      localStorage.setItem('booru_nsfw_mode', 'blur_all');
    }

    if (onUpdateUser) {
      onUpdateUser({ contentPreference: pref });
    }

    const token = getAuthToken(currentUser);
    if (token) {
      try {
        await fetch('/api/users/settings/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ contentPreference: pref, ageVerified: Boolean(ageVerified) })
        });
      } catch (err) {
        console.error('Erro ao salvar preferência de conteúdo no servidor:', err);
      }
    }
  };

  const handleAgeVerificationSuccess = async (data) => {
    setAgeVerified(true);
    localStorage.setItem('age_verified', 'verified_adult');
    if (currentUser && currentUser.username) {
      localStorage.setItem(`age_verified_${currentUser.username}`, 'verified_adult');
    }
    const targetPref = pendingPreference || 'blur';
    setContentPreference(targetPref);
    localStorage.setItem('user_content_pref', targetPref);
    if (currentUser && currentUser.username) {
      localStorage.setItem(`user_content_pref_${currentUser.username}`, targetPref);
    }
    if (targetPref === 'show_all') {
      localStorage.setItem('booru_nsfw_mode', 'reveal_all');
    } else {
      localStorage.setItem('booru_nsfw_mode', 'blur_all');
    }

    if (onUpdateUser) {
      onUpdateUser({ ageVerified: true, birthDate: data?.birthDate, contentPreference: targetPref });
    }

    const token = getAuthToken(currentUser);
    if (token) {
      try {
        await fetch('/api/users/settings/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ ageVerified: true, birthDate: data?.birthDate, contentPreference: targetPref })
        });
      } catch (err) {
        console.error('Erro ao salvar verificação de idade no servidor:', err);
      }
    }
    setPendingPreference(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!isOwner) return;
    try {
      setSaving(true);
      setSaveSuccess(false);
      const token = getAuthToken(currentUser);
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
      if (onUpdateUser) onUpdateUser(updated);
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
          <ArrowLeft size={16} /> {t('userProfile.back').toUpperCase()}
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
            <Settings size={15} /> {t('userProfile.editProfile').toUpperCase()}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '8rem 2rem', textAlign: 'center', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace' }}>
          <Terminal size={48} color="#a78bfa" style={{ margin: '0 auto 1.5rem auto', animation: 'pulse 1.5s infinite' }} />
          <div style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.5rem' }}>{t('userProfile.loading').toUpperCase()}</div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>{t('userProfile.loadingSubtext')}</div>
        </div>
      ) : error ? (
        <div style={{ padding: '6rem 2rem', textAlign: 'center', color: '#ff0055', fontFamily: 'JetBrains Mono, monospace' }}>
          <p style={{ fontSize: '1.4rem', fontWeight: 800 }}>{error}</p>
          <button type="button" onClick={onBack} style={{ marginTop: '1.5rem', background: 'transparent', border: '1px solid #ff0055', color: '#ff0055', padding: '0.6rem 1.8rem', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }}>
            ← {t('userProfile.back').toUpperCase()}
          </button>
        </div>
      ) : profile ? (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Hero Banner Section */}
          <div
            style={{
              height: 'clamp(200px, 26vw, 420px)',
              width: '100%',
              backgroundImage: profile.bannerUrl ? `url("${profile.bannerUrl}")` : 'linear-gradient(135deg, #1f1c2c 0%, #928DAB 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              position: 'relative',
              borderBottom: '1px solid #222'
            }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #050505 0%, rgba(5,5,5,0.3) 70%, transparent 100%)' }} />
          </div>

          {/* Profile Header Block */}
          <div className="profile-header-container" style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '0 clamp(1rem, 4vw, 2.5rem)', marginTop: 'clamp(-55px, -8vw, -75px)', position: 'relative', zIndex: 10 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', paddingBottom: '2rem', borderBottom: '1px solid #1f1f1f' }}>
              
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(1rem, 3vw, 2rem)', flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div
                  style={{
                    width: 'clamp(110px, 24vw, 150px)',
                    height: 'clamp(110px, 24vw, 150px)',
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
                    <h1 style={{ fontSize: 'clamp(1.6rem, 5vw, 2.5rem)', fontWeight: 900, color: '#fff', margin: 0, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-1px' }}>
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
                      {profile.role === 'dev' ? t('userProfile.devBadge').toUpperCase() : profile.role === 'admin' ? t('userProfile.adminBadge').toUpperCase() : t('userProfile.memberBadge').toUpperCase()}
                    </span>

                    {!isOwner && currentUser && (
                      <button
                        type="button"
                        onClick={handleToggleFollow}
                        style={{
                          marginLeft: '0.5rem',
                          padding: '0.4rem 1.25rem',
                          fontSize: '0.85rem',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontWeight: 900,
                          border: profile.isFollowing ? '1px solid #ff0055' : '1px solid #38bdf8',
                          color: profile.isFollowing ? '#ff0055' : '#000',
                          backgroundColor: profile.isFollowing ? 'transparent' : '#38bdf8',
                          borderRadius: '24px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: followAnimating ? '0 0 25px rgba(56, 189, 248, 0.8)' : (profile.isFollowing ? 'none' : '0 0 15px rgba(56, 189, 248, 0.4)'),
                          transform: followAnimating ? 'scale(1.15)' : 'scale(1)',
                          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }}
                      >
                        {profile.isFollowing ? 'SEGUINDO' : '+ SEGUIR'}
                      </button>
                    )}
                  </div>

                  <p style={{ color: '#ccc', fontSize: '1.05rem', margin: '0.75rem 0 0.5rem 0', maxWidth: '750px', lineHeight: 1.5, fontFamily: 'sans-serif' }}>
                    {profile.bio || ''}
                  </p>

                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.8rem', color: '#777', fontFamily: 'JetBrains Mono, monospace' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} color="#a78bfa" /> {t('userProfile.memberSince', { date: formatDate(profile.createdAt) })}
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
                  <div style={{ fontSize: '0.7rem', color: '#888', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.3rem', fontWeight: 800 }}>{t('userProfile.statPosts').toUpperCase()}</div>
                </div>

                <div style={{ background: '#0e0e0e', border: '1px solid #222', padding: '1rem 1.6rem', textAlign: 'center', minWidth: '120px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ff0055', fontFamily: 'JetBrains Mono, monospace' }}>
                    {profile.stats ? profile.stats.likesReceived : 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#888', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.3rem', fontWeight: 800 }}>{t('userProfile.statLikes').toUpperCase()}</div>
                </div>

                <div style={{ background: '#0e0e0e', border: '1px solid #222', padding: '1rem 1.6rem', textAlign: 'center', minWidth: '120px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#00ff66', fontFamily: 'JetBrains Mono, monospace' }}>
                    {profile.stats ? profile.stats.likedPostsCount : (profile.likedPosts ? profile.likedPosts.length : 0)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#888', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.3rem', fontWeight: 800 }}>{t('userProfile.statFavorites').toUpperCase()}</div>
                </div>

                <div style={{
                  background: '#0e0e0e',
                  border: followAnimating ? '1px solid #38bdf8' : '1px solid #222',
                  padding: '1rem 1.6rem',
                  textAlign: 'center',
                  minWidth: '120px',
                  borderRadius: '6px',
                  transform: followAnimating ? 'scale(1.12)' : 'scale(1)',
                  boxShadow: followAnimating ? '0 0 20px rgba(56, 189, 248, 0.4)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>
                    {profile.stats && profile.stats.followersCount !== undefined ? profile.stats.followersCount : (profile.followers ? profile.followers.length : 0)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#888', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.3rem', fontWeight: 800 }}>SEGUIDORES</div>
                </div>

                <div style={{ background: '#0e0e0e', border: '1px solid #222', padding: '1rem 1.6rem', textAlign: 'center', minWidth: '120px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f43f5e', fontFamily: 'JetBrains Mono, monospace' }}>
                    {profile.stats && profile.stats.followingCount !== undefined ? profile.stats.followingCount : (profile.following ? profile.following.length : 0)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#888', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.3rem', fontWeight: 800 }}>SEGUINDO</div>
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
                <ImageIcon size={18} /> {t('userProfile.tabPosts', { count: profile.posts ? profile.posts.length : 0 }).toUpperCase()}
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
                <Heart size={18} /> {t('userProfile.tabLikes', { count: profile.likedPosts ? profile.likedPosts.length : 0 }).toUpperCase()}
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
                  <Settings size={18} /> {t('userProfile.tabSettings').toUpperCase()}
                </button>
              )}

              {isOwner && !isEditing && activeTab !== 'settings' && (
                <button
                  type="button"
                  onClick={onOpenUpload}
                  style={{
                    marginLeft: 'auto',
                    background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
                    color: '#000',
                    border: 'none',
                    padding: '0.6rem 1.5rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.85rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 0 16px rgba(167, 139, 250, 0.4)',
                    alignSelf: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  + {(!profile.posts || profile.posts.length === 0) ? t('userProfile.uploadFirst').toUpperCase() : t('userProfile.uploadBtn').toUpperCase()}
                </button>
              )}
            </div>
          </div>

          {/* Page Body Content */}
          <div style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '2.5rem', flex: 1 }}>
            {saveSuccess && (
              <div style={{ background: 'rgba(0, 255, 102, 0.15)', border: '1px solid #00ff66', color: '#00ff66', padding: '1rem 1.5rem', marginBottom: '2rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: '4px' }}>
                <Check size={20} /> {t('userProfile.saveSuccess')}
              </div>
            )}

            {isEditing || activeTab === 'settings' ? (
              <div style={{ background: '#0e0e0e', border: '1px solid #222', padding: '2.5rem', maxWidth: '800px', borderRadius: '8px' }}>
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#fff', fontFamily: 'JetBrains Mono, monospace', borderBottom: '1px solid #222', paddingBottom: '0.75rem' }}>
                    {t('userProfile.settingsTitle').toUpperCase()}
                  </h3>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, marginBottom: '0.75rem' }}>
                      {t('userProfile.avatarLabel').toUpperCase()}:
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <label style={{
                        width: '130px',
                        height: '130px',
                        borderRadius: '50%',
                        border: '3px dashed #a78bfa',
                        backgroundColor: '#121212',
                        position: 'relative',
                        cursor: uploadingAvatar ? 'wait' : 'pointer',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(167, 139, 250, 0.3)',
                        transition: 'all 0.2s ease'
                      }}>
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ color: '#a78bfa', fontSize: '3.2rem', fontWeight: 900, fontFamily: 'JetBrains Mono, monospace' }}>
                            {profile.username ? profile.username[0].toUpperCase() : 'A'}
                          </div>
                        )}
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                          color: '#fff',
                          textAlign: 'center',
                          padding: '0.5rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                        >
                          <Camera size={26} style={{ marginBottom: '0.3rem', color: '#a78bfa' }} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#a78bfa' }}>
                            {uploadingAvatar ? t('userProfile.uploadingFree') : 'ALTERAR FOTO'}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelectForCropper(e, 'avatar')}
                          disabled={uploadingAvatar}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <p style={{ fontSize: '0.8rem', color: '#aaa', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>
                        Clique na foto para selecionar e recortar imagem de perfil.
                      </p>
                      <details style={{ marginTop: '0.25rem' }}>
                        <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: '#888', fontFamily: 'JetBrains Mono, monospace', userSelect: 'none' }}>
                          Inserir URL web diretamente
                        </summary>
                        <input
                          type="text"
                          placeholder={t('userProfile.avatarUrlPlaceholder')}
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          style={{
                            width: '100%',
                            marginTop: '0.5rem',
                            padding: '0.75rem',
                            backgroundColor: '#151515',
                            border: '1px solid #333',
                            color: '#fff',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '0.85rem',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </details>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, marginBottom: '0.75rem' }}>
                      {t('userProfile.bannerLabel').toUpperCase()}:
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <label style={{
                        width: '100%',
                        height: '180px',
                        borderRadius: '12px',
                        border: '3px dashed #a78bfa',
                        backgroundColor: '#121212',
                        backgroundImage: bannerUrl ? `url("${bannerUrl}")` : 'linear-gradient(135deg, #1f1c2c 0%, #928DAB 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center center',
                        position: 'relative',
                        cursor: uploadingBanner ? 'wait' : 'pointer',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(167, 139, 250, 0.3)',
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: bannerUrl ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.35)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: bannerUrl ? 0 : 1,
                          transition: 'opacity 0.2s ease',
                          color: '#fff',
                          textAlign: 'center',
                          padding: '1rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = bannerUrl ? 0 : 1}
                        >
                          <Upload size={28} style={{ marginBottom: '0.4rem', color: '#a78bfa' }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: '#a78bfa', border: '1px solid #a78bfa', padding: '0.5rem 1.25rem', borderRadius: '24px', backgroundColor: 'rgba(23, 16, 40, 0.85)', boxShadow: '0 0 15px rgba(167, 139, 250, 0.4)' }}>
                            {uploadingBanner ? t('userProfile.uploadingFree') : 'ALTERAR CAPA'}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelectForCropper(e, 'banner')}
                          disabled={uploadingBanner}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <p style={{ fontSize: '0.8rem', color: '#aaa', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>
                        Clique no quadro para selecionar e recortar imagem panorâmica.
                      </p>
                      <details style={{ marginTop: '0.25rem' }}>
                        <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: '#888', fontFamily: 'JetBrains Mono, monospace', userSelect: 'none' }}>
                          Inserir URL web diretamente
                        </summary>
                        <input
                          type="text"
                          placeholder={t('userProfile.bannerUrlPlaceholder')}
                          value={bannerUrl}
                          onChange={(e) => setBannerUrl(e.target.value)}
                          style={{
                            width: '100%',
                            marginTop: '0.5rem',
                            padding: '0.75rem',
                            backgroundColor: '#151515',
                            border: '1px solid #333',
                            color: '#fff',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '0.85rem',
                            borderRadius: '4px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </details>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, marginBottom: '0.5rem' }}>
                      {t('userProfile.bioLabel').toUpperCase()}:
                    </label>
                    <textarea
                      rows="4"
                      placeholder={t('userProfile.bioPlaceholder')}
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
                      <Lock size={18} /> {t('userProfile.privacyTitle').toUpperCase()}
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: '#ccc' }}>
                      <input
                        type="checkbox"
                        checked={showPosts}
                        onChange={(e) => setShowPosts(e.target.checked)}
                        style={{ width: '20px', height: '20px', accentColor: '#a78bfa', cursor: 'pointer' }}
                      />
                      <span>{t('userProfile.privacyShowPosts')}</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: '#ccc' }}>
                      <input
                        type="checkbox"
                        checked={showLikes}
                        onChange={(e) => setShowLikes(e.target.checked)}
                        style={{ width: '20px', height: '20px', accentColor: '#ff0055', cursor: 'pointer' }}
                      />
                      <span>{t('userProfile.privacyShowLikes')}</span>
                    </label>
                  </div>

                  {/* Content Preferences Configs */}
                  <div style={{ background: '#121212', border: '1px solid #222', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ff0055', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Shield size={18} /> {t('app.contentSection.title') || 'CONTEÚDO E MÍDIA SENSÍVEL (+18)'}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: '#ccc' }}>
                        <input
                          type="radio"
                          name="contentPreference"
                          value="hide_mature"
                          checked={contentPreference === 'hide_mature'}
                          onChange={() => handleContentPreferenceChange('hide_mature')}
                          style={{ width: '18px', height: '18px', accentColor: '#a78bfa', cursor: 'pointer', marginTop: '3px' }}
                        />
                        <div>
                          <div style={{ fontWeight: 800, color: '#fff' }}>{t('app.contentSection.hideMature') || 'Esconder posts maduros'}</div>
                          <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.2rem' }}>{t('app.contentSection.hideMatureDesc') || 'Não mostra nenhum post que tem NSFW e esconde as abas dos boorus que têm esse tipo de conteúdo'}</div>
                        </div>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: '#ccc' }}>
                        <input
                          type="radio"
                          name="contentPreference"
                          value="blur"
                          checked={contentPreference === 'blur'}
                          onChange={() => handleContentPreferenceChange('blur')}
                          style={{ width: '18px', height: '18px', accentColor: '#a78bfa', cursor: 'pointer', marginTop: '3px' }}
                        />
                        <div>
                          <div style={{ fontWeight: 800, color: '#fff' }}>{t('app.contentSection.blur') || 'Esvair'}</div>
                          <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.2rem' }}>{t('app.contentSection.blurDesc') || 'Permite o usuário ver a mídia mas ela fica borrada até ser revelada'}</div>
                        </div>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', color: '#ccc' }}>
                        <input
                          type="radio"
                          name="contentPreference"
                          value="show_all"
                          checked={contentPreference === 'show_all'}
                          onChange={() => handleContentPreferenceChange('show_all')}
                          style={{ width: '18px', height: '18px', accentColor: '#a78bfa', cursor: 'pointer', marginTop: '3px' }}
                        />
                        <div>
                          <div style={{ fontWeight: 800, color: '#fff' }}>{t('app.contentSection.showAll') || 'Mostrar tudo'}</div>
                          <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.2rem' }}>{t('app.contentSection.showAllDesc') || 'Não esconde nada e exibe todas as mídias sem desfoque'}</div>
                        </div>
                      </label>
                    </div>

                    {!ageVerified && (
                      <div style={{ fontSize: '0.75rem', color: '#ffb300', fontFamily: 'JetBrains Mono, monospace', backgroundColor: 'rgba(255, 179, 0, 0.1)', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(255, 179, 0, 0.3)' }}>
                        {t('app.contentSection.ageReqNotice') || 'Atenção: Para selecionar Mostrar tudo ou Esvair é necessário comprovar idade maior que 18 anos.'}
                      </div>
                    )}
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
                      {saving ? t('userProfile.saving').toUpperCase() : t('userProfile.saveChanges').toUpperCase()}
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
                      {t('userProfile.cancel').toUpperCase()}
                    </button>
                  </div>

                  {/* Logout Section */}
                  <div style={{ borderTop: '1px solid #222', marginTop: '2rem', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ color: '#ff3366', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.95rem' }}>
                        {t('userProfile.logoutTitle').toUpperCase()}
                      </div>
                      <div style={{ color: '#777', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                        {t('userProfile.logoutDesc')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onLogout}
                      style={{ background: '#1a0508', color: '#ff3366', border: '1px solid #ff3366', padding: '0.7rem 1.5rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, cursor: 'pointer', borderRadius: '4px', transition: 'all 0.2s' }}
                    >
                      {t('userProfile.logoutBtn').toUpperCase()}
                    </button>
                  </div>
                </form>
              </div>
            ) : activeTab === 'posts' ? (
              <div>
                {profile.privacy && !profile.privacy.showPosts && !isOwner ? (
                  <div style={{ padding: '5rem 2rem', textAlign: 'center', background: '#0e0e0e', border: '1px solid #222', color: '#888', fontFamily: 'JetBrains Mono, monospace', borderRadius: '8px' }}>
                    <Lock size={40} style={{ margin: '0 auto 1.2rem auto', color: '#a78bfa' }} />
                    <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem 0' }}>{t('userProfile.privatePostsTitle')}</p>
                    <p style={{ fontSize: '0.95rem', color: '#777' }}>{t('userProfile.privatePostsText')}</p>
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
                        onImportPost={onImportPost}
                        importingIds={importingIds}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '5rem 2rem', textAlign: 'center', background: '#0e0e0e', border: '1px solid #222', color: '#888', fontFamily: 'JetBrains Mono, monospace', borderRadius: '8px' }}>
                    <ImageIcon size={40} style={{ margin: '0 auto 1.2rem auto', color: '#444' }} />
                    <p style={{ fontSize: '1.15rem', color: '#aaa', fontWeight: 800 }}>{t('userProfile.emptyPostsTitle')}</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {profile.privacy && !profile.privacy.showLikes && !isOwner ? (
                  <div style={{ padding: '5rem 2rem', textAlign: 'center', background: '#0e0e0e', border: '1px solid #222', color: '#888', fontFamily: 'JetBrains Mono, monospace', borderRadius: '8px' }}>
                    <Lock size={40} style={{ margin: '0 auto 1.2rem auto', color: '#ff0055' }} />
                    <p style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem 0' }}>{t('userProfile.privateLikesTitle')}</p>
                    <p style={{ fontSize: '0.95rem', color: '#777' }}>{t('userProfile.privateLikesText')}</p>
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
                        onImportPost={onImportPost}
                        importingIds={importingIds}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '5rem 2rem', textAlign: 'center', background: '#0e0e0e', border: '1px solid #222', color: '#888', fontFamily: 'JetBrains Mono, monospace', borderRadius: '8px' }}>
                    <Heart size={40} style={{ margin: '0 auto 1.2rem auto', color: '#444' }} />
                    <p style={{ fontSize: '1.15rem', color: '#aaa', fontWeight: 800 }}>{t('userProfile.emptyLikesTitle')}</p>
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

      <AgeGateModal
        isOpen={showAgeGate}
        onClose={() => {
          setShowAgeGate(false);
          setPendingPreference(null);
        }}
        onSuccess={handleAgeVerificationSuccess}
        currentUser={currentUser}
      />
    </main>
  );
}
