import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Check, Move, RotateCcw } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function PhotoCropperModal({ isOpen, imageUrl, type = 'avatar', onClose, onConfirm, uploading = false }) {
  const { t } = useLanguage();
  if (!isOpen || !imageUrl) return null;

  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Aspect ratio and canvas dimensions
  const viewportWidth = type === 'avatar' ? 280 : 480;
  const viewportHeight = type === 'avatar' ? 280 : 160;

  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      resetPosition(img);
    };
  }, [imageUrl, type]);

  const resetPosition = (img = imageRef.current) => {
    if (!img) return;
    // Calculate initial fit zoom so image covers the viewport completely
    const scaleX = viewportWidth / img.width;
    const scaleY = viewportHeight / img.height;
    const initialZoom = Math.max(scaleX, scaleY);
    setZoom(initialZoom);
    
    // Center the image precisely
    const startX = (viewportWidth - img.width * initialZoom) / 2;
    const startY = (viewportHeight - img.height * initialZoom) / 2;
    setOffset({ x: startX, y: startY });
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomChange = (newZoom) => {
    if (!imageRef.current) return;
    // Keep center of viewport aligned while zooming
    const oldZoom = zoom;
    const ratio = newZoom / oldZoom;
    
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    
    const newX = centerX - (centerX - offset.x) * ratio;
    const newY = centerY - (centerY - offset.y) * ratio;
    
    setZoom(newZoom);
    setOffset({ x: newX, y: newY });
  };

  const handleConfirmCrop = () => {
    if (!imageRef.current || !canvasRef.current) return;
    
    // Output resolution (high definition crystal clear)
    const outWidth = type === 'avatar' ? 600 : 2400;
    const outHeight = type === 'avatar' ? 600 : 800;

    const canvas = canvasRef.current;
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Scale from preview viewport to final canvas output
    const scaleFactorX = outWidth / viewportWidth;
    const scaleFactorY = outHeight / viewportHeight;

    ctx.clearRect(0, 0, outWidth, outHeight);
    ctx.drawImage(
      imageRef.current,
      offset.x * scaleFactorX,
      offset.y * scaleFactorY,
      imageRef.current.width * zoom * scaleFactorX,
      imageRef.current.height * zoom * scaleFactorY
    );

    canvas.toBlob((blob) => {
      if (blob) {
        onConfirm(blob);
      }
    }, 'image/webp', 0.98);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1rem',
      animation: 'fadeIn 0.15s ease-out'
    }}>
      <div style={{
        backgroundColor: '#0c0c0c',
        border: '1px solid #333',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 0 40px rgba(167, 139, 250, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Top Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #1f1f1f',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#121212'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Move size={18} color="#a78bfa" />
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>
              {type === 'avatar' ? t('cropper.titleAvatar').toUpperCase() : t('cropper.titleBanner').toUpperCase()}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.2rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Cropper Viewport Area */}
        <div style={{
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#070707',
          position: 'relative',
          userSelect: 'none'
        }}>
          <div style={{ color: '#888', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {t('cropper.hint')}
          </div>

          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              width: `${viewportWidth}px`,
              height: `${viewportHeight}px`,
              borderRadius: type === 'avatar' ? '50%' : '8px',
              border: '2px dashed #a78bfa',
              boxShadow: '0 0 25px rgba(167, 139, 250, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : 'grab',
              backgroundColor: '#111'
            }}
          >
            {!imageLoaded && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                {t('cropper.loading')}
              </div>
            )}
            {imageRef.current && (
              <img
                src={imageUrl}
                alt="Crop preview"
                draggable={false}
                style={{
                  position: 'absolute',
                  left: `${offset.x}px`,
                  top: `${offset.y}px`,
                  width: `${imageRef.current.width * zoom}px`,
                  height: `${imageRef.current.height * zoom}px`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  pointerEvents: 'none'
                }}
              />
            )}
          </div>

          {/* Hidden Canvas for final export */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Zoom & Reset Controls */}
          <div style={{ width: '100%', maxWidth: `${viewportWidth}px`, marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => handleZoomChange(Math.max(0.1, zoom - 0.1))}
              style={{ background: '#181818', border: '1px solid #333', color: '#fff', padding: '0.45rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title={t('cropper.zoomOut')}
            >
              <ZoomOut size={16} />
            </button>

            <input
              type="range"
              min="0.1"
              max="3"
              step="0.02"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: '#a78bfa', cursor: 'pointer' }}
            />

            <button
              type="button"
              onClick={() => handleZoomChange(zoom + 0.1)}
              style={{ background: '#181818', border: '1px solid #333', color: '#fff', padding: '0.45rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title={t('cropper.zoomIn')}
            >
              <ZoomIn size={16} />
            </button>

            <button
              type="button"
              onClick={() => resetPosition()}
              style={{ background: '#181818', border: '1px solid #333', color: '#a78bfa', padding: '0.45rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              title={t('cropper.reset')}
            >
              <RotateCcw size={14} /> {t('cropper.reset').toUpperCase()}
            </button>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: '#121212',
          borderTop: '1px solid #1f1f1f',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem'
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            style={{
              background: 'transparent',
              border: '1px solid #444',
              color: '#bbb',
              padding: '0.7rem 1.4rem',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: uploading ? 'not-allowed' : 'pointer',
              borderRadius: '4px'
            }}
          >
            {t('cropper.cancel').toUpperCase()}
          </button>

          <button
            type="button"
            onClick={handleConfirmCrop}
            disabled={uploading}
            style={{
              background: '#00ff66',
              border: 'none',
              color: '#000',
              padding: '0.7rem 1.8rem',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.85rem',
              fontWeight: 900,
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 0 15px rgba(0, 255, 102, 0.35)',
              borderRadius: '4px'
            }}
          >
            {uploading ? (
              <>{t('cropper.uploading').toUpperCase()}</>
            ) : (
              <><Check size={18} /> {t('cropper.apply').toUpperCase()}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
