import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Brain,
  Activity,
  Stethoscope,
  ShieldCheck,
  FileText,
  Search,
  Bell,
  Crown,
  LogOut,
  Sparkles,
  User,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Zap,
  Lock
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [hasNotifications, setHasNotifications] = useState(true);

  const mainNav = [
    { icon: Brain, label: 'Platform Overview', id: 'home', badge: null },
    { icon: Activity, label: 'Patient Assessment', id: 'patient', badge: 'Live' },
    { icon: Stethoscope, label: 'Clinician Workspace', id: 'clinician', badge: 'Pro' },
  ];

  const secondaryNav = [
    { icon: ShieldCheck, label: 'Privacy & Security', id: 'privacy', badge: null },
    { icon: FileText, label: 'Terms of Service', id: 'terms', badge: null },
  ];

  return (
    <aside style={{
      width: isCollapsed ? '80px' : '280px',
      minWidth: isCollapsed ? '80px' : '280px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 50,
      boxShadow: '4px 0 24px rgba(0, 0, 0, 0.4)'
    }}>
      {/* HEADER SECTION */}
      <div>
        <div style={{
          padding: isCollapsed ? '20px 12px' : '20px 20px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Logo & Toggle Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between' }}>
            <div
              onClick={() => setActiveTab('home')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                flexShrink: 0
              }}>
                <Brain color="white" size={22} className="pulse-glow" />
              </div>

              {!isCollapsed && (
                <div>
                  <h1 className="font-brand" style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.02em', background: 'linear-gradient(90deg, #ffffff 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    NEUROEARLY <span style={{ color: '#06b6d4', WebkitTextFillColor: '#06b6d4' }}>AI</span>
                  </h1>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>NeuroMarker Platform</span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={() => setHasNotifications(!hasNotifications)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <Bell size={16} />
                {hasNotifications && (
                  <span style={{ position: 'absolute', top: '7px', right: '7px', width: '7px', height: '7px', borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 6px #06b6d4' }} />
                )}
              </button>
            )}
          </div>

          {/* Search Box */}
          {!isCollapsed && (
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search patient IDs or MRIs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(3, 7, 18, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>
          )}
        </div>

        {/* NAVIGATION GROUPS */}
        <div style={{ padding: isCollapsed ? '16px 8px' : '16px 14px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Main Menu */}
          <div>
            {!isCollapsed && (
              <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase', padding: '0 10px 8px' }}>
                Main Menu
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isCollapsed ? 'center' : 'space-between',
                      padding: isCollapsed ? '10px 0' : '10px 12px',
                      borderRadius: '10px',
                      background: isActive ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)' : 'transparent',
                      border: isActive ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid transparent',
                      color: isActive ? '#ffffff' : '#94a3b8',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Icon size={18} color={isActive ? '#06b6d4' : '#64748b'} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '6px',
                        background: item.badge === 'Live' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                        color: item.badge === 'Live' ? '#34d399' : '#c084fc',
                        border: item.badge === 'Live' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(139, 92, 246, 0.3)'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legal & Compliance Menu */}
          <div>
            {!isCollapsed && (
              <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase', padding: '0 10px 8px' }}>
                Compliance & Legal
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {secondaryNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      gap: '12px',
                      padding: isCollapsed ? '10px 0' : '10px 12px',
                      borderRadius: '10px',
                      background: isActive ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                      border: isActive ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
                      color: isActive ? '#ffffff' : '#94a3b8',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Icon size={18} color={isActive ? '#06b6d4' : '#64748b'} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER & PRO CARD SECTION */}
      <div>
        {/* Pro Upgrade / FDA Engine Card */}
        {!isCollapsed && (
          <div style={{ padding: '0 14px 14px' }}>
            <div style={{
              borderRadius: '14px',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Crown size={18} color="#06b6d4" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>FDA Breakthrough ML</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4, marginBottom: '12px' }}>
                Late-fusion 4-modality AI model with 94.8% sensitivity.
              </p>
              <button
                onClick={() => setActiveTab('patient')}
                className="btn-primary"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.78rem', borderRadius: '8px', gap: '6px' }}
              >
                <Zap size={14} /> Launch Assessment
              </button>
            </div>
          </div>
        )}

        {/* User Profile Vault Footer */}
        <div style={{
          padding: isCollapsed ? '16px 8px' : '16px 14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(3, 7, 18, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between'
        }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: user.role === 'CLINICIAN' ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0
              }}>
                {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
              </div>

              {!isCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name || 'User Profile'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: user.role === 'CLINICIAN' ? '#38bdf8' : '#c084fc', fontWeight: 600 }}>
                    {user.role || 'PATIENT'}
                  </span>
                </div>
              )}

              {!isCollapsed && (
                <button
                  onClick={logout}
                  title="Sign Out"
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('auth')}
              className="btn-secondary"
              style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem', justifyContent: 'center' }}
            >
              <User size={15} color="#06b6d4" />
              {!isCollapsed && <span>Sign In / Register</span>}
            </button>
          )}

          {/* Sidebar Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            style={{
              marginLeft: isCollapsed ? 0 : '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#94a3b8',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
