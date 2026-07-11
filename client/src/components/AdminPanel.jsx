import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Users, FileText, ArrowLeft, Ban, CheckCircle, Clock, ChevronDown, Eye, Heart, Image, Film, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const FONT = 'JetBrains Mono, monospace';

const ROLE_COLORS = {
  dev: '#a78bfa',
  admin: '#f59e0b',
  user: '#888888'
};

function RoleBadge({ role }) {
  const { t } = useLanguage();
  const color = ROLE_COLORS[role] || '#888';
  const label = role === 'dev' ? t('admin.roleDev').toUpperCase() : role === 'admin' ? t('admin.roleAdmin').toUpperCase() : role === 'user' ? t('admin.roleUser').toUpperCase() : role?.toUpperCase() || 'N/A';
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
  const { t } = useLanguage();
  const color = banned ? '#ff0055' : '#00ff66';
  const label = banned ? t('admin.filterBanned').toUpperCase() : t('admin.filterActive').toUpperCase();
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
  const { t } = useLanguage();
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
            <span>{t('admin.banConfirmTitle').toUpperCase()}</span>
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
          <span>{t('admin.banTarget', { title: post?.title || 'Sem título' })}</span>
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
              {t('admin.banReasonLabel').toUpperCase()}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin.banReasonPlaceholder')}
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
              {t('common.cancel').toUpperCase()}
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
              {t('admin.banSubmit').toUpperCase()}
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
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('midias');
  const [mediaFilter, setMediaFilter] = useState('todas');
  const [banTarget, setBanTarget] = useState(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(null);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsStatusFilter, setReportsStatusFilter] = useState('pending');

  useEffect(() => {
    if (activeTab === 'denuncias') {
      fetchReports();
    }
  }, [activeTab, reportsStatusFilter]);

  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      const token = localStorage.getItem('prismshare_auth_token');
      const res = await fetch(`/api/admin/reports?status=${reportsStatusFilter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar denúncias:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleResolveReport = async (reportId, action, banReason = '') => {
    try {
      const token = localStorage.getItem('prismshare_auth_token');
      const res = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, banReason })
      });
      if (res.ok) {
        const updated = await res.json();
        if (action === 'ban' && onBanPost && updated && updated.targetId) {
          onBanPost(updated.targetId, banReason || 'Banido por denúncia acatada pela moderação');
        }
        fetchReports();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Erro ao resolver denúncia.');
      }
    } catch (err) {
      alert('Erro ao resolver denúncia.');
    }
  };

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
    { key: 'midias', label: t('admin.tabMedia').toUpperCase(), icon: <Image size={15} /> },
    { key: 'denuncias', label: '🚨 DENÚNCIAS', icon: <AlertTriangle size={15} /> },
    { key: 'usuarios', label: t('admin.tabUsers').toUpperCase(), icon: <Users size={15} /> },
    { key: 'auditoria', label: t('admin.tabAudit').toUpperCase(), icon: <FileText size={15} /> }
  ];

  const filterButtons = [
    { key: 'todas', label: t('admin.filterAll').toUpperCase() },
    { key: 'ativas', label: t('admin.filterActive').toUpperCase() },
    { key: 'banidas', label: t('admin.filterBanned').toUpperCase() }
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
          title={t('common.back')}
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
            {t('admin.title').toUpperCase()}
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
            <span>{t('admin.colUser').toUpperCase()}:</span>
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
                    <th style={tableHeaderStyle}>{t('admin.colThumb').toUpperCase()}</th>
                    <th style={tableHeaderStyle}>{t('admin.colInfo').toUpperCase()}</th>
                    <th style={tableHeaderStyle}>TIPO</th>
                    <th style={tableHeaderStyle}>VIEWS</th>
                    <th style={tableHeaderStyle}>LIKES</th>
                    <th style={tableHeaderStyle}>{t('admin.colStatus').toUpperCase()}</th>
                    <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>{t('admin.colActions').toUpperCase()}</th>
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
                        {t('admin.noMedia')}
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
                              {t('admin.unbanSubmit').toUpperCase()}
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
                              {t('admin.banSubmit').toUpperCase()}
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
              <span>{t('admin.tabUsers').toUpperCase()}:</span>
              <span style={{ color: '#a78bfa', fontWeight: 800 }}>{users.length}</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>{t('admin.colUser').toUpperCase()}</th>
                    <th style={tableHeaderStyle}>{t('admin.colRole').toUpperCase()}</th>
                    <th style={tableHeaderStyle}>{t('admin.colCreated').toUpperCase()}</th>
                    {currentUser?.role === 'dev' && (
                      <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>{t('admin.colActions').toUpperCase()}</th>
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
                        {t('admin.noUsers')}
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
                                        {role === 'dev' ? t('admin.roleDev').toUpperCase() : role === 'admin' ? t('admin.roleAdmin').toUpperCase() : t('admin.roleUser').toUpperCase()}
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

        {/* ===== TAB: DENÚNCIAS ===== */}
        {activeTab === 'denuncias' && (
          <div>
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#ff0055', fontWeight: 800 }}>
                <AlertTriangle size={16} />
                <span>PAINEL DE MODERAÇÃO DE DENÚNCIAS & ANTI-ABUSO</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['pending', 'resolved', 'dismissed'].map(status => (
                  <button
                    key={status}
                    onClick={() => setReportsStatusFilter(status)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      background: reportsStatusFilter === status ? '#ff0055' : '#151515',
                      color: reportsStatusFilter === status ? '#fff' : '#888',
                      border: '1px solid #333',
                      fontFamily: FONT,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    {status === 'pending' ? 'PENDENTES' : status === 'resolved' ? 'ACATADAS/BANIDAS' : 'DESCARTADAS'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ maxHeight: '600px', overflowY: 'auto', padding: '1rem' }}>
              {reportsLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>Carregando denúncias...</div>
              ) : reports.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#666', border: '1px dashed #222' }}>
                  Nenhuma denúncia no status "{reportsStatusFilter.toUpperCase()}".
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {reports.map((r) => (
                    <div
                      key={r.id || r._id}
                      style={{
                        background: '#0d0d0d',
                        border: '1px solid #252525',
                        borderLeft: '4px solid #ff0055',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#888' }}>ALVO (POST ID): </span>
                          <strong style={{ color: '#a78bfa', fontSize: '0.85rem' }}>{r.targetId}</strong>
                          <span style={{ margin: '0 0.8rem', color: '#333' }}>|</span>
                          <span style={{ fontSize: '0.72rem', color: '#888' }}>DENUNCIADO POR: </span>
                          <strong style={{ color: '#00ff66', fontSize: '0.85rem' }}>@{r.reportedBy}</strong>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#666' }}>{formatTimestamp(r.createdAt || new Date())}</span>
                      </div>

                      <div style={{ background: '#141414', padding: '0.85rem', border: '1px solid #222' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ff3366', marginBottom: '0.35rem' }}>
                          MOTIVO: {r.reason?.toUpperCase()}
                        </div>
                        {r.details && (
                          <div style={{ fontSize: '0.85rem', color: '#ccc', lineHeight: 1.4 }}>
                            "{r.details}"
                          </div>
                        )}
                      </div>

                      {reportsStatusFilter === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const banMsg = prompt('Motivo público do banimento para esta mídia:', `Violação de regras: ${r.reason}`);
                              if (banMsg !== null) {
                                handleResolveReport(r.id || r._id, 'ban', banMsg);
                              }
                            }}
                            style={{
                              background: '#ff0055',
                              color: '#fff',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              fontFamily: FONT,
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            <Ban size={14} /> ACATAR & BANIR MÍDIA
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResolveReport(r.id || r._id, 'dismiss')}
                            style={{
                              background: '#1f1f1f',
                              color: '#bbb',
                              border: '1px solid #444',
                              padding: '0.5rem 1rem',
                              fontFamily: FONT,
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            DESCARTAR DENÚNCIA
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Deseja punir @${r.reportedBy} por denúncia falsa ou spam deliberado? Isso adicionará penalidades à conta do usuário.`)) {
                                handleResolveReport(r.id || r._id, 'dismiss_abuse');
                              }
                            }}
                            style={{
                              background: '#24080e',
                              color: '#ff3366',
                              border: '1px solid #ff0055',
                              padding: '0.5rem 1rem',
                              fontFamily: FONT,
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            🚨 PUNIR DENÚNCIA FALSA / ABUSO
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
              <span>{t('admin.tabAudit').toUpperCase()}</span>
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
                  {t('admin.noLogs')}
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
