import React, { useState, useEffect } from 'react';
import { Shield, Calendar, Check, X, Eye, Unlock } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { getAuthToken } from '../utils/auth';

export default function AgeGateModal({ isOpen, onClose, onSuccess, isBooruGate = false, currentUser }) {
  const { t } = useLanguage();
  
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('date'); // 'date' ou 'booru_options'

  useEffect(() => {
    if (isOpen) {
      setError('');
      const storedBirth = localStorage.getItem('user_birth_date');
      if (storedBirth) setBirthDate(storedBirth);

      const storedVerified = localStorage.getItem('age_verified');
      if (isBooruGate && storedVerified === 'verified_adult') {
        setStep('booru_options');
      } else {
        setStep('date');
      }
    }
  }, [isOpen, isBooruGate]);

  if (!isOpen) return null;

  const calculateAge = (dateString) => {
    if (!dateString) return 0;
    const today = new Date();
    const birthDateObj = new Date(dateString);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  const handleConfirmDate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!birthDate) {
      setError(t('app.ageGate.underageError') || 'Informe uma data válida.');
      return;
    }

    const age = calculateAge(birthDate);
    if (age < 18) {
      setError(t('app.ageGate.underageError'));
      localStorage.setItem('age_verified', 'underage');
      return;
    }

    setError('');
    localStorage.setItem('age_verified', 'verified_adult');
    localStorage.setItem('user_birth_date', birthDate);
    if (currentUser && currentUser.username) {
      localStorage.setItem(`age_verified_${currentUser.username}`, 'verified_adult');
    }

    // Atualiza no backend se estiver logado
    const token = getAuthToken();
    if (token) {
      try {
        await fetch('/api/users/settings/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ ageVerified: true, birthDate })
        });
      } catch (err) {
        console.error('Erro ao sincronizar verificação de idade:', err);
      }
    }

    window.dispatchEvent(new Event('user_settings_changed'));

    if (isBooruGate) {
      setStep('booru_options');
    } else {
      if (onSuccess) onSuccess({ ageVerified: true, birthDate });
      onClose();
    }
  };

  const handleSelectBooruMode = (mode) => {
    localStorage.setItem('booru_nsfw_mode', mode);
    localStorage.setItem('age_verified', 'verified_adult');
    if (currentUser && currentUser.username) {
      localStorage.setItem(`age_verified_${currentUser.username}`, 'verified_adult');
      localStorage.setItem(`user_content_pref_${currentUser.username}`, mode === 'reveal_all' ? 'show_all' : 'blur');
    }
    localStorage.setItem('user_content_pref', mode === 'reveal_all' ? 'show_all' : 'blur');
    window.dispatchEvent(new Event('user_settings_changed'));
    if (onSuccess) onSuccess({ ageVerified: true, birthDate, booruMode: mode });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={() => !isBooruGate && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#0c0c0c',
          border: '1px solid #a78bfa',
          boxShadow: '0 0 40px rgba(167, 139, 250, 0.2)',
          fontFamily: 'JetBrains Mono, monospace',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #1f1f1f',
            backgroundColor: '#0a0a0a'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#a78bfa', fontSize: '0.95rem', fontWeight: 800 }}>
            <Shield size={20} />
            <span>{(t('app.ageGate.title') || 'Verificação de idade').toUpperCase()}</span>
          </div>
          {!isBooruGate && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid #333',
                color: '#888',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#a78bfa'; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#888'; }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '1.75rem 1.5rem' }}>
          {step === 'date' ? (
            <form onSubmit={handleConfirmDate}>
              <div style={{ color: '#999', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.75rem' }}>
                {t('app.ageGate.desc') || 'Este conteúdo pode conter material adulto. Informe sua data de nascimento para continuar.'}
              </div>

              {error && (
                <div style={{
                  backgroundColor: 'rgba(167, 139, 250, 0.08)',
                  border: '1px solid rgba(167, 139, 250, 0.3)',
                  color: '#c4b5fd',
                  padding: '0.85rem 1rem',
                  fontSize: '0.82rem',
                  marginBottom: '1.5rem',
                  borderRadius: '4px',
                  lineHeight: '1.4'
                }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#a78bfa',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  marginBottom: '0.6rem',
                  letterSpacing: '0.05em'
                }}>
                  <Calendar size={15} />
                  {(t('app.ageGate.birthDateLabel') || 'Data de nascimento').toUpperCase()}
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  style={{
                    background: '#111',
                    border: '1px solid #2a2a2a',
                    color: '#fff',
                    padding: '0.85rem 1rem',
                    fontSize: '1rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    width: '100%',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#a78bfa'}
                  onBlur={(e) => e.target.style.borderColor = '#2a2a2a'}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                {!isBooruGate && (
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      background: 'transparent',
                      border: '1px solid #333',
                      color: '#888',
                      padding: '0.75rem 1.3rem',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#666'; e.currentTarget.style.color = '#ccc'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#888'; }}
                  >
                    {(t('common.cancel') || 'Cancelar').toUpperCase()}
                  </button>
                )}
                <button
                  type="submit"
                  style={{
                    background: '#a78bfa',
                    border: 'none',
                    color: '#000',
                    padding: '0.75rem 1.5rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    boxShadow: '0 0 15px rgba(167, 139, 250, 0.3)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#c4b5fd'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#a78bfa'; }}
                >
                  <Check size={16} />
                  <span>{(t('app.ageGate.confirmBtn') || 'Confirmar idade').toUpperCase()}</span>
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                {t('app.ageGate.booruTitle') || 'Preferência de visualização'}
              </div>
              <div style={{ color: '#888', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '1.75rem' }}>
                {t('app.ageGate.booruDesc') || 'Como deseja visualizar os cards?'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => handleSelectBooruMode('reveal_all')}
                  style={{
                    background: '#111',
                    border: '1px solid #222',
                    padding: '1.1rem 1rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    transition: 'border-color 0.2s, background 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#a78bfa'; e.currentTarget.style.background = '#14121e'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.background = '#111'; }}
                >
                  <div style={{ background: '#a78bfa', padding: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Unlock size={20} color="#000" />
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.3rem' }}>
                      {(t('app.ageGate.revealAllBtn') || 'Liberar tudo').toUpperCase()}
                    </div>
                    <div style={{ color: '#777', fontSize: '0.78rem', lineHeight: '1.35' }}>
                      {t('app.ageGate.revealAllDesc') || 'Exibe as imagens diretamente sem desfoque.'}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectBooruMode('selective_blur')}
                  style={{
                    background: '#111',
                    border: '1px solid #222',
                    padding: '1.1rem 1rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    transition: 'border-color 0.2s, background 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#a78bfa'; e.currentTarget.style.background = '#14121e'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.background = '#111'; }}
                >
                  <div style={{ background: '#333', padding: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Eye size={20} color="#a78bfa" />
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.3rem' }}>
                      {(t('app.ageGate.selectiveBlurBtn') || 'Manter esvaído').toUpperCase()}
                    </div>
                    <div style={{ color: '#777', fontSize: '0.78rem', lineHeight: '1.35' }}>
                      {t('app.ageGate.selectiveBlurDesc') || 'Mantém os cards borrados, revelando ao clicar.'}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
