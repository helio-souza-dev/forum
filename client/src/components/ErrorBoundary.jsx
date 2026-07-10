import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

function ErrorFallbackUI({ error, onReload }) {
  const { t } = useLanguage();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'JetBrains Mono, monospace',
      textAlign: 'center'
    }}>
      <div style={{
        border: '2px solid #ff0055',
        backgroundColor: '#0a0a0a',
        padding: '2.5rem',
        maxWidth: '600px',
        width: '100%'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justify: 'center', gap: '0.75rem', color: '#ff0055', marginBottom: '1.25rem' }}>
          <AlertTriangle size={32} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>{t('errorBoundary.title').toUpperCase()}</h2>
        </div>
        
        <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          {t('errorBoundary.text')}
        </p>

        {error && (
          <div style={{
            backgroundColor: '#000000',
            border: '1px solid #333',
            padding: '1rem',
            color: '#ff0055',
            fontSize: '0.8rem',
            textAlign: 'left',
            overflowX: 'auto',
            marginBottom: '1.75rem'
          }}>
            <code>{error.toString()}</code>
          </div>
        )}

        <button
          onClick={onReload}
          style={{
            backgroundColor: '#a78bfa',
            color: '#000000',
            border: '1px solid #a78bfa',
            padding: '0.8rem 2rem',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 0 15px rgba(167, 139, 250, 0.4)'
          }}
        >
          <RefreshCw size={18} />
          {t('errorBoundary.reload').toUpperCase()}
        </button>
      </div>
    </div>
  );
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('⚡ [ErrorBoundary] Erro capturado no render:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallbackUI
          error={this.state.error}
          onReload={() => {
            this.setState({ hasError: false, error: null });
            window.location.reload();
          }}
        />
      );
    }

    return this.props.children;
  }
}
