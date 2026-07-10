import React from 'react';
import { Hash, Filter, RotateCcw } from 'lucide-react';

export default function TagSidebar({ tags = [], selectedTags = [], onToggleTag, onClearTags }) {
  return (
    <aside className="tag-sidebar">
      <div className="sidebar-title">
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Filter size={14} color="#a78bfa" />
          <span>TAGS EM ALTA</span>
        </span>
        {selectedTags.length > 0 && (
          <button
            onClick={onClearTags}
            style={{
              background: 'none',
              border: '1px solid #ff0055',
              color: '#ff0055',
              padding: '0.2rem 0.5rem',
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.65rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#ff0055'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#ff0055'; }}
          >
            <RotateCcw size={10} /> LIMPAR
          </button>
        )}
      </div>

      <div className="tag-list">
        {tags.length === 0 ? (
          <div style={{ color: '#555', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', padding: '1rem 0' }}>
            [ Nenhuma tag encontrada ]
          </div>
        ) : (
          tags.map((t) => {
            const isSelected = selectedTags.includes(t.name);
            return (
              <button
                key={t.name}
                className={`tag-chip ${isSelected ? 'active' : ''}`}
                onClick={() => onToggleTag(t.name)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Hash size={13} />
                  <span>{t.name}</span>
                </span>
                <span
                  style={{
                    backgroundColor: isSelected ? '#000' : '#1e1e1e',
                    color: isSelected ? '#a78bfa' : '#888',
                    padding: '0.1rem 0.4rem',
                    fontSize: '0.7rem'
                  }}
                >
                  {t.count}
                </span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
