import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Brain, Lock, Mail, User, Stethoscope, ArrowRight } from 'lucide-react';

export default function AuthPage({ defaultRole = 'CLINICIAN' }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: defaultRole,
    age: '45',
    gender: 'MALE',
    medicalHistory: 'Baseline assessment'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          ...(formData.role === 'PATIENT' ? {
            age: parseInt(formData.age),
            gender: formData.gender,
            medicalHistory: formData.medicalHistory
          } : {})
        });
      } else {
        await login(formData.email, formData.password);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const setQuickDemo = (email, role) => {
    setFormData((prev) => ({
      ...prev,
      email,
      password: 'password123',
      role
    }));
    setIsRegister(false);
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      zIndex: 1
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '36px',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.15)'
      }}>
        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.45)',
            marginBottom: '14px'
          }}>
            <Brain color="#ffffff" size={32} className="pulse-glow" />
          </div>
          <h2 className="font-brand" style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.02em', color: '#ffffff' }}>
            {isRegister ? 'CREATE NEURAL ACCOUNT' : 'SYSTEM BIOMETRIC LOGIN'}
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
            {isRegister ? 'Create a patient account. Clinician and staff accounts require authorized provisioning.' : 'Enter credentials to access your authorized workspace'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f87171',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '0.82rem',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegister && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>FULL NAME</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="text"
                    required
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(3, 7, 18, 0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '10px 12px 10px 40px',
                      borderRadius: '10px',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <p role="note" style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                  Patient registration only. Staff access is provisioned separately and requires an active organization assignment.
                </p>
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>EMAIL ADDRESS</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(3, 7, 18, 0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  padding: '10px 12px 10px 40px',
                  borderRadius: '10px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(3, 7, 18, 0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  padding: '10px 12px 10px 40px',
                  borderRadius: '10px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              marginTop: '10px',
              padding: '13px 20px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '0.95rem',
              fontWeight: 700,
              borderRadius: '12px'
            }}
          >
            <span>{loading ? (isRegister ? 'Creating Account...' : 'Authenticating System...') : (isRegister ? 'Register Account' : 'Authenticate & Enter')}</span>
            {!loading && <ArrowRight size={18} style={{ flexShrink: 0 }} />}
          </button>
        </form>

        {/* Demo Quick Logins */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, textAlign: 'center', marginBottom: '12px' }}>
            Instant Demo One-Click Access
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setQuickDemo('doctor@neuroearly.ai', 'CLINICIAN')}
              className="btn-secondary"
              style={{ flex: 1, fontSize: '0.78rem', padding: '8px' }}
            >
              <Stethoscope size={14} color="#06b6d4" /> Clinician Demo
            </button>
            <button
              onClick={() => setQuickDemo('patient@neuroearly.ai', 'PATIENT')}
              className="btn-secondary"
              style={{ flex: 1, fontSize: '0.78rem', padding: '8px' }}
            >
              <User size={14} color="#6366f1" /> Patient Demo
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setFormData((previous) => ({
                ...previous,
                role: isRegister ? defaultRole : 'PATIENT'
              }));
            }}
            style={{ background: 'none', border: 'none', color: '#06b6d4', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}
          >
            {isRegister ? 'Already have an account? Login here' : 'Need an account? Register here'}
          </button>
        </div>
      </div>
    </div>
  );
}
