import React from 'react';
import { Brain, Home, AlertCircle } from 'lucide-react';

export default function NotFound({ onGoHome }) {
  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      zIndex: 1
    }}>
      <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '40px', textAlign: 'center', borderRadius: '24px' }}>
        <div style={{
          width: '70px',
          height: '70px',
          borderRadius: '20px',
          background: 'rgba(6, 182, 212, 0.15)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          border: '1px solid rgba(6, 182, 212, 0.3)'
        }}>
          <AlertCircle color="#06b6d4" size={36} />
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#06b6d4', fontFamily: 'Orbitron, sans-serif', marginBottom: '8px' }}>
          404
        </h1>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
          Neural Route Not Found
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '28px', lineHeight: '1.6' }}>
          The requested page or clinical endpoint does not exist or has moved within the platform vault.
        </p>
        <button onClick={onGoHome} className="btn-primary" style={{ margin: '0 auto', gap: '8px' }}>
          <Home size={18} /> Return to Platform Home
        </button>
      </div>
    </div>
  );
}
