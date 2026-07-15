import React, { useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function AdCard({ zoneId = null, currentUser = null, adCategory = 'adult' }) {
  const { t } = useLanguage();
  const adContainerRef = useRef(null);

  // Verifica se o usuário atual é VIP ou se tem ocultação de anúncios ativa
  const isVip = Boolean(currentUser?.isVip || (currentUser && localStorage.getItem(`vip_status_${currentUser.username}`) === 'active'));
  if (isVip) {
    return null;
  }

  // Pega o ID da zona correspondente (Adulto +18 ou Normal/SFW)
  // 5975042 é o nosso ID do Recommendation Widget criado na ExoClick para o Feed
  const defaultAdultZone = "5975042";
  const defaultSfwZone = localStorage.getItem('exoclick_zone_id_sfw') || "5975042";
  const activeZoneId = zoneId || localStorage.getItem('exoclick_zone_id') || (adCategory === 'sfw' ? defaultSfwZone : defaultAdultZone);

  // Renderizamos o iframe apontando para /ad.html?zone=...
  // Isso impede qualquer document.write no ciclo do React ou interferência no layout/escala da Masonry Grid
  const adIframeUrl = `/ad.html?zone=${activeZoneId}`;

  return (
    <div className="media-card" style={{
      background: '#0e0e0e',
      border: '1px solid #222',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      minHeight: '260px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      transition: 'all 0.2s ease'
    }}>
      <div style={{
        padding: '0.4rem 0.75rem',
        background: 'linear-gradient(90deg, #1f1f1f 0%, #121212 100%)',
        borderBottom: '1px solid #222',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.72rem',
        fontWeight: 800,
        color: '#a78bfa',
        letterSpacing: '0.5px'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Zap size={13} color="#a78bfa" /> PATROCINADO
        </span>
        <span style={{ fontSize: '0.65rem', color: '#666' }}>AD</span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyItems: 'center', padding: '1rem', background: '#080808' }}>
        {activeZoneId ? (
          <iframe
            src={adIframeUrl}
            title="Sponsored Advertisement"
            sandbox="allow-scripts allow-popups allow-forms"
            style={{
              width: '100%',
              height: '260px',
              border: 'none',
              overflow: 'hidden',
              borderRadius: '6px',
              backgroundColor: '#080808'
            }}
            scrolling="no"
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            minHeight: '210px',
            border: '1px dashed #333',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '1.25rem',
            background: 'rgba(167, 139, 250, 0.03)'
          }}>
            <Zap size={32} color="#a78bfa" style={{ marginBottom: '0.75rem', opacity: 0.7 }} />
            <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.95rem', color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>
              ESPAÇO PUBLICITÁRIO
            </h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#777', maxWidth: '220px', lineHeight: 1.4 }}>
              Insira o <strong>ID da Zona ExoClick</strong> para ativar anúncios interativos neste card do feed.
            </p>
            <div style={{
              marginTop: '0.85rem',
              padding: '0.3rem 0.6rem',
              background: '#141414',
              border: '1px solid #333',
              borderRadius: '4px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.7rem',
              color: '#a78bfa'
            }}>
              ID: Não configurado
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
