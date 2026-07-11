import React, { useState, useRef } from 'react';
import { X, Upload, Film, Image as ImageIcon, Zap, Hash, Plus, Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { getAuthToken } from '../utils/auth';

export default function UploadModal({ isOpen, onClose, onSuccess, currentUser }) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['geral', 'art']);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [useUrlMode, setUseUrlMode] = useState(false);
  const [nsfw, setNsfw] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setError('');
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    if (!title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleTagAdd = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/^#/, '');
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !externalUrl.trim()) {
      setError(t('upload.errorNoFile'));
      return;
    }
    if (!title.trim()) {
      setError(t('upload.errorTitleRequired'));
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('tags', JSON.stringify(tags));
      formData.append('nsfw', nsfw);

      if (file && !useUrlMode) {
        formData.append('file', file);
      } else {
        formData.append('url', externalUrl.trim());
      }
      if (currentUser && currentUser.username) {
        formData.append('uploader', currentUser.username);
        formData.append('author', currentUser.username);
      }

      const token = getAuthToken(currentUser);
      const response = await fetch('/api/media', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('upload.errorGeneric'));
      }

      const newPost = await response.json();
      setUploading(false);
      onSuccess(newPost);
    } catch (err) {
      console.error('Erro no upload:', err);
      setError(err.message || t('upload.errorGeneric'));
      setUploading(false);
    }
  };

  const isVideo = file && file.type.includes('video/');
  const isGif = file && (file.type.includes('gif') || file.name.toLowerCase().endsWith('.gif'));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Upload size={18} color="#a78bfa" />
            <span>{t('upload.modalTitle').toUpperCase()}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="upload-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ backgroundColor: '#1a0000', border: '1px solid #ff0055', color: '#ff0055', padding: '0.75rem 1rem', fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace' }}>
              <strong>{t('common.error').toUpperCase()}:</strong> {error}
            </div>
          )}

          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #222', paddingBottom: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setUseUrlMode(false)}
              style={{
                background: !useUrlMode ? '#fff' : 'transparent',
                color: !useUrlMode ? '#000' : '#888',
                border: '1px solid #333',
                padding: '0 0.85rem',
                height: '34px',
                boxSizing: 'border-box',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {t('upload.fileMode').toUpperCase()}
            </button>
            <button
              type="button"
              onClick={() => setUseUrlMode(true)}
              style={{
                background: useUrlMode ? '#fff' : 'transparent',
                color: useUrlMode ? '#000' : '#888',
                border: '1px solid #333',
                padding: '0 0.85rem',
                height: '34px',
                boxSizing: 'border-box',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {t('upload.urlMode').toUpperCase()}
            </button>
          </div>

          {!useUrlMode ? (
            <div 
              className={`dropzone ${previewUrl ? 'active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*,video/mp4,video/webm,.gif"
                onChange={(e) => handleFileChange(e.target.files[0])}
              />
              {previewUrl ? (
                <div style={{ position: 'relative', width: '100%', maxHeight: '240px', overflow: 'hidden' }}>
                  {isVideo ? (
                    <video src={previewUrl} controls style={{ width: '100%', maxHeight: '240px', objectFit: 'contain' }} />
                  ) : (
                    <img src={previewUrl} alt="Preview" style={{ width: '100%', maxHeight: '240px', objectFit: 'contain' }} />
                  )}
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace' }}>
                    {t('upload.fileSelected', { name: file.name, size: (file.size / (1024 * 1024)).toFixed(2) })}
                  </div>
                </div>
              ) : (
                <>
                  <Upload size={36} color="#a78bfa" style={{ margin: '0 auto 0.75rem' }} />
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                    {t('upload.dropText').toUpperCase()}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.8rem' }}>
                    {t('upload.dropHint')}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">{t('upload.mediaUrlLabel').toUpperCase()}</label>
              <input
                type="url"
                className="form-input"
                placeholder={t('upload.urlPlaceholder')}
                value={externalUrl}
                onChange={(e) => {
                  setExternalUrl(e.target.value);
                  setPreviewUrl(e.target.value);
                }}
              />
              {externalUrl && (
                <div style={{ marginTop: '0.5rem', maxHeight: '180px', overflow: 'hidden', border: '1px solid #333' }}>
                  <img src={externalUrl} alt="Url Preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
                </div>
              )}
            </div>
          )}

          {/* Title & Description */}
          <div className="form-group">
            <label className="form-label">{t('upload.titleLabel').toUpperCase()} *</label>
            <input
              type="text"
              className="form-input"
              placeholder={t('upload.titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('upload.descriptionLabel').toUpperCase()}</label>
            <textarea
              className="form-textarea"
              rows="2"
              placeholder={t('upload.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Interactive Tag Input */}
          <div className="form-group">
            <label className="form-label">{t('upload.tagsLabel').toUpperCase()}</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1 }}
                placeholder={t('upload.tagsPlaceholder')}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagAdd}
              />
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const newTag = tagInput.trim().toLowerCase().replace(/^#/, '');
                  if (newTag && !tags.includes(newTag)) {
                    setTags([...tags, newTag]);
                  }
                  setTagInput('');
                }}
              >
                <Plus size={16} /> {t('upload.addTag').toUpperCase()}
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
              {tags.map((tagName) => (
                <span
                  key={tagName}
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #a78bfa',
                    color: '#a78bfa',
                    padding: '0.3rem 0.6rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Hash size={12} /> {tagName}
                  <button
                    type="button"
                    onClick={() => removeTag(tagName)}
                    style={{ background: 'none', border: 'none', color: '#ff0055', cursor: 'pointer', display: 'flex' }}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div style={{ margin: '1rem 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', color: '#ff3366', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', fontWeight: 'bold' }}>
              <input 
                type="checkbox" 
                checked={nsfw} 
                onChange={(e) => setNsfw(e.target.checked)}
                style={{ accentColor: '#ff0055', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>⚠️ MARCAR COMO CONTEÚDO SENSÍVEL / NSFW (+18)</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn" onClick={onClose} disabled={uploading}>
              {t('upload.cancel').toUpperCase()}
            </button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? t('upload.submitting').toUpperCase() : t('upload.submit').toUpperCase()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
