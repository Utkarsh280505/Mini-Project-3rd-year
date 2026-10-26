import React, { useState } from 'react';
import { CheckCircle, X, MessageSquare, AlertTriangle } from 'lucide-react';

export default function DoctorReviewModal({ session, onClose, onSubmitReview }) {
  const [notes, setNotes] = useState(session?.riskReport?.clinicianNotes || '');
  const [riskBand, setRiskBand] = useState(session?.riskReport?.riskBand || 'moderate risk');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmitReview(session.id, notes, riskBand);
      onClose();
    } catch (err) {
      console.error('Review failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 16, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <CheckCircle size={24} color="#10b981" />
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Clinician Diagnostic Review</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Patient: {session?.patient?.user?.name || 'Patient Assessment'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Confirmed Clinical Risk Level
            </label>
            <select
              value={riskBand}
              onChange={(e) => setRiskBand(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                padding: '10px',
                borderRadius: '8px',
                outline: 'none'
              }}
            >
              <option value="low risk" style={{ background: '#121a2f' }}>Low Risk (Standard Follow-up)</option>
              <option value="moderate risk" style={{ background: '#121a2f' }}>Moderate Risk (3-Month Re-evaluation)</option>
              <option value="elevated risk - recommend specialist evaluation" style={{ background: '#121a2f' }}>
                Elevated Risk (Specialist Evaluation Recommended)
              </option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Doctor Clinical Notes & Observations
            </label>
            <textarea
              rows="4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter clinical impression, MRI findings, or recommended medications/therapies..."
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                padding: '10px',
                borderRadius: '8px',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => {
                const reportWindow = window.open('', '_blank');
                const pName = session?.patient?.user?.name || 'Patient';
                const rScore = session?.riskReport?.fusedRiskScore ? (session.riskReport.fusedRiskScore * 100).toFixed(1) : 'N/A';
                reportWindow.document.write(`
                  <html>
                    <head>
                      <title>Clinical Diagnostic Report - ${pName}</title>
                      <style>
                        body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
                        h1 { color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 10px; }
                        .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                        .score { font-size: 24px; font-weight: bold; color: ${session?.riskReport?.fusedRiskScore > 0.6 ? '#dc2626' : '#16a34a'}; }
                        .signature { margin-top: 50px; border-top: 1px solid #94a3b8; width: 300px; padding-top: 8px; }
                      </style>
                    </head>
                    <body>
                      <h1>NEUROEARLY AI — CLINICAL DIAGNOSTIC REPORT</h1>
                      <div class="box">
                        <p><strong>Patient Name:</strong> ${pName}</p>
                        <p><strong>Session ID:</strong> ${session?.id || 'N/A'}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                        <p><strong>Fused Neurological Risk Score:</strong> <span class="score">${rScore}%</span></p>
                        <p><strong>Clinical Risk Band:</strong> ${riskBand}</p>
                      </div>
                      <div class="box">
                        <h3>Clinician Impression & Notes</h3>
                        <p>${notes || 'No clinical notes added.'}</p>
                      </div>
                      <div class="signature">
                        <p><strong>Attending Practitioner Sign-off</strong></p>
                        <p>Date: ${new Date().toLocaleDateString()}</p>
                      </div>
                      <script>window.print();</script>
                    </body>
                  </html>
                `);
                reportWindow.document.close();
              }}
              className="btn-secondary"
              style={{ fontSize: '0.8rem' }}
            >
              📄 Export PDF Report
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary" style={{ background: '#10b981' }}>
                {submitting ? 'Signing Off...' : 'Complete & Sign Off'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
