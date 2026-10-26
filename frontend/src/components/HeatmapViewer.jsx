import React, { useState } from 'react';
import { Eye, Layers, AlertCircle, RefreshCw, Box, Sliders } from 'lucide-react';

export default function HeatmapViewer({ heatmapBase64, isAtRiskPreset, onTogglePreset, loading }) {
  const [opacity, setOpacity] = useState(0.7);
  const [slice, setSlice] = useState(16);
  const [tilt, setTilt] = useState({ rx: 12, ry: -15 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width - 0.5) * 30; // -15 to +15 deg
    const py = (0.5 - y / rect.height) * 30;
    setTilt({ rx: py, ry: px });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rx: 12, ry: -15 });
  };

  return (
    <div className="glass-panel" style={{ padding: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Box size={18} color="#06b6d4" />
            3D Volumetric MRI Saliency Map
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Occlusion Grad-CAM heatmap with 3D depth layer parallax
          </p>
        </div>

        {onTogglePreset && (
          <button
            onClick={onTogglePreset}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
          >
            <RefreshCw size={13} />
            Preset: {isAtRiskPreset ? 'At-Risk Ventricles' : 'Healthy MRI'}
          </button>
        )}
      </div>

      {/* 3D Volumetric Card Frame */}
      <div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          perspective: '1000px',
          width: '100%',
          maxWidth: '320px',
          height: '320px',
          margin: '0 auto',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '18px',
            background: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #030712 100%)',
            border: '2px solid rgba(6, 182, 212, 0.3)',
            boxShadow: isHovered
              ? '0 20px 40px rgba(6, 182, 212, 0.35), inset 0 0 20px rgba(6, 182, 212, 0.2)'
              : '0 10px 30px rgba(0, 0, 0, 0.6)',
            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease',
            transformStyle: 'preserve-3d',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Holographic Scanlines */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(rgba(6, 182, 212, 0.05) 50%, rgba(0, 0, 0, 0.25) 50%)',
              backgroundSize: '100% 4px',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />

          {loading ? (
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', zIndex: 4 }}>
              <RefreshCw size={24} className="pulse-glow" style={{ marginBottom: '8px', color: '#06b6d4' }} />
              <div>Generating 3D Volume Slices...</div>
            </div>
          ) : heatmapBase64 ? (
            <>
              {/* Stacked Ghost Layer 1 (Depth background) */}
              <img
                src={`data:image/png;base64,${heatmapBase64}`}
                alt="MRI Depth Layer"
                style={{
                  position: 'absolute',
                  width: '90%',
                  height: '90%',
                  objectFit: 'contain',
                  opacity: opacity * 0.3,
                  transform: 'translateZ(-20px) scale(0.95)',
                  filter: 'blur(2px)',
                }}
              />

              {/* Main Saliency Layer */}
              <img
                src={`data:image/png;base64,${heatmapBase64}`}
                alt="MRI Occlusion Heatmap"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: opacity,
                  transform: 'translateZ(15px)',
                  transition: 'opacity 0.2s ease',
                  zIndex: 2,
                }}
              />
            </>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                transform: 'translateZ(10px)',
              }}
            >
              <Eye size={40} style={{ marginBottom: '10px', opacity: 0.6, color: '#06b6d4' }} />
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No MRI Scan Loaded</p>
            </div>
          )}

          {/* Sci-Fi HUD Overlay */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(3, 7, 18, 0.85)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.68rem',
              color: '#38bdf8',
              fontFamily: 'monospace',
              zIndex: 5,
            }}
          >
            3D DEPTH: +15mm
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              background: 'rgba(3, 7, 18, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              color: '#f8fafc',
              backdropFilter: 'blur(4px)',
              zIndex: 5,
            }}
          >
            Volumetric Slice #{slice} / 32
          </div>
        </div>
      </div>

      {/* Control Sliders */}
      {heatmapBase64 && (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px' }}>
              <span>Slice Depth Position</span>
              <span style={{ color: '#06b6d4', fontWeight: 600 }}>Slice {slice}</span>
            </div>
            <input
              type="range"
              min="1"
              max="32"
              step="1"
              value={slice}
              onChange={(e) => setSlice(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px' }}>
              <span>Heatmap Layer Opacity</span>
              <span style={{ color: '#6366f1', fontWeight: 600 }}>{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#94a3b8', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px' }}>
            <AlertCircle size={14} color="#f59e0b" />
            <span>High contribution areas (ventricles / hippocampus) highlighted in warm crimson.</span>
          </div>
        </div>
      )}
    </div>
  );
}
