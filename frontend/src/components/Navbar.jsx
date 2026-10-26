import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Brain, Stethoscope, UserCheck, LogOut, Activity, Radio, Home, PanelLeft } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, toggleSidebar }) {
  const { user, logout } = useAuth();

  return (
    <header style={{
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(6, 182, 212, 0.18)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)'
    }}>
      {/* Brand Logo & Sidebar Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {toggleSidebar && (
          <button
            onClick={toggleSidebar}
            title="Toggle Sidebar Navigation"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '8px',
              color: '#38bdf8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <PanelLeft size={18} />
          </button>
        )}

        <div
          onClick={() => setActiveTab('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
        >
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 24px rgba(6, 182, 212, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          position: 'relative'
        }}>
          <Brain color="white" size={24} className="pulse-glow" />
        </div>
        <div>
          <h1 className="font-brand" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.02em', background: 'linear-gradient(90deg, #ffffff 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            NEUROEARLY <span style={{ color: '#06b6d4', WebkitTextFillColor: '#06b6d4' }}>AI</span>
          </h1>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', display: 'inline-block' }}></span>
            <span>NeuroMarker Platform</span>
          </div>
        </div>
      </div>
      </div>

      {/* Navigation Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.75)',
          padding: '5px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
        }}>
          <button
            onClick={() => setActiveTab('home')}
            style={{
              background: activeTab === 'home' ? 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)' : 'transparent',
              color: activeTab === 'home' ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.25s ease',
              boxShadow: activeTab === 'home' ? '0 4px 15px rgba(6, 182, 212, 0.4)' : 'none'
            }}
          >
            <Home size={15} />
            Platform
          </button>
          <button
            onClick={() => setActiveTab('patient')}
            style={{
              background: activeTab === 'patient' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: activeTab === 'patient' ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.25s ease',
              boxShadow: activeTab === 'patient' ? '0 4px 15px rgba(99, 102, 241, 0.4)' : 'none'
            }}
          >
            <Activity size={15} />
            Patient Assessment
          </button>
          <button
            onClick={() => setActiveTab('clinician')}
            style={{
              background: activeTab === 'clinician' ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' : 'transparent',
              color: activeTab === 'clinician' ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.25s ease',
              boxShadow: activeTab === 'clinician' ? '0 4px 15px rgba(139, 92, 246, 0.4)' : 'none'
            }}
          >
            <Stethoscope size={15} />
            Clinician Workspace
          </button>
        </div>

        {/* User Status Profile */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '16px', borderLeft: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>{user.name}</div>
              <span className={`badge ${user.role === 'CLINICIAN' ? 'badge-info' : 'badge-low'}`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              title="Logout System"
              style={{
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#f87171',
                padding: '9px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
