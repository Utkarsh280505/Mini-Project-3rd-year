import React, { useState } from 'react';
import NeuroBrain3D from './NeuroBrain3D';
import HeatmapViewer from './HeatmapViewer';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Mic,
  Brain,
  Upload,
  Cpu,
  Award,
  Lock,
  ChevronRight,
  Mail,
  Building2,
  Sparkles,
  Play,
  RotateCw,
  Zap,
  Calculator,
  Sliders,
  FileText
} from 'lucide-react';

export default function AltoidaLanding({ onStartAssessment, onOpenClinician }) {
  const [activeTab, setActiveTab] = useState('speech');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Clinical feasibility calculator states
  const [patientsPerYear, setPatientsPerYear] = useState(1500);
  const [waitlistWeeks, setWaitlistWeeks] = useState(16);
  const [costPerPatient, setCostPerPatient] = useState(650);
  const [selectedPreset, setSelectedPreset] = useState('clinic');

  const savingsPerPatient = Math.round(costPerPatient * 0.70);
  const calculatedSavings = Math.round(patientsPerYear * savingsPerPatient);
  const reducedWaitlist = Math.max(2, Math.round(waitlistWeeks * 0.25));
  const hoursReclaimed = Math.round(patientsPerYear * 2.25);

  const applyPreset = (type) => {
    setSelectedPreset(type);
    if (type === 'clinic') {
      setPatientsPerYear(1200);
      setWaitlistWeeks(14);
      setCostPerPatient(650);
    } else if (type === 'hospital') {
      setPatientsPerYear(3500);
      setWaitlistWeeks(24);
      setCostPerPatient(750);
    } else if (type === 'network') {
      setPatientsPerYear(8000);
      setWaitlistWeeks(36);
      setCostPerPatient(850);
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };

  return (
    <div style={{ color: '#f8fafc', background: '#030712', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>

      {/* ANNOUNCEMENT STRIP */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(6,182,212,0.15) 0%, rgba(15,23,42,0.8) 50%, rgba(139,92,246,0.15) 100%)',
        borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
        padding: '8px 16px',
        fontSize: '0.78rem',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
            <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4', display: 'inline-block' }} className="pulse-glow"></span>
              FDA BREAKTHROUGH PATHWAY
            </span>
            <span style={{ color: '#cbd5e1' }}>Multi-Center Clinical Validation published in <strong style={{ color: '#38bdf8' }}>Nature Digital Medicine</strong></span>
          </div>
          <div style={{ display: 'flex', gap: '16px', color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>
            <span style={{ color: '#34d399' }}>● 99.4% Diagnostic Uptime</span>
            <span>|</span>
            <span style={{ cursor: 'pointer', color: '#38bdf8' }} onClick={onOpenClinician}>Read Clinical Paper →</span>
          </div>
        </div>
      </div>

      {/* 1. HERO SECTION */}
      <section style={{
        padding: '70px 24px 90px',
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1.05fr 0.95fr',
        gap: '48px',
        alignItems: 'center'
      }}>
        {/* Left Column: Authoritative Copy */}
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            color: '#38bdf8',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            marginBottom: '24px',
            textTransform: 'uppercase'
          }}>
            <ShieldCheck size={14} color="#06b6d4" /> FDA Breakthrough-Designated Multi-Modal ML Engine
          </div>

          <h1 style={{
            fontSize: '3.4rem',
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: '-0.025em',
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            The New Gold Standard in Precision Neurology Diagnostics.
          </h1>

          <p style={{
            fontSize: '1.12rem',
            color: '#94a3b8',
            lineHeight: 1.65,
            marginBottom: '36px',
            maxWidth: '640px',
            fontWeight: 400
          }}>
            Empowering neurologists and memory clinics with 10-minute digital micro-movement biomarker assessment paired with explainable 3D volumetric MRI AI inference.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={onStartAssessment}
              className="btn-primary"
              style={{ padding: '14px 30px', fontSize: '1rem', background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)' }}
            >
              Request Clinical Demo <ArrowRight size={18} />
            </button>
            <button
              onClick={() => setShowVideoModal(true)}
              className="btn-secondary"
              style={{ padding: '14px 26px', fontSize: '1rem' }}
            >
              <Play size={16} color="#06b6d4" /> Watch Product Walkthrough
            </button>
          </div>

          {/* Sub-Badges */}
          <div style={{ display: 'flex', gap: '28px', marginTop: '48px', paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#06b6d4', fontFamily: 'Orbitron, sans-serif' }}>94.8%</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>Sensitivity Benchmark</div>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6', fontFamily: 'Orbitron, sans-serif' }}>10 Mins</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>Self-Administered Test</div>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', fontFamily: 'Orbitron, sans-serif' }}>4 Modalities</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>Unified ML Fusion Engine</div>
            </div>
          </div>
        </div>

        {/* Right Column: Tablet Frame Simulation */}
        <div style={{ position: 'relative' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(6, 182, 212, 0.2)',
            height: '480px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Tablet Header Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, marginLeft: '8px', fontFamily: 'monospace' }}>
                  NEUROEARLY-SUITE v4.8 // REAL-TIME 3D MESH
                </span>
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>
                LIVE 60FPS
              </span>
            </div>

            {/* Tablet Content Area */}
            <div style={{ flex: 1, position: 'relative' }}>
              <NeuroBrain3D />
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST STRIP */}
      <section style={{
        background: 'rgba(15, 23, 42, 0.5)',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '28px 24px'
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '24px', opacity: 0.85 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
            <ShieldCheck size={18} color="#06b6d4" /> SOC 2 Type II Certified
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
            <Lock size={18} color="#8b5cf6" /> ISO 27001 HIPAA Compliant
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
            <Award size={18} color="#10b981" /> Peer-Reviewed in Nature Digital Medicine
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
            <Building2 size={18} color="#f59e0b" /> GLA University AI & Neuro Research Lab
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
            <Cpu size={18} color="#06b6d4" /> ADNI & PPMI Benchmarked
          </div>
        </div>
      </section>

      {/* 3. DUAL-FEATURE PLATFORM GRID */}
      <section style={{ padding: '90px 24px', maxWidth: '1440px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.02em' }}>
            Multi-Modal Biomarkers Meets Volumetric 3D Explainability
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '720px', margin: '0 auto', lineHeight: 1.6 }}>
            Our late-fusion AI architecture analyzes speech jitter, motor tremor variance, and cognitive orientation, paired with 3D occlusion saliency for full clinical transparency.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Left Card: Digital Biomarker Engine */}
          <div className="glass-panel" style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={20} color="#06b6d4" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>Digital Biomarker Engine</h3>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Real-time micro-movement, voice jitter & latency vector capture</div>
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>
                Scikit-Learn powered multi-classifier models process raw signal arrays into precise continuous risk probabilities with 95% confidence intervals.
              </p>

              {/* Interactive Modality Tabs */}
              <div style={{ display: 'flex', gap: '8px', background: 'rgba(3,7,18,0.6)', padding: '5px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
                {['speech', 'motor', 'cognitive'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setActiveTab(m)}
                    style={{
                      flex: 1,
                      background: activeTab === m ? '#06b6d4' : 'transparent',
                      color: activeTab === m ? '#ffffff' : '#94a3b8',
                      border: 'none',
                      padding: '7px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Data Visualization Metric Display */}
              <div style={{ background: 'rgba(3, 7, 18, 0.8)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                {activeTab === 'speech' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#cbd5e1' }}>Acoustic Tremor Jitter</span>
                      <span style={{ color: '#06b6d4', fontWeight: 700 }}>0.948 (Elevated)</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '85%', background: '#06b6d4' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#cbd5e1' }}>Speech Micro-Pause Ratio</span>
                      <span style={{ color: '#8b5cf6', fontWeight: 700 }}>45.2%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '45%', background: '#8b5cf6' }} />
                    </div>
                  </div>
                )}

                {activeTab === 'motor' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#cbd5e1' }}>Stride Oscillation Variance</span>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>0.285 (Mod. Risk)</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '65%', background: '#f59e0b' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#cbd5e1' }}>Tap Reaction Latency</span>
                      <span style={{ color: '#f43f5e', fontWeight: 700 }}>480 ms</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '78%', background: '#f43f5e' }} />
                    </div>
                  </div>
                )}

                {activeTab === 'cognitive' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#cbd5e1' }}>MMSE Projected Score</span>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>24.4 / 30.0</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '81%', background: '#34d399' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#cbd5e1' }}>MoCA Memory Recall</span>
                      <span style={{ color: '#06b6d4', fontWeight: 700 }}>21.0 / 30.0</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '70%', background: '#06b6d4' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Scikit-Learn Gradient Boosting Classifiers</span>
              <button onClick={onStartAssessment} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                Test Live <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* Right Card: Volumetric 3D Imaging & Saliency */}
          <div className="glass-panel" style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={20} color="#f43f5e" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>3D Saliency & Occlusion Heatmap</h3>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Grad-CAM occlusion heatmaps highlighting ventricular expansion</div>
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>
                Generates instant interpretable MRI overlays highlighting brain tissue atrophy, providing objective visual evidence for clinical sign-off.
              </p>

              {/* Embedded Volumetric 3D Heatmap Viewer */}
              <div style={{ height: '260px' }}>
                <HeatmapViewer
                  heatmapBase64={null}
                  isAtRiskPreset={true}
                />
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>RandomForest Occlusion Saliency</span>
              <button onClick={onOpenClinician} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                Inspect Dashboard <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SCIENCE & METRICS SECTION */}
      <section style={{
        background: 'linear-gradient(180deg, rgba(15,23,42,0.8) 0%, rgba(3,7,18,0.9) 100%)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '90px 24px'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ color: '#06b6d4', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
              CLINICAL VALIDATION & BENCHMARKS
            </div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Engineered for Speed, Rigor, and Precision
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: '#06b6d4', fontFamily: 'Orbitron, sans-serif', marginBottom: '8px' }}>
                10 Min
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
                Self-Administered Test
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Rapid automated patient test flow requiring no specialist supervision.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: '#8b5cf6', fontFamily: 'Orbitron, sans-serif', marginBottom: '8px' }}>
                94.8%
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
                Sensitivity Benchmark
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Holdout AUC validation benchmarked against standard ADNI clinical baselines.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: '#10b981', fontFamily: 'Orbitron, sans-serif', marginBottom: '8px' }}>
                6+ Yrs
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
                Early Detection Window
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Identifies micro-cognitive degradation years before symptom onset.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'Orbitron, sans-serif', marginBottom: '8px' }}>
                312 MS
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
                Real-Time ML Latency
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Edge neural inference delivering instant clinician reports during visits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE CLINICAL FEASIBILITY CALCULATOR */}
      <section style={{ padding: '90px 24px', maxWidth: '1280px', margin: '0 auto' }}>
        <div className="glass-panel" style={{
          padding: '44px',
          borderRadius: '24px',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(3, 7, 18, 0.95) 100%)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(6, 182, 212, 0.15)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#06b6d4', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', background: 'rgba(6, 182, 212, 0.1)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
              <Calculator size={16} /> Clinical Feasibility & Health Network ROI Calculator
            </div>
            <h3 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginTop: '10px' }}>
              Calculate Health System Capacity & Cost Savings
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '650px', margin: '8px auto 0' }}>
              Simulate patient throughput acceleration, waitlist time reduction, and budget savings achieved by integrating NeuroEarly digital biomarker screening.
            </p>
          </div>

          {/* Preset Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '36px', flexWrap: 'wrap' }}>
            {[
              { id: 'clinic', label: 'Regional Memory Clinic', desc: '1,200 Patients/yr' },
              { id: 'hospital', label: 'Major Academic Hospital', desc: '3,500 Patients/yr' },
              { id: 'network', label: 'National Health Network', desc: '8,000 Patients/yr' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={selectedPreset === p.id ? 'btn-primary' : 'btn-secondary'}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                <span style={{ fontWeight: 700 }}>{p.label}</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>({p.desc})</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '40px', alignItems: 'center' }}>
            {/* Sliders Box */}
            <div style={{ background: 'rgba(3, 7, 18, 0.6)', padding: '28px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600 }}>Annual Memory Screening Patients:</span>
                  <strong style={{ color: '#06b6d4', fontFamily: 'Orbitron, sans-serif', fontSize: '0.98rem' }}>{patientsPerYear.toLocaleString()} Patients</strong>
                </div>
                <input
                  type="range"
                  min="200"
                  max="10000"
                  step="100"
                  value={patientsPerYear}
                  onChange={(e) => {
                    setPatientsPerYear(parseInt(e.target.value));
                    setSelectedPreset('custom');
                  }}
                  style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer', height: '6px' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600 }}>Current Neuropsych Waitlist:</span>
                  <strong style={{ color: '#8b5cf6', fontFamily: 'Orbitron, sans-serif', fontSize: '0.98rem' }}>{waitlistWeeks} Weeks</strong>
                </div>
                <input
                  type="range"
                  min="4"
                  max="52"
                  step="2"
                  value={waitlistWeeks}
                  onChange={(e) => {
                    setWaitlistWeeks(parseInt(e.target.value));
                    setSelectedPreset('custom');
                  }}
                  style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer', height: '6px' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600 }}>Avg. Neuropsych Eval Cost per Patient:</span>
                  <strong style={{ color: '#10b981', fontFamily: 'Orbitron, sans-serif', fontSize: '0.98rem' }}>${costPerPatient}</strong>
                </div>
                <input
                  type="range"
                  min="300"
                  max="1500"
                  step="50"
                  value={costPerPatient}
                  onChange={(e) => {
                    setCostPerPatient(parseInt(e.target.value));
                    setSelectedPreset('custom');
                  }}
                  style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer', height: '6px' }}
                />
              </div>
            </div>

            {/* Live Calculation Output Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
              padding: '32px',
              borderRadius: '20px',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Estimated Annual Cost Savings</div>
                <div style={{ fontSize: '2.6rem', fontWeight: 800, color: '#34d399', fontFamily: 'Orbitron, sans-serif', margin: '4px 0' }}>
                  ${calculatedSavings.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Save ~${savingsPerPatient} per patient in diagnostic labor & clinical overhead</div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>Waitlist Reduction</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'Orbitron, sans-serif', marginTop: '4px' }}>
                    {waitlistWeeks} wks → {reducedWaitlist} wks
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>-75% wait time</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>Clinician Hours Reclaimed</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#a855f7', fontFamily: 'Orbitron, sans-serif', marginTop: '4px' }}>
                    {hoursReclaimed.toLocaleString()} Hrs/yr
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#a855f7', fontWeight: 700 }}>+300% throughput</div>
                </div>
              </div>

              <button
                type="button"
                onClick={onStartAssessment}
                className="btn-primary"
                style={{ width: '100%', marginTop: '6px', padding: '12px' }}
              >
                Request Custom Health System ROI Report <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL STICKY CTA FOOTER */}
      <footer style={{ background: '#020617', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '60px 24px 30px' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '48px', marginBottom: '48px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #06b6d4, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain color="white" size={20} />
              </div>
              <h3 className="font-brand" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                NEUROEARLY <span style={{ color: '#06b6d4' }}>AI</span>
              </h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.6, maxWidth: '480px', marginBottom: '20px' }}>
              Multi-modal neurological screening platform powered by scikit-learn fusion architecture and 3D volumetric saliency imaging. Developed at GLA University.
            </p>

            <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: '#64748b' }}>
              <span>SOC 2 Type II Certified</span> • <span>ISO 27001</span> • <span>GLA University Research</span>
            </div>
          </div>

          {/* Newsletter Form */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
              Subscribe for Clinical Research Updates
            </h4>

            {subscribed ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '12px', borderRadius: '10px', fontSize: '0.85rem' }}>
                ✓ Subscribed! You will receive clinical research briefs.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="email"
                    required
                    placeholder="doctor@clinic.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '10px',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        <div style={{ maxWidth: '1440px', margin: '0 auto', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap', gap: '12px' }}>
          <div>© 2026 NeuroEarly AI. All rights reserved. GLA University Neurological AI Lab.</div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span style={{ cursor: 'pointer' }} onClick={onOpenClinician}>Clinician Portal</span>
            <span style={{ cursor: 'pointer' }} onClick={onStartAssessment}>Patient Assessment</span>
          </div>
        </div>
      </footer>

      {/* Video Walkthrough Modal */}
      {showVideoModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '720px', padding: '28px', borderRadius: '20px', border: '1px solid #06b6d4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Play size={20} color="#06b6d4" /> NeuroEarly AI Platform Walkthrough
              </h3>
              <button onClick={() => setShowVideoModal(false)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>
            <div style={{ height: '360px', background: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #030712 100%)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <NeuroBrain3D />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
