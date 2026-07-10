import React, { useState, useRef } from 'react';
import { X, Upload, Film, Image as ImageIcon, Zap, Hash, Plus, Check } from 'lucide-react';

export default function UploadModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['geral', 'art']);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [useUrlMode, setUseUrlMode] = useState(false);
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
      setError('Por favor, selecione um arquivo para upload ou forneça uma URL.');
      return;
    }
    if (!title.trim()) {
      setError('O título é obrigatório.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('tags', JSON.stringify(tags));

      if (file && !useUrlMode) {
        formData.append('file', file);
      } else {
        formData.append('url', externalUrl.trim());
      }

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro no envio do arquivo');
      }

      const newPost = await response.json();
      setUploading(false);
      onSuccess(newPost);
    } catch (err) {
      console.error('Erro no upload:', err);
      setError(err.message || 'Falha ao enviar arquivo para o servidor.');
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
            <span>ENVIAR NOVA MÍDIA PARA O FEED</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="upload-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ backgroundColor: '#1a0000', border: '1px solid #ff0055', color: '#ff0055', padding: '0.75rem 1rem', fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace' }}>
              <strong>[ERRO]:</strong> {error}
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
              [ UPLOAD DE ARQUIVO (LOCAL) ]
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
              [ URL EXTERNA ]
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
                    [ OK ] ARQUIVO SELECIONADO: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </div>
                </div>
              ) : (
                <>
                  <Upload size={36} color="#a78bfa" style={{ margin: '0 auto 0.75rem' }} />
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>
                    ARRASTE E SOLTE SEU ARQUIVO AQUI
                  </div>
                  <div style={{ color: '#888', fontSize: '0.8rem' }}>
                    Ou clique para navegar pelo computador. Suporta Vídeos (.mp4, .webm), Imagens (.jpg, .png, .webp) e GIFs (.gif). Máximo: 100MB.
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">URL DA MÍDIA (VÍDEO, IMAGEM OU GIF)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://exemplo.com/media.png ou .mp4"
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
            <label className="form-label">TÍTULO DA PUBLICACÃO *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Noite de Chuva Neon em Cyber City"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">DESCRIÇÃO (OPCIONAL)</label>
            <textarea
              className="form-textarea"
              rows="2"
              placeholder="Descreva sobre a criação, câmera, software usado ou contexto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Interactive Tag Input */}
          <div className="form-group">
            <label className="form-label">ADICIONAR TAGS (DIGITE E PRESSIONE ENTER OU VÍRGULA)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Ex: cyberpunk, 4k, blender, memes..."
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
                <Plus size={16} /> ADD
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
              {tags.map((t) => (
                <span
                  key={t}
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
                  <Hash size={12} /> {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    style={{ background: 'none', border: 'none', color: '#ff0055', cursor: 'pointer', display: 'flex' }}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn" onClick={onClose} disabled={uploading}>
              CANCELAR
            </button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? 'ENVIANDO PARA SERVIDOR...' : 'PUBLICAR NA FRONT PAGE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
