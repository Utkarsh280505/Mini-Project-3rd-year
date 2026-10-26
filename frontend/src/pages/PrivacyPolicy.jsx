import React from 'react';
import { ShieldCheck, ArrowLeft, Lock } from 'lucide-react';

export default function PrivacyPolicy({ onBack }) {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px', color: '#f8fafc', position: 'relative', zIndex: 1 }}>
      <button onClick={onBack} className="btn-secondary" style={{ marginBottom: '24px', gap: '6px' }}>
        <ArrowLeft size={16} /> Back to Platform
      </button>

      <div className="glass-panel" style={{ padding: '40px', borderRadius: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={28} color="#06b6d4" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Privacy Policy</h1>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Last Updated: October 2026 // Clinical & Prototype Compliance</p>
          </div>
        </div>

        <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>1. Information We Collect</h3>
            <p>
              This prototype stores account and assessment-session information. Clinicians can enter motor values, cognitive assessment scores, and numeric findings transcribed from imaging reports; the source name, values, and collection metadata are stored for review and are not analyzed or scored. With explicit consent, the patient flow can temporarily receive a short microphone recording or one de-identified DICOM/NIfTI research scan. Raw media is held in backend memory for the request, is not written to disk or the database, and is not analyzed; the session stores capture metadata only (format, size, duration where applicable, and consent timestamp). MRI capture metadata is not used to generate a score. Do not upload identifiable scans or other real patient information. Other patient activities are demonstrations; they do not produce validated clinical measurements.
            </p>
          </section>

          <section>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>2. Prototype Security Limitations</h3>
            <p>
              This development prototype has not been independently security-audited or assessed for HIPAA compliance. It does not provide production-grade protections for patient data. Do not use real patient information, clinician-entered measurements, or recordings in this deployment. Production use requires appropriate transport and storage security, verified access controls and patient/clinician relationships, retention and deletion policies, and required legal and clinical review.
            </p>
          </section>

          <section>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>3. Medical Disclaimer</h3>
            <p style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '14px', borderRadius: '12px', color: '#f87171' }}>
              NeuroEarly AI uses synthetic training data and is not clinically validated. Uploaded MRI scans are not analyzed or scored. This prototype does not generate a patient risk score from its guided assessment activities. It is not a diagnostic tool and must not guide health decisions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
