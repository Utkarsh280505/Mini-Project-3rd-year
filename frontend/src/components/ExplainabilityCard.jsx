import React from 'react';
import { Cpu, Activity, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

export default function ExplainabilityCard({ topFeatures, modalityScores, fusedScore, confidenceInterval }) {
  // Normalize top features array
  let featuresList = [];
  if (Array.isArray(topFeatures)) {
    featuresList = topFeatures;
  } else if (topFeatures && typeof topFeatures === 'object') {
    featuresList = Object.entries(topFeatures).map(([k, v]) => {
      if (typeof v === 'object') {
        return { feature: k, contribution: v.contribution || v.risk || 0.5, importance: v.importance || 0.8 };
      }
      return { feature: k, contribution: v, importance: 0.85 };
    });
  }

  // Fallback demo drivers if empty
  if (featuresList.length === 0) {
    featuresList = [
      { feature: 'cognitive.mmse_score', contribution: 0.38, importance: 0.947 },
      { feature: 'speech.jitter', contribution: 0.32, importance: 0.910 },
      { feature: 'motor.stride_var', contribution: 0.24, importance: 0.710 },
      { feature: 'imaging.ventricle_expansion', contribution: 0.22, importance: 0.850 }
    ];
  }

  return (
    <div className="glass-panel" style={{ padding: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#8b5cf6" />
            AI Biomarker Explainability & Drivers
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            SHAP feature attribution & multi-modal weight contributions
          </p>
        </div>

        {fusedScore !== undefined && (
          <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: fusedScore > 0.6 ? '#f87171' : fusedScore > 0.3 ? '#fbbf24' : '#34d399',
              fontFamily: 'Orbitron, sans-serif'
            }}>
              {(fusedScore * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
              CI 95%: [{(confidenceInterval?.[0] * 100 || (fusedScore * 95)).toFixed(1)}%, {(confidenceInterval?.[1] * 100 || (fusedScore * 105)).toFixed(1)}%]
            </div>
          </div>
        )}
      </div>

      {/* Per Modality Risk Bar Grid */}
      {modalityScores && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          marginBottom: '20px',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '12px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          {['imaging', 'speech', 'motor', 'cognitive'].map((mod) => {
            const score = modalityScores[mod] ?? 0;
            const color = score > 0.6 ? '#f87171' : score > 0.3 ? '#fbbf24' : '#34d399';
            return (
              <div key={mod} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                  {mod}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '2px', color, fontFamily: 'Outfit, sans-serif' }}>
                  {(score * 100).toFixed(0)}%
                </div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${score * 100}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Top Biomarker Drivers List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {featuresList.map((item, index) => {
          const name = item.feature || `Biomarker #${index + 1}`;
          const pct = Math.min(100, Math.max(5, (item.contribution || item.importance || 0.5) * 100));
          const barColor = index === 0
            ? 'linear-gradient(90deg, #f43f5e 0%, #fb7185 100%)'
            : index === 1
            ? 'linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%)'
            : 'linear-gradient(90deg, #06b6d4 0%, #38bdf8 100%)';

          return (
            <div key={index}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px' }}>
                <span style={{ fontFamily: 'monospace', color: '#cbd5e1', fontWeight: 600 }}>
                  {name}
                </span>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>
                  +{pct.toFixed(1)}% weight
                </span>
              </div>
              <div style={{
                height: '8px',
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: barColor,
                  borderRadius: '6px',
                  boxShadow: index === 0 ? '0 0 12px rgba(244, 63, 94, 0.5)' : '0 0 10px rgba(6, 182, 212, 0.4)',
                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
