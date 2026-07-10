import React from 'react';
import {
  Terminal,
  ArrowLeft,
  Image,
  Users,
  Eye,
  Heart,
  MessageSquare,
  AlertTriangle,
  Hash,
  HardDrive,
  Clock,
  Cpu,
  Database,
  BarChart3,
  Trophy,
  Server
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatMB(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatCard({ icon: Icon, value, label, iconColor }) {
  return (
    <div
      style={{
        background: '#0c0c0c',
        border: '1px solid #1f1f1f',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        borderRadius: 0,
      }}
    >
      <Icon size={20} color={iconColor || '#a78bfa'} />
      <span
        style={{
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '2rem',
          fontFamily: 'JetBrains Mono, monospace',
          lineHeight: 1.1,
        }}
      >
        {value != null ? value.toLocaleString('pt-BR') : '—'}
      </span>
      <span
        style={{
          color: '#666666',
          fontSize: '0.7rem',
          fontFamily: 'JetBrains Mono, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textAlign: 'center',
        }}
      >
        {label}
      </span>
    </div>
  );
}

function SectionHeader({ icon: Icon, label }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
      }}
    >
      <Icon size={16} color="#a78bfa" />
      <span
        style={{
          color: '#a78bfa',
          fontWeight: 800,
          fontSize: '0.8rem',
          fontFamily: 'JetBrains Mono, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
    </div>
  );
}

function DistributionBar({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.35rem',
        }}
      >
        <span
          style={{
            color: '#cccccc',
            fontSize: '0.75rem',
            fontFamily: 'JetBrains Mono, monospace',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <span
          style={{
            color: '#666666',
            fontSize: '0.7rem',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {count} ({pct.toFixed(1)}%)
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: '8px',
          background: '#1a1a1a',
          borderRadius: 0,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 0,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function DevPanel({ currentUser, stats, onBack }) {
  const { t } = useLanguage();

  if (!stats) {
    return (
      <div
        style={{
          background: '#070707',
          border: '2px solid #a78bfa',
          padding: '2rem',
          fontFamily: 'JetBrains Mono, monospace',
          color: '#a78bfa',
          textAlign: 'center',
          borderRadius: 0,
        }}
      >
        {t('common.loading').toUpperCase()}
      </div>
    );
  }

  const postsByType = stats.postsByType || { image: 0, video: 0, gif: 0 };
  const totalByType = postsByType.image + postsByType.video + postsByType.gif;
  const topTags = (stats.topTags || []).slice(0, 10);
  const topPosts = (stats.topPosts || []).slice(0, 5);

  return (
    <div
      style={{
        background: '#070707',
        border: '2px solid #a78bfa',
        fontFamily: 'JetBrains Mono, monospace',
        borderRadius: 0,
        overflow: 'hidden',
      }}
    >
      {/* TOP BAR */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.5rem',
          borderBottom: '2px solid #a78bfa',
          background: '#0a0a0a',
        }}
      >
        <button
          onClick={onBack}
          className="btn btn-sm"
          style={{
            background: 'transparent',
            border: '1px solid #a78bfa',
            color: '#a78bfa',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 0.5rem',
            borderRadius: 0,
            fontFamily: 'JetBrains Mono, monospace',
            height: '34px',
            boxSizing: 'border-box',
          }}
          title={t('common.back')}
        >
          <ArrowLeft size={16} />
        </button>
        <Terminal size={20} color="#a78bfa" />
        <span
          style={{
            color: '#a78bfa',
            fontWeight: 800,
            fontSize: '0.9rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {t('dev.title').toUpperCase()}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            color: '#444444',
            fontSize: '0.7rem',
          }}
        >
          {currentUser?.username || '—'}
        </span>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* STAT CARDS GRID */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <StatCard icon={Image} value={stats.totalPosts} label={t('dev.statPosts').toUpperCase()} />
          <StatCard icon={Users} value={stats.totalUsers} label={t('dev.statUsers').toUpperCase()} />
          <StatCard icon={Eye} value={stats.totalViews} label={t('dev.statViews').toUpperCase()} />
          <StatCard icon={Heart} value={stats.totalLikes} label={t('dev.statLikes').toUpperCase()} />
          <StatCard icon={MessageSquare} value={stats.totalComments} label={t('dev.statComments').toUpperCase()} />
          <StatCard
            icon={AlertTriangle}
            value={stats.totalBanned}
            label={t('dev.statBanned').toUpperCase()}
            iconColor="#ff0055"
          />
        </div>

        {/* MIDDLE ROW */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* DISTRIBUTION BY TYPE */}
          <div
            style={{
              background: '#0c0c0c',
              border: '1px solid #1f1f1f',
              padding: '1.25rem',
              borderRadius: 0,
            }}
          >
            <SectionHeader icon={BarChart3} label={t('dev.statsTitle').toUpperCase()} />
            <DistributionBar
              label="Imagem"
              count={postsByType.image}
              total={totalByType}
              color="#a78bfa"
            />
            <DistributionBar
              label="Video"
              count={postsByType.video}
              total={totalByType}
              color="#8b5cf6"
            />
            <DistributionBar
              label="GIF"
              count={postsByType.gif}
              total={totalByType}
              color="#00ff66"
            />
          </div>

          {/* TOP TAGS */}
          <div
            style={{
              background: '#0c0c0c',
              border: '1px solid #1f1f1f',
              padding: '1.25rem',
              borderRadius: 0,
            }}
          >
            <SectionHeader icon={Hash} label={t('dev.tagsTitle').toUpperCase()} />
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              {topTags.map((tag, i) => (
                <span
                  key={i}
                  className="card-tag"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.72rem',
                    borderRadius: 0,
                  }}
                >
                  #{tag.name} ({tag.count})
                </span>
              ))}
              {topTags.length === 0 && (
                <span style={{ color: '#444444', fontSize: '0.75rem' }}>
                  {t('dev.noTags')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
          }}
        >
          {/* TOP POSTS */}
          <div
            style={{
              background: '#0c0c0c',
              border: '1px solid #1f1f1f',
              padding: '1.25rem',
              borderRadius: 0,
            }}
          >
            <SectionHeader icon={Trophy} label={t('dev.topPostsTitle').toUpperCase()} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {topPosts.map((post, i) => (
                <div
                  key={post.id || i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 0.6rem',
                    background: '#111111',
                    border: '1px solid #1a1a1a',
                    borderRadius: 0,
                  }}
                >
                  <span
                    style={{
                      color: '#a78bfa',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      minWidth: '1.2rem',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    style={{
                      color: '#cccccc',
                      fontSize: '0.75rem',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {post.title}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: '#666666',
                        fontSize: '0.7rem',
                      }}
                    >
                      <Eye size={12} />
                      {(post.views || 0).toLocaleString('pt-BR')}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: '#666666',
                        fontSize: '0.7rem',
                      }}
                    >
                      <Heart size={12} />
                      {(post.likes || 0).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
              {topPosts.length === 0 && (
                <span style={{ color: '#444444', fontSize: '0.75rem' }}>
                  {t('dev.noPosts')}
                </span>
              )}
            </div>
          </div>

          {/* SYSTEM INFO */}
          <div
            style={{
              background: '#0c0c0c',
              border: '1px solid #1f1f1f',
              padding: '1.25rem',
              borderRadius: 0,
            }}
          >
            <SectionHeader icon={Server} label={t('dev.systemStatus').toUpperCase()} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <InfoRow
                icon={Cpu}
                label="Node.js"
                value={stats.nodeVersion || '—'}
              />
              <InfoRow
                icon={Clock}
                label="Uptime"
                value={stats.uptime != null ? formatUptime(stats.uptime) : '—'}
              />
              <InfoRow
                icon={Database}
                label="RAM / Memória"
                value={
                  stats.memoryUsage != null ? formatMB(stats.memoryUsage) : '—'
                }
              />
              <InfoRow
                icon={HardDrive}
                label="Armazenamento"
                value={
                  stats.storageUsed != null ? formatMB(stats.storageUsed) : '—'
                }
              />
              <InfoRow
                icon={AlertTriangle}
                label={t('dev.statBanned')}
                value={
                  stats.totalBanned != null
                    ? stats.totalBanned.toLocaleString('pt-BR')
                    : '—'
                }
                valueColor="#ff0055"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, valueColor }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.45rem 0.6rem',
        background: '#111111',
        border: '1px solid #1a1a1a',
        borderRadius: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Icon size={14} color="#a78bfa" />
        <span
          style={{
            color: '#888888',
            fontSize: '0.75rem',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          color: valueColor || '#ffffff',
          fontSize: '0.8rem',
          fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        {value}
      </span>
    </div>
  );
}
