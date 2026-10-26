import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie } from 'lucide-react';

export default function CookieConsent() {
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setAccepted(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '24px',
      right: '24px',
      maxWidth: '480px',
      margin: '0 auto',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(6, 182, 212, 0.3)',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
      zIndex: 150,
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Cookie size={20} color="#06b6d4" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
          Cookie & Security Privacy Notice
        </div>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.4' }}>
          We use strictly essential cookies and biometric session tokens to secure practitioner and screening data.
        </div>
      </div>
      <button
        onClick={handleAccept}
        className="btn-primary"
        style={{ padding: '8px 16px', fontSize: '0.8rem', flexShrink: 0 }}
      >
        Accept
      </button>
    </div>
  );
}
