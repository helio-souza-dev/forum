import React, { useState } from 'react';
import { Shield, AlertTriangle, Users, FileText, ArrowLeft, Ban, CheckCircle, Clock, ChevronDown, Eye, Heart, Image, Film, X } from 'lucide-react';

const FONT = 'JetBrains Mono, monospace';

const ROLE_COLORS = {
  dev: '#a78bfa',
  admin: '#f59e0b',
  user: '#888888'
};

const ROLE_LABELS = {
  dev: 'DEV',
  admin: 'ADMIN',
  user: 'USUARIO'
};

function RoleBadge({ role }) {
  const color = ROLE_COLORS[role] || '#888';
  const label = ROLE_LABELS[role] || role?.toUpperCase() || 'N/A';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.15rem 0.55rem',
      border: `1px solid ${color}`,
      backgroundColor: `${color}18`,
      color: color,
      fontFamily: FONT,
      fontSize: '0.7rem',
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {label}
    </span>
  );
}

function StatusBadge({ banned }) {
  const color = banned ? '#ff0055' : '#00ff66';
  const label = banned ? 'BANIDO' : 'ATIVO';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      padding: '0.15rem 0.55rem',
      border: `1px solid ${color}`,
      backgroundColor: `${color}18`,
      color: color,
      fontFamily: FONT,
      fontSize: '0.7rem',
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {banned ? <Ban size={11} /> : <CheckCircle size={11} />}
      {label}
    </span>
  );
}

function BanModal({ post, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');

  return (
    <div
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
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#070707',
          border: '2px solid #ff0055',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '12px 12px 0px rgba(255, 0, 85, 0.25)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div style={{
          backgroundColor: '#000000',
          borderBottom: '1px solid #1f1f1f',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontFamily: FONT,
            fontSize: '0.95rem',
            fontWeight: 800,
            color: '#ff0055'
          }}>
            <AlertTriangle size={18} color="#ff0055" />
            <span>CONFIRMAR BANIMENTO</span>
          </div>
          <button
            onClick={onCancel}
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

        {/* Target info */}
        <div style={{
          padding: '0.85rem 1.5rem',
          backgroundColor: '#0a0505',
          borderBottom: '1px solid #2a1010',
          color: '#ff8888',
          fontFamily: FONT,
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Ban size={14} />
          <span>Midia alvo: <strong style={{ color: '#fff' }}>{post?.title || 'Sem titulo'}</strong></span>
        </div>

        {/* Form */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{
              fontFamily: FONT,
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#aaa',
              textTransform: 'uppercase'
            }}>
              Motivo do banimento
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo do banimento desta midia..."
              rows={4}
              style={{
                width: '100%',
                backgroundColor: '#000000',
                border: '1px solid #333',
                color: '#ffffff',
                fontFamily: FONT,
                fontSize: '0.85rem',
                padding: '0.75rem 1rem',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ff0055';
                e.target.style.boxShadow = '0 0 10px rgba(255, 0, 85, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#333';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              onClick={onCancel}
              className="btn-sm"
              style={{
                background: '#0c0c0c',
                border: '1px solid #333',
                color: '#888',
                fontFamily: FONT,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0 0.85rem',
                height: '34px',
                display: 'inline-flex',
                alignItems: 'center',
                textTransform: 'uppercase'
              }}
            >
              CANCELAR
            </button>
            <button
              onClick={() => onConfirm(reason)}
              disabled={!reason.trim()}
              style={{
                background: reason.trim() ? '#ff0055' : '#331015',
                border: `1px solid ${reason.trim() ? '#ff0055' : '#552025'}`,
                color: reason.trim() ? '#000' : '#664050',
                fontFamily: FONT,
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: reason.trim() ? 'pointer' : 'not-allowed',
                padding: '0 1rem',
                height: '34px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                textTransform: 'uppercase',
                boxShadow: reason.trim() ? '0 0 12px rgba(255, 0, 85, 0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Ban size={13} />
              CONFIRMAR BANIMENTO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel({
  currentUser,
  posts = [],
  onBanPost,
  onUnbanPost,
  onBack,
  users = [],
  onSetUserRole,
  auditLog = []
}) {
  const [activeTab, setActiveTab] = useState('midias');
  const [mediaFilter, setMediaFilter] = useState('todas');
  const [banTarget, setBanTarget] = useState(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(null);

  const activePosts = posts.filter(p => !p.banned);
  const bannedPosts = posts.filter(p => p.banned);

  const filteredPosts = mediaFilter === 'ativas'
    ? activePosts
    : mediaFilter === 'banidas'
      ? bannedPosts
      : posts;

  const handleBanConfirm = (reason) => {
    if (banTarget && onBanPost) {
      onBanPost(banTarget.id || banTarget._id, reason);
    }
    setBanTarget(null);
  };

  const handleRoleChange = (userId, newRole) => {
    if (onSetUserRole) onSetUserRole(userId, newRole);
    setRoleDropdownOpen(null);
  };

  const getMediaType = (post) => {
    if (!post) return 'image';
    if (post.type) return post.type;
    const url = post.fileUrl || post.url || '';
    if (url.match(/\.(mp4|webm|mov)$/i)) return 'video';
    if (url.match(/\.gif$/i)) return 'gif';
    return 'image';
  };

  const getThumbUrl = (post) => {
    if (post.thumbnailUrl) return post.thumbnailUrl;
    if (post.fileUrl) return post.fileUrl;
    if (post.url) return post.url;
    return '';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '--';
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '--';
    try {
      return new Date(dateStr).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return '--';
    }
  };

  const tabs = [
    { key: 'midias', label: 'MIDIAS', icon: <Image size={15} /> },
    { key: 'usuarios', label: 'USUARIOS', icon: <Users size={15} /> },
    { key: 'auditoria', label: 'LOG DE AUDITORIA', icon: <FileText size={15} /> }
  ];

  const filterButtons = [
    { key: 'todas', label: 'TODAS' },
    { key: 'ativas', label: 'ATIVAS' },
    { key: 'banidas', label: 'BANIDAS' }
  ];

  const tableHeaderStyle = {
    padding: '0.75rem 1rem',
    fontFamily: FONT,
    fontSize: '0.7rem',
    fontWeight: 800,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    textAlign: 'left',
    borderBottom: '2px solid #222',
    backgroundColor: '#000'
  };

  const tableCellStyle = {
    padding: '0.65rem 1rem',
    fontFamily: FONT,
    fontSize: '0.8rem',
    color: '#ccc',
    verticalAlign: 'middle'
  };

  const tableRowHover = (e) => {
    e.currentTarget.style.backgroundColor = '#111';
  };
  const tableRowLeave = (e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      fontFamily: FONT
    }}>
      {/* Top Bar */}
      <div style={{
        backgroundColor: '#070707',
        borderBottom: '2px solid #a78bfa',
        padding: '0.85rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <button
          onClick={onBack}
          style={{
            background: '#0c0c0c',
            border: '1px solid #333',
            color: '#a78bfa',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#a78bfa';
            e.currentTarget.style.boxShadow = '4px 4px 0px #a78bfa';
            e.currentTarget.style.transform = 'translate(-2px, -2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'none';
          }}
          title="Voltar ao feed"
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Shield size={22} color="#a78bfa" />
          <span style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            PAINEL DE ADMINISTRACAO
          </span>
        </div>
        {currentUser && (
          <div style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: '#888'
          }}>
            <span>OPERADOR:</span>
            <span style={{ color: '#a78bfa', fontWeight: 800 }}>@{currentUser.username}</span>
            <RoleBadge role={currentUser.role} />
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #222',
        backgroundColor: '#070707'
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: '0.85rem 1rem',
                backgroundColor: isActive ? '#a78bfa' : 'transparent',
                color: isActive ? '#000' : '#888',
                border: 'none',
                borderRight: '1px solid #1a1a1a',
                fontFamily: FONT,
                fontSize: '0.8rem',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                textTransform: 'uppercase',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.backgroundColor = '#111';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#888';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div style={{
        backgroundColor: '#070707',
        border: '2px solid #a78bfa',
        margin: '1.5rem 2rem',
        minHeight: '400px'
      }}>

        {/* ===== TAB: MIDIAS ===== */}
        {activeTab === 'midias' && (
          <div>
            {/* Stats Header */}
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                  TOTAL:
                  <span style={{ color: '#00ff66', fontWeight: 800, marginLeft: '0.5rem' }}>
                    {activePosts.length}
                  </span>
                  <span style={{ color: '#666', marginLeft: '0.3rem' }}>midias ativas</span>
                  <span style={{ color: '#888', margin: '0 0.5rem' }}>|</span>
                  <span style={{ color: '#ff0055', fontWeight: 800 }}>
                    {bannedPosts.length}
                  </span>
                  <span style={{ color: '#666', marginLeft: '0.3rem' }}>banidas</span>
                </span>
              </div>

              {/* Filter Buttons */}
              <div style={{ display: 'flex', border: '1px solid #333', backgroundColor: '#000' }}>
                {filterButtons.map((fb) => {
                  const active = mediaFilter === fb.key;
                  return (
                    <button
                      key={fb.key}
                      onClick={() => setMediaFilter(fb.key)}
                      style={{
                        backgroundColor: active ? '#a78bfa' : 'transparent',
                        color: active ? '#000' : '#888',
                        border: 'none',
                        borderRight: '1px solid #222',
                        padding: '0 0.85rem',
                        height: '34px',
                        fontFamily: FONT,
                        fontSize: '0.72rem',
                        fontWeight: active ? 800 : 600,
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {fb.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Media Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'auto'
              }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>PREVIEW</th>
                    <th style={tableHeaderStyle}>TITULO</th>
                    <th style={tableHeaderStyle}>TIPO</th>
                    <th style={tableHeaderStyle}>VIEWS</th>
                    <th style={tableHeaderStyle}>LIKES</th>
                    <th style={tableHeaderStyle}>STATUS</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>ACOES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{
                        ...tableCellStyle,
                        textAlign: 'center',
                        padding: '3rem 1rem',
                        color: '#555'
                      }}>
                        Nenhuma midia encontrada neste filtro.
                      </td>
                    </tr>
                  )}
                  {filteredPosts.map((post) => {
                    const postId = post.id || post._id;
                    const mediaType = getMediaType(post);
                    const thumbUrl = getThumbUrl(post);
                    return (
                      <tr
                        key={postId}
                        style={{
                          borderBottom: '1px solid #1a1a1a',
                          transition: 'background-color 0.1s ease'
                        }}
                        onMouseEnter={tableRowHover}
                        onMouseLeave={tableRowLeave}
                      >
                        {/* Preview */}
                        <td style={tableCellStyle}>
                          {thumbUrl ? (
                            <div style={{
                              width: '50px',
                              height: '50px',
                              overflow: 'hidden',
                              border: '1px solid #333',
                              backgroundColor: '#000',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <img
                                src={thumbUrl}
                                alt={post.title || ''}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  display: 'block'
                                }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                          ) : (
                            <div style={{
                              width: '50px',
                              height: '50px',
                              border: '1px solid #222',
                              backgroundColor: '#0c0c0c',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#333'
                            }}>
                              <Image size={18} />
                            </div>
                          )}
                        </td>

                        {/* Title */}
                        <td style={{ ...tableCellStyle, color: '#fff', fontWeight: 600, maxWidth: '250px' }}>
                          <span style={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {post.title || 'Sem titulo'}
                          </span>
                        </td>

                        {/* Type */}
                        <td style={tableCellStyle}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.15rem 0.5rem',
                            border: '1px solid #333',
                            backgroundColor: '#0c0c0c',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: '#a78bfa'
                          }}>
                            {mediaType === 'video' ? <Film size={11} /> : <Image size={11} />}
                            {mediaType}
                          </span>
                        </td>

                        {/* Views */}
                        <td style={tableCellStyle}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#888' }}>
                            <Eye size={13} />
                            {post.views ?? 0}
                          </span>
                        </td>

                        {/* Likes */}
                        <td style={tableCellStyle}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#888' }}>
                            <Heart size={13} />
                            {post.likes ?? (post.likedBy ? post.likedBy.length : 0)}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={tableCellStyle}>
                          <StatusBadge banned={post.banned} />
                        </td>

                        {/* Actions */}
                        <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                          {post.banned ? (
                            <button
                              onClick={() => onUnbanPost && onUnbanPost(postId)}
                              style={{
                                background: '#001a0a',
                                border: '1px solid #00ff66',
                                color: '#00ff66',
                                fontFamily: FONT,
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                padding: '0 0.75rem',
                                height: '30px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                textTransform: 'uppercase',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#00ff66';
                                e.currentTarget.style.color = '#000';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#001a0a';
                                e.currentTarget.style.color = '#00ff66';
                              }}
                            >
                              <CheckCircle size={12} />
                              UNBAN
                            </button>
                          ) : (
                            <button
                              onClick={() => setBanTarget(post)}
                              style={{
                                background: '#1a0505',
                                border: '1px solid #ff0055',
                                color: '#ff0055',
                                fontFamily: FONT,
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                padding: '0 0.75rem',
                                height: '30px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                textTransform: 'uppercase',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#ff0055';
                                e.currentTarget.style.color = '#000';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#1a0505';
                                e.currentTarget.style.color = '#ff0055';
                              }}
                            >
                              <Ban size={12} />
                              BAN
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== TAB: USUARIOS ===== */}
        {activeTab === 'usuarios' && (
          <div>
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem',
              color: '#888'
            }}>
              <Users size={16} color="#a78bfa" />
              <span>TOTAL DE USUARIOS REGISTRADOS:</span>
              <span style={{ color: '#a78bfa', fontWeight: 800 }}>{users.length}</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>USUARIO</th>
                    <th style={tableHeaderStyle}>ROLE</th>
                    <th style={tableHeaderStyle}>DATA DE CRIACAO</th>
                    {currentUser?.role === 'dev' && (
                      <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>ACOES</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={currentUser?.role === 'dev' ? 4 : 3} style={{
                        ...tableCellStyle,
                        textAlign: 'center',
                        padding: '3rem 1rem',
                        color: '#555'
                      }}>
                        Nenhum usuario encontrado.
                      </td>
                    </tr>
                  )}
                  {users.map((user) => {
                    const userId = user.id || user._id;
                    const isDropdownOpen = roleDropdownOpen === userId;
                    return (
                      <tr
                        key={userId}
                        style={{
                          borderBottom: '1px solid #1a1a1a',
                          transition: 'background-color 0.1s ease'
                        }}
                        onMouseEnter={tableRowHover}
                        onMouseLeave={tableRowLeave}
                      >
                        <td style={{ ...tableCellStyle, color: '#fff', fontWeight: 700 }}>
                          @{user.username}
                        </td>
                        <td style={tableCellStyle}>
                          <RoleBadge role={user.role} />
                        </td>
                        <td style={{ ...tableCellStyle, color: '#666' }}>
                          {formatDate(user.createdAt || user.created_at)}
                        </td>
                        {currentUser?.role === 'dev' && (
                          <td style={{ ...tableCellStyle, textAlign: 'center', position: 'relative' }}>
                            {userId !== currentUser.id && userId !== currentUser._id ? (
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <button
                                  onClick={() => setRoleDropdownOpen(isDropdownOpen ? null : userId)}
                                  style={{
                                    background: '#0c0c0c',
                                    border: '1px solid #333',
                                    color: '#a78bfa',
                                    fontFamily: FONT,
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    padding: '0 0.75rem',
                                    height: '30px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    textTransform: 'uppercase',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#a78bfa';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#333';
                                  }}
                                >
                                  ALTERAR ROLE
                                  <ChevronDown size={12} style={{
                                    transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                                    transition: 'transform 0.15s ease'
                                  }} />
                                </button>

                                {isDropdownOpen && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '4px',
                                    backgroundColor: '#0c0c0c',
                                    border: '1px solid #a78bfa',
                                    boxShadow: '6px 6px 0px rgba(167, 139, 250, 0.2)',
                                    zIndex: 60,
                                    minWidth: '140px'
                                  }}>
                                    {['user', 'admin', 'dev'].filter(r => r !== user.role).map((role) => (
                                      <button
                                        key={role}
                                        onClick={() => handleRoleChange(userId, role)}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.5rem',
                                          width: '100%',
                                          padding: '0.6rem 1rem',
                                          backgroundColor: 'transparent',
                                          border: 'none',
                                          borderBottom: '1px solid #1a1a1a',
                                          color: ROLE_COLORS[role],
                                          fontFamily: FONT,
                                          fontSize: '0.75rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          textTransform: 'uppercase',
                                          textAlign: 'left',
                                          transition: 'background-color 0.1s ease'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#151515'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                      >
                                        <span style={{
                                          width: '8px',
                                          height: '8px',
                                          backgroundColor: ROLE_COLORS[role],
                                          display: 'inline-block',
                                          flexShrink: 0
                                        }} />
                                        {ROLE_LABELS[role]}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#333', fontSize: '0.7rem' }}>--</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== TAB: LOG DE AUDITORIA ===== */}
        {activeTab === 'auditoria' && (
          <div>
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem',
              color: '#888'
            }}>
              <Clock size={16} color="#a78bfa" />
              <span>HISTORICO DE ACOES ADMINISTRATIVAS</span>
              <span style={{
                marginLeft: 'auto',
                color: '#555',
                fontSize: '0.72rem'
              }}>
                {auditLog.length} {auditLog.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            <div style={{
              maxHeight: '600px',
              overflowY: 'auto'
            }}>
              {auditLog.length === 0 && (
                <div style={{
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  color: '#555',
                  fontFamily: FONT,
                  fontSize: '0.85rem'
                }}>
                  Nenhum registro de auditoria encontrado.
                </div>
              )}
              {auditLog.map((entry, idx) => {
                const actionColors = {
                  BAN: '#ff0055',
                  UNBAN: '#00ff66',
                  ROLE_CHANGE: '#a78bfa',
                  DELETE: '#ff0055',
                  CREATE: '#00ff66'
                };
                const actionType = (entry.action || entry.type || 'ACAO').toUpperCase();
                const actionColor = actionColors[actionType] || '#888';

                return (
                  <div
                    key={entry.id || entry._id || idx}
                    style={{
                      padding: '0.85rem 1.5rem',
                      borderBottom: '1px solid #1a1a1a',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#111'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {/* Timestamp */}
                    <div style={{
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: '#555',
                      fontSize: '0.72rem',
                      minWidth: '160px',
                      paddingTop: '0.1rem'
                    }}>
                      <Clock size={12} />
                      {formatTimestamp(entry.timestamp || entry.createdAt || entry.date)}
                    </div>

                    {/* Action badge */}
                    <span style={{
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.15rem 0.55rem',
                      border: `1px solid ${actionColor}`,
                      backgroundColor: `${actionColor}18`,
                      color: actionColor,
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      minWidth: '80px',
                      justifyContent: 'center'
                    }}>
                      {actionType}
                    </span>

                    {/* Details */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ fontSize: '0.8rem', color: '#ccc' }}>
                        <span style={{ color: '#a78bfa', fontWeight: 700 }}>
                          @{entry.performedBy || entry.admin || entry.user || 'sistema'}
                        </span>
                        {(entry.target || entry.targetName || entry.postTitle || entry.targetUser) && (
                          <>
                            <span style={{ color: '#555', margin: '0 0.4rem' }}>&rarr;</span>
                            <span style={{ color: '#fff', fontWeight: 600 }}>
                              {entry.target || entry.targetName || entry.postTitle || entry.targetUser}
                            </span>
                          </>
                        )}
                      </div>
                      {(entry.reason || entry.details) && (
                        <div style={{
                          fontSize: '0.72rem',
                          color: '#666',
                          fontStyle: 'normal'
                        }}>
                          Motivo: {entry.reason || entry.details}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Ban Modal */}
      {banTarget && (
        <BanModal
          post={banTarget}
          onConfirm={handleBanConfirm}
          onCancel={() => setBanTarget(null)}
        />
      )}
    </div>
  );
}
