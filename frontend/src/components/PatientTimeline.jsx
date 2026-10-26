import React from 'react';
import { Calendar, Activity, CheckCircle2, Clock, AlertTriangle, FileText } from 'lucide-react';

export default function PatientTimeline({ timeline = [], currentSessionId }) {
  const mockTimeline = [
    {
      id: 'sess-001',
      date: '2026-06-15',
      fusedRiskScore: 0.22,
      riskBand: 'low risk',
      status: 'COMPLETED',
      notes: 'Initial Baseline Assessment',
      modalities: ['speech', 'motor', 'cognitive']
    },
    {
      id: 'sess-002',
      date: '2026-08-10',
      fusedRiskScore: 0.38,
      riskBand: 'moderate risk - monitor',
      status: 'COMPLETED',
      notes: 'Follow-up screening. Mild speech tremor noted.',
      modalities: ['speech', 'motor', 'cognitive', 'imaging']
    },
    {
      id: 'sess-003',
      date: '2026-10-08',
      fusedRiskScore: 0.65,
      riskBand: 'elevated risk',
      status: 'UNDER_REVIEW',
      notes: 'Full multimodal scan with MRI hippocampal analysis.',
      modalities: ['speech', 'motor', 'ocular', 'cognitive', 'imaging']
    }
  ];

  const sessions = timeline.length > 0 ? timeline : mockTimeline;

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={20} color="#06b6d4" />
          Longitudinal Patient History & Assessment Timeline
        </h3>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '4px 12px', borderRadius: '12px' }}>
          {sessions.length} Assessment Milestone{sessions.length > 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ position: 'relative', paddingLeft: '24px', margin: '16px 0' }}>
        {/* Vertical line connector */}
        <div style={{
          position: 'absolute',
          left: '11px',
          top: '8px',
          bottom: '8px',
          width: '2px',
          background: 'linear-gradient(180deg, #06b6d4 0%, #6366f1 50%, #f43f5e 100%)'
        }} />

        {sessions.map((sess, idx) => {
          const isHigh = sess.fusedRiskScore > 0.6;
          const isMod = sess.fusedRiskScore > 0.3;
          const isCurrent = sess.id === currentSessionId;

          return (
            <div key={sess.id || idx} style={{ position: 'relative', marginBottom: '24px', opacity: 1 }}>
              {/* Timeline Node Icon */}
              <div style={{
                position: 'absolute',
                left: '-24px',
                top: '2px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: isHigh ? '#f43f5e' : isMod ? '#f59e0b' : '#10b981',
                border: '3px solid #030712',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isCurrent ? `0 0 12px ${isHigh ? '#f43f5e' : '#06b6d4'}` : 'none'
              }}>
                <Activity size={12} color="#fff" />
              </div>

              {/* Node Card */}
              <div style={{
                background: isCurrent ? 'rgba(6, 182, 212, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${isCurrent ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '14px',
                padding: '16px',
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} color="#94a3b8" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                      {sess.date || new Date(sess.createdAt).toLocaleDateString()}
                    </span>
                    {isCurrent && (
                      <span style={{ fontSize: '0.7rem', background: '#06b6d4', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                        Active
                      </span>
                    )}
                  </div>

                  <span className={`badge ${isHigh ? 'badge-high' : isMod ? 'badge-moderate' : 'badge-low'}`} style={{ fontSize: '0.75rem' }}>
                    {(sess.fusedRiskScore * 100).toFixed(0)}% Risk ({sess.riskBand || 'Assessed'})
                  </span>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: '4px 0 10px' }}>
                  {sess.notes || 'Routine multimodal screening.'}
                </p>

                {sess.modalities && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {sess.modalities.map((m) => (
                      <span key={m} style={{
                        fontSize: '0.7rem',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: '#38bdf8',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        textTransform: 'capitalize'
                      }}>
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
