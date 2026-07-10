import React, { useState } from 'react';
import { X, Lock, User, Key, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export function AuthModal({ isOpen, onClose, onAuthSuccess, initialTab = 'login' }) {
  if (!isOpen) return null;

  const [tab, setTab] = useState(initialTab); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Preencha o nome de usuário e a senha.');
      return;
    }

    setLoading(true);
    setError(null);

    const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro na autenticação');
      }

      onAuthSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#070707',
          border: '2px solid #a78bfa',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '12px 12px 0px rgba(167, 139, 250, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Header Bar */}
        <div style={{
          backgroundColor: '#000000',
          borderBottom: '1px solid #1f1f1f',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
            <Lock size={18} color="#a78bfa" />
            <span>SISTEMA DE AUTENTICAÇÃO</span>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: '#111',
              border: '1px solid #333',
              color: '#fff',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Notice Info Box */}
        <div style={{
          padding: '0.85rem 1.5rem',
          backgroundColor: '#0a0d0e',
          borderBottom: '1px solid #1a2a2d',
          color: '#d8b4fe',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <ShieldCheck size={18} color="#a78bfa" style={{ flexShrink: 0 }} />
          <span>Para curtir mídias ou participar dos comentários, você precisa estar conectado à sua identidade no PrismShare.</span>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #1f1f1f' }}>
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null); }}
            style={{
              background: tab === 'login' ? '#a78bfa' : '#0a0a0a',
              color: tab === 'login' ? '#000000' : '#888888',
              border: 'none',
              padding: '0.85rem',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'all 0.15s ease'
            }}
          >
            ENTRAR (LOGIN)
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); }}
            style={{
              background: tab === 'register' ? '#a78bfa' : '#0a0a0a',
              color: tab === 'register' ? '#000000' : '#888888',
              border: 'none',
              padding: '0.85rem',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'all 0.15s ease'
            }}
          >
            CRIAR CONTA
          </button>
        </div>

        {/* Form Area */}
        <form onSubmit={handleSubmit} style={{ padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#1f0505',
              border: '1px solid #ff0055',
              color: '#ff5588',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 800, color: '#aaa', textTransform: 'uppercase' }}>
              Nome de Usuário (@ID)
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User size={16} color="#a78bfa" style={{ position: 'absolute', left: '12px' }} />
              <input
                type="text"
                placeholder="ex: CyberMaster, Nishizumi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  backgroundColor: '#000000',
                  border: '1px solid #333333',
                  color: '#ffffff',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 800, color: '#aaa', textTransform: 'uppercase' }}>
              Senha de Acesso
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Key size={16} color="#a78bfa" style={{ position: 'absolute', left: '12px' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  backgroundColor: '#000000',
                  border: '1px solid #333333',
                  color: '#ffffff',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              backgroundColor: '#a78bfa',
              color: '#000000',
              border: 'none',
              padding: '0.95rem',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.95rem',
              fontWeight: 900,
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              textTransform: 'uppercase',
              boxShadow: '0 0 15px rgba(167, 139, 250, 0.4)'
            }}
          >
            <span>{loading ? 'PROCESSANDO...' : (tab === 'login' ? 'ACESSAR MINHA CONTA' : 'CADASTRAR E CONECTAR')}</span>
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
