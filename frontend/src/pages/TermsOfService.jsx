import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsOfService({ onBack }) {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px', color: '#f8fafc', position: 'relative', zIndex: 1 }}>
      <button onClick={onBack} className="btn-secondary" style={{ marginBottom: '24px', gap: '6px' }}>
        <ArrowLeft size={16} /> Back to Platform
      </button>

      <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={28} color="#6366f1" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Terms of Service</h1>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Last Updated: October 2026 // Platform Terms</p>
          </div>
        </div>

        <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>1. Platform Usage Terms</h3>
            <p>
              NeuroEarly AI is a research and demonstration prototype, not a validated clinical screening or decision-support product. Do not enter real patient information in this deployment or use its outputs to make health or treatment decisions. Clinician-entered measurements are stored for demonstration and review only; they are not validated, interpreted, or scored.
            </p>
          </section>

          <section>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>2. Practitioner Responsibility</h3>
            <p>
              The included models use synthetic data and have not been clinically validated. Any future model outputs require independent clinical validation, appropriate security and privacy controls, and regulatory review before use with patients.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
