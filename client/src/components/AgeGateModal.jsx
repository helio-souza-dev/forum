import React, { useState, useEffect } from 'react';
import { ShieldAlert, Calendar, Check, X, Eye, Unlock } from 'lucide-react';
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
      const storedVerified = localStorage.getItem('age_verified');
      const storedBirth = localStorage.getItem('user_birth_date');
      if (storedBirth) setBirthDate(storedBirth);

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
      setError(t('common.error') + ': Informe uma data válida.');
      return;
    }

    const age = calculateAge(birthDate);
    if (age < 18) {
      setError(t('ageGate.underageError'));
      localStorage.setItem('age_verified', 'underage');
      return;
    }

    setError('');
    localStorage.setItem('age_verified', 'verified_adult');
    localStorage.setItem('user_birth_date', birthDate);

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

    if (isBooruGate) {
      setStep('booru_options');
    } else {
      if (onSuccess) onSuccess({ ageVerified: true, birthDate });
      onClose();
    }
  };

  const handleSelectBooruMode = (mode) => {
    localStorage.setItem('booru_nsfw_mode', mode);
    if (onSuccess) onSuccess({ ageVerified: true, birthDate, booruMode: mode });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={() => !isBooruGate && onClose()}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '520px', 
          border: '1px solid #ff0055',
          boxShadow: '0 0 35px rgba(255, 0, 85, 0.2)'
        }}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid #331118' }}>
          <div className="modal-title" style={{ color: '#ff0055' }}>
            <ShieldAlert size={20} color="#ff0055" />
            <span>{t('ageGate.title').toUpperCase()}</span>
          </div>
          {!isBooruGate && (
            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        <div style={{ padding: '1.5rem 0 0.5rem' }}>
          {step === 'date' ? (
            <form onSubmit={handleConfirmDate}>
              <div style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                {t('ageGate.desc')}
              </div>

              {error && (
                <div style={{ backgroundColor: '#2a000a', border: '1px solid #ff0055', color: '#ff3366', padding: '0.75rem 1rem', fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace', marginBottom: '1.25rem', borderRadius: '4px' }}>
                  {error}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  <Calendar size={16} color="#ff0055" />
                  {t('ageGate.birthDateLabel').toUpperCase()}
                </label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  style={{ 
                    background: '#0d0d0d', 
                    border: '1px solid #333', 
                    color: '#fff', 
                    padding: '0.75rem 1rem', 
                    fontSize: '1rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                {!isBooruGate && (
                  <button 
                    type="button" 
                    onClick={onClose}
                    style={{ 
                      background: 'transparent', 
                      border: '1px solid #444', 
                      color: '#aaa', 
                      padding: '0.65rem 1.2rem', 
                      fontFamily: 'JetBrains Mono, monospace', 
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      cursor: 'pointer' 
                    }}
                  >
                    {t('common.cancel').toUpperCase()}
                  </button>
                )}
                <button 
                  type="submit" 
                  style={{ 
                    background: '#ff0055', 
                    border: 'none', 
                    color: '#fff', 
                    padding: '0.65rem 1.5rem', 
                    fontFamily: 'JetBrains Mono, monospace', 
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Check size={16} />
                  <span>{t('ageGate.confirmBtn').toUpperCase()}</span>
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {t('ageGate.booruTitle')}
              </div>
              <div style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '1.5rem' }}>
                {t('ageGate.booruDesc')}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button 
                  type="button"
                  onClick={() => handleSelectBooruMode('reveal_all')}
                  style={{
                    background: '#141414',
                    border: '1px solid #333',
                    padding: '1rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    transition: 'border-color 0.2s, background 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ff0055'; e.currentTarget.style.background = '#1a0d12'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.background = '#141414'; }}
                >
                  <div style={{ background: '#ff0055', padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Unlock size={22} color="#fff" />
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                      {t('ageGate.revealAllBtn').toUpperCase()}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.8rem', lineHeight: '1.3' }}>
                      {t('ageGate.revealAllDesc')}
                    </div>
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => handleSelectBooruMode('selective_blur')}
                  style={{
                    background: '#141414',
                    border: '1px solid #333',
                    padding: '1rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    transition: 'border-color 0.2s, background 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#a78bfa'; e.currentTarget.style.background = '#12111a'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.background = '#141414'; }}
                >
                  <div style={{ background: '#a78bfa', padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Eye size={22} color="#000" />
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                      {t('ageGate.selectiveBlurBtn').toUpperCase()}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.8rem', lineHeight: '1.3' }}>
                      {t('ageGate.selectiveBlurDesc')}
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
