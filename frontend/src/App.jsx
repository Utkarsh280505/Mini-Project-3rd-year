import React, { useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AltoidaLanding from './components/AltoidaLanding';
import AuthPage from './pages/AuthPage';
import NeuralParticleBackground from './components/NeuralParticleBackground';
import ErrorBoundary from './components/ErrorBoundary';
import CookieConsent from './components/CookieConsent';
import NotFound from './pages/NotFound';
import PatientAssessmentWelcome from './pages/PatientAssessmentWelcome';
import { useErrorLogger } from './hooks/useErrorLogger';
import { Brain, Heart, Shield, Activity, Sparkles, Terminal } from 'lucide-react';

// Code-split heavy components & routes
const PatientFlow = lazy(() => import('./pages/PatientFlow'));
const ClinicianDashboard = lazy(() => import('./pages/ClinicianDashboard'));
const OrbitDeliveryHero = lazy(() => import('./components/ui/orbit-delivery-hero'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));

function LoadingSpinner() {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#06b6d4', fontFamily: 'sans-serif' }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '3px solid rgba(6, 182, 212, 0.2)',
        borderTopColor: '#06b6d4',
        margin: '0 auto 16px',
        animation: 'spin 0.8s linear infinite'
      }} />
      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#94a3b8' }}>
        Loading Neural Component...
      </div>
    </div>
  );
}

function MainLayout() {
  useErrorLogger();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    const token = localStorage.getItem('token');
    return token ? 'home' : 'auth';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [authForPatientAssessment, setAuthForPatientAssessment] = useState(false);

  // Auto-redirect logged-in users from Auth view to appropriate workspace
  React.useEffect(() => {
    if (user && activeTab === 'auth') {
      setActiveTab(user.role === 'CLINICIAN' ? 'clinician' : 'patient');
    }
  }, [user, activeTab]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#030712',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#06b6d4',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.5)',
          marginBottom: '20px'
        }}>
          <Brain color="white" size={30} className="pulse-glow" />
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
          NEUROEARLY AI
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          Initializing Neural Engine & Multimodal Biometrics...
        </p>
      </div>
    );
  }

  // Handle Tab Switching with Auth Guard fallback if needed
  const renderContent = () => {
    switch (activeTab) {
      case 'patient':
        return user?.role === 'PATIENT' && user.patient?.id ? (
          <Suspense fallback={<LoadingSpinner />}>
            <PatientFlow />
          </Suspense>
        ) : !user ? (
          <PatientAssessmentWelcome onStart={() => {
            setAuthForPatientAssessment(true);
            setActiveTab('auth');
          }} />
        ) : (
          <div role="status" style={{ padding: '40px 20px' }}>
            <div className="glass-panel" style={{ maxWidth: '540px', margin: '40px auto', padding: '36px', textAlign: 'center', borderRadius: '20px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
                Patient account required
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Sign in with a patient account that has a patient profile to start an assessment. Clinician accounts cannot submit a patient self-assessment.
              </p>
            </div>
          </div>
        );

      case 'clinician':
        return user ? (
          <Suspense fallback={<LoadingSpinner />}>
            <ClinicianDashboard />
          </Suspense>
        ) : (
          <div style={{ padding: '40px 20px' }}>
            <div className="glass-panel" style={{ maxWidth: '540px', margin: '40px auto', padding: '36px', textAlign: 'center', borderRadius: '20px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(139, 92, 246, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Brain color="#8b5cf6" size={26} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
                Clinician Workspace Vault
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.6' }}>
                Access to clinician dashboard, SHAP explainability cards, MRI heatmaps, and longitudinal reports requires authenticated practitioner credentials.
              </p>
              <button
                onClick={() => setActiveTab('auth')}
                className="btn-primary"
                style={{ margin: '0 auto', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }}
              >
                Authenticate as Clinician
              </button>
            </div>
          </div>
        );

      case 'auth':
        return <AuthPage defaultRole={authForPatientAssessment ? 'PATIENT' : 'CLINICIAN'} />;

      case 'privacy':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <PrivacyPolicy onBack={() => setActiveTab('home')} />
          </Suspense>
        );

      case 'terms':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <TermsOfService onBack={() => setActiveTab('home')} />
          </Suspense>
        );

      case 'home':
        return (
          <AltoidaLanding
            onStartAssessment={() => {
              if (user?.role === 'PATIENT') {
                setActiveTab('patient');
              } else if (user) {
                setActiveTab('clinician');
              } else {
                setAuthForPatientAssessment(true);
                setActiveTab('auth');
              }
            }}
            onOpenClinician={() => setActiveTab(user ? 'clinician' : 'auth')}
          />
        );

      default:
        return <NotFound onGoHome={() => setActiveTab('home')} />;
    }
  };

  return (
    <div style={{ background: '#030712', minHeight: '100vh', display: 'flex', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <NeuralParticleBackground />

      {isSidebarOpen && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', zIndex: 1 }}>
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main id="main-content" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          {renderContent()}
        </main>

        <CookieConsent />

        {/* FOOTER */}
      <footer style={{
        background: 'rgba(3, 7, 18, 0.95)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '32px 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Brain color="#06b6d4" size={20} />
              <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.02em', color: '#fff' }}>
                NEUROEARLY <span style={{ color: '#06b6d4' }}>AI</span>
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Multimodal Early Neurological Risk Screening & Decision Support System.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '20px', fontSize: '0.82rem', color: '#94a3b8', flexWrap: 'wrap' }}>
            <span style={{ cursor: 'pointer', color: '#38bdf8' }} onClick={() => setActiveTab('home')}>Platform</span>
            <span style={{ cursor: 'pointer', color: '#38bdf8' }} onClick={() => setActiveTab('patient')}>Patient Screening</span>
            <span style={{ cursor: 'pointer', color: '#38bdf8' }} onClick={() => setActiveTab('clinician')}>Clinician Dashboard</span>
            <span style={{ cursor: 'pointer', color: '#38bdf8' }} onClick={() => setActiveTab('privacy')}>Privacy Policy</span>
            <span style={{ cursor: 'pointer', color: '#38bdf8' }} onClick={() => setActiveTab('terms')}>Terms of Service</span>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#475569', textAlign: 'right' }}>
            <div>© {new Date().getFullYear()} NeuroEarly AI. Research & Clinical Prototype.</div>
            <div style={{ fontFamily: 'monospace', color: '#34d399', marginTop: '2px' }}>● React 19 + Vite + Express + ML Engine</div>
          </div>
        </div>
      </footer>
    </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ErrorBoundary>
  );
}
