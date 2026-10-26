import React from 'react';
import { Activity, ArrowRight, Brain, Eye, Mic } from 'lucide-react';

const assessmentSteps = [
  { icon: Mic, title: 'Speech', description: 'Capture speech patterns and acoustic biomarkers.' },
  { icon: Activity, title: 'Movement', description: 'Complete a short motor and coordination activity.' },
  { icon: Eye, title: 'Eye tracking', description: 'Follow visual targets for an ocular tracking check.' },
  { icon: Brain, title: 'Cognition', description: 'Answer a few questions before reviewing your results.' }
];

export default function PatientAssessmentWelcome({ onStart }) {
  return (
    <section style={{ maxWidth: '900px', margin: '48px auto', padding: '0 24px' }}>
      <div className="glass-panel" style={{ padding: 'clamp(24px, 5vw, 48px)', borderRadius: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            display: 'grid',
            placeItems: 'center',
            color: '#67e8f9',
            background: 'rgba(6, 182, 212, 0.15)'
          }}>
            <Brain size={26} />
          </div>
          <span className="badge badge-info">PATIENT ASSESSMENT</span>
        </div>

        <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: '12px' }}>
          Start your screening assessment
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: 1.7, maxWidth: '680px', marginBottom: '28px' }}>
          Complete a guided set of speech, movement, eye-tracking, cognitive, and imaging activities.
          Your assessment is saved to your account so you can review the results with your clinician.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '12px',
          marginBottom: '30px'
        }}>
          {assessmentSteps.map(({ icon: Icon, title, description }) => (
            <div key={title} style={{
              padding: '16px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(15, 23, 42, 0.55)',
              borderRadius: '14px'
            }}>
              <Icon size={20} color="#38bdf8" style={{ marginBottom: '10px' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>{title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.5 }}>{description}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
          <button type="button" onClick={onStart} className="btn-primary">
            Sign in or create an account <ArrowRight size={17} />
          </button>
          <span style={{ color: '#64748b', fontSize: '0.82rem' }}>
            Sign in as a patient and you’ll go straight to the assessment.
          </span>
        </div>
      </div>
    </section>
  );
}
