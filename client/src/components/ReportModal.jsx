import React, { useState } from 'react';
import { AlertTriangle, X, Check, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { getAuthToken } from '../utils/auth';

export default function ReportModal({ isOpen, onClose, post, onSuccess }) {
  const { t } = useLanguage();

  const [reason, setReason] = useState('nsfw_unmarked');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !post) return null;

  const reasonsList = [
    { key: 'nsfw_unmarked', label: t('reportModal.reasons.nsfw_unmarked') },
    { key: 'spam', label: t('reportModal.reasons.spam') },
    { key: 'copyright', label: t('reportModal.reasons.copyright') },
    { key: 'harassment', label: t('reportModal.reasons.harassment') },
    { key: 'bot', label: t('reportModal.reasons.bot') },
    { key: 'other', label: t('reportModal.reasons.other') }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) {
      setError(t('common.error') + ': Você precisa estar autenticado para abrir uma denúncia.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetId: post.id,
          reason,
          details: details.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível registrar a denúncia.');
      }

      setSubmitting(false);
      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      setSubmitting(false);
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '540px', border: '1px solid #ff3300' }}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid #2a110a' }}>
          <div className="modal-title" style={{ color: '#ff3300' }}>
            <AlertTriangle size={18} color="#ff3300" />
            <span>{t('reportModal.title').toUpperCase()}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ paddingTop: '1rem' }}>
          <div style={{ background: '#181414', borderLeft: '3px solid #ffaa00', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <ShieldAlert size={20} color="#ffaa00" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ color: '#ccc', fontSize: '0.8rem', lineHeight: '1.4' }}>
              {t('reportModal.warning')}
            </div>
          </div>

          <div style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 'bold' }}>
            Alvo da denúncia: <span style={{ color: '#ff3300', fontFamily: 'JetBrains Mono, monospace' }}>{post.title || post.id}</span>
          </div>

          {error && (
            <div style={{ backgroundColor: '#2a0000', border: '1px solid #ff0055', color: '#ff3366', padding: '0.75rem 1rem', fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace', marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ color: '#fff', fontSize: '0.85rem' }}>
              {t('reportModal.reasonLabel').toUpperCase()}
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {reasonsList.map((item) => (
                <label 
                  key={item.key}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    background: reason === item.key ? '#26120e' : '#111', 
                    border: `1px solid ${reason === item.key ? '#ff3300' : '#222'}`, 
                    padding: '0.65rem 0.85rem', 
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <input 
                    type="radio" 
                    name="reportReason" 
                    value={item.key} 
                    checked={reason === item.key} 
                    onChange={() => setReason(item.key)}
                    style={{ accentColor: '#ff3300' }}
                  />
                  <span style={{ color: reason === item.key ? '#fff' : '#bbb', fontSize: '0.85rem', fontWeight: reason === item.key ? 'bold' : 'normal' }}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ color: '#fff', fontSize: '0.85rem' }}>
              {t('reportModal.detailsLabel').toUpperCase()}
            </label>
            <textarea 
              className="form-input"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t('reportModal.detailsPlaceholder')}
              style={{ background: '#0d0d0d', border: '1px solid #333', color: '#fff', padding: '0.75rem', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid #222', paddingTop: '1rem' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ background: 'transparent', border: '1px solid #444', color: '#aaa', padding: '0.6rem 1.2rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {t('common.cancel').toUpperCase()}
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              style={{ background: submitting ? '#555' : '#ff3300', border: 'none', color: '#fff', padding: '0.6rem 1.4rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Check size={16} />
              <span>{submitting ? t('common.loading').toUpperCase() : t('reportModal.submitBtn').toUpperCase()}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
