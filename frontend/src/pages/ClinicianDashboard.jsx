import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import NeuroBrain3D from '../components/NeuroBrain3D';
import {
  Users,
  Stethoscope,
  ChevronRight,
  Cpu,
  Activity,
  Zap,
  ShieldAlert,
  Search
} from 'lucide-react';

const readMeasurementJson = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error('Failed to parse saved clinical measurement:', error);
    return null;
  }
};

export default function ClinicianDashboard() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [measurementModality, setMeasurementModality] = useState('motor');
  const [measurementInstrument, setMeasurementInstrument] = useState('');
  const [measurementValues, setMeasurementValues] = useState({});
  const [imagingFindings, setImagingFindings] = useState([{ label: '', value: '', unit: '' }]);
  const [measurementSaving, setMeasurementSaving] = useState(false);
  const [measurementMessage, setMeasurementMessage] = useState('');
  const [measurementError, setMeasurementError] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/patients');
      setPatients(res.data);
      if (res.data.length > 0) {
        selectPatient(res.data[0]);
      }
    } catch (err) {
      console.error('Fetch patients failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectPatient = async (patient) => {
    setSelectedPatient(patient);
    setMeasurementMessage('');
    setMeasurementError('');
    setMeasurementValues({});
    setImagingFindings([{ label: '', value: '', unit: '' }]);
    setMeasurementInstrument('');
    const latestSession = patient.sessions?.[0];
    setSelectedSession(latestSession || null);
    if (latestSession) {
      try {
        const sessionResponse = await apiClient.get(`/sessions/${latestSession.id}`);
        setSelectedSession(sessionResponse.data);
      } catch (err) {
        console.error('Fetch assessment session failed:', err);
      }
    }
  };

  const saveClinicalMeasurement = async (event) => {
    event.preventDefault();
    setMeasurementSaving(true);
    setMeasurementError('');
    setMeasurementMessage('');

    try {
      if (!selectedPatient) {
        throw new Error('Select a patient before saving measurements.');
      }

      let sessionId = selectedSession?.id;
      if (!sessionId) {
        const sessionResponse = await apiClient.post('/sessions', {
          patientId: selectedPatient.id,
          notes: 'Clinician-recorded measurements; not analyzed'
        });
        sessionId = sessionResponse.data.id;
      }

      const payload = {
        sessionId,
        modality: measurementModality,
        instrument: measurementInstrument.trim()
      };

      if (measurementModality === 'imaging') {
        payload.measurements = imagingFindings.map((finding) => ({
          label: finding.label.trim(),
          value: Number(finding.value),
          unit: finding.unit.trim()
        }));
      } else {
        payload.record = Object.fromEntries(
          Object.entries(measurementValues)
            .filter(([, value]) => value !== '')
            .map(([name, value]) => [name, Number(value)])
        );
      }

      await apiClient.post('/assessments/clinical-measurements', payload);
      const sessionResponse = await apiClient.get(`/sessions/${sessionId}`);
      setSelectedSession(sessionResponse.data);
      setMeasurementValues({});
      setImagingFindings([{ label: '', value: '', unit: '' }]);
      setMeasurementInstrument('');
      setMeasurementMessage('Saved as collected clinical data. No model analysis or risk score was generated.');
    } catch (err) {
      console.error('Saving clinician measurement failed:', err);
      setMeasurementError(err.response?.data?.error || err.message || 'Measurement could not be saved.');
    } finally {
      setMeasurementSaving(false);
    }
  };

  const measurementFields = measurementModality === 'motor'
    ? [
      { name: 'stride_var', label: 'Stride variability', unit: 'source-defined unit' },
      { name: 'tremor_amp', label: 'Tremor amplitude', unit: 'source-defined unit' },
      { name: 'reaction_time_ms', label: 'Reaction time', unit: 'ms' },
      { name: 'gait_speed', label: 'Gait speed', unit: 'm/s' }
    ]
    : [
      { name: 'mmse_score', label: 'MMSE total', unit: '0–30' },
      { name: 'moca_score', label: 'MoCA total', unit: '0–30' },
      { name: 'recall_score', label: 'Recall subscore', unit: '0–10' },
      { name: 'attention_score', label: 'Attention subscore', unit: '0–10' }
    ];

  const collectedMeasurements = selectedSession?.modalityData?.filter((item) => item.source === 'collected') || [];

  const filteredPatients = patients.filter((p) => {
    const matchesSearch = p.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toString().includes(searchTerm);
    if (!matchesSearch) return false;
    if (filter === 'UNDER_REVIEW') return p.sessions?.some((s) => s.status === 'UNDER_REVIEW');
    if (filter === 'COMPLETED') return p.sessions?.some((s) => s.status === 'COMPLETED');
    return true;
  });

  return (
    <div style={{ color: '#f8fafc', background: '#030712', minHeight: '100vh', padding: '28px 36px', maxWidth: '1680px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
      <div role="status" style={{ padding: '14px 18px', marginBottom: '22px', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.4)', background: 'rgba(120, 53, 15, 0.25)', color: '#fde68a', lineHeight: 1.5 }}>
        Prototype data collection only. Enter measurements from an authorized external tool or report. Collected values are saved for review but are not sent to the model and do not generate a risk score. This system is not clinically validated or approved for patient care.
      </div>
      
      {/* TOP HEADER & LIVE TELEMETRY BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '3px 10px' }}>
              <Zap size={12} color="#06b6d4" /> PROTOTYPE // CLINICIAN DATA ENTRY
            </span>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'monospace' }}>
              NOT CLINICALLY VALIDATED
            </span>
          </div>

          <h1 className="font-brand" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Stethoscope size={28} color="#06b6d4" />
            Clinician Workspace & Data Collection
          </h1>
        </div>

        {/* Filter Badges & Search */}
        <div style={{ display: 'flex', items: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search patient roster..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                padding: '8px 12px 8px 36px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                width: '200px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', background: 'rgba(15,23,42,0.6)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {['ALL', 'UNDER_REVIEW', 'COMPLETED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)' : 'transparent',
                  color: filter === f ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 DIAGNOSTIC KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        
        {/* Card 1 */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Active Cohort Roster</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>Active Patients</h3>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="#06b6d4" />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'Orbitron, sans-serif' }}>{patients.length}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              Prototype patient profiles
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(244, 63, 94, 0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700 }}>Prototype Data</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>Existing model reports</h3>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(244,63,94,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={20} color="#fbbf24" />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'Orbitron, sans-serif' }}>
              {patients.filter((p) => p.sessions?.[0]?.riskReport).length} Existing model reports
            </div>
            <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '4px' }}>Unvalidated; not clinical alerts</div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#8b5cf6', textTransform: 'uppercase', fontWeight: 700 }}>Model Status</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>Clinical validation</h3>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={20} color="#8b5cf6" />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'Orbitron, sans-serif' }}>NOT VALIDATED</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Trained on synthetic data</div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>Risk scoring</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>Patient assessment</div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color="#10b981" />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'Orbitron, sans-serif' }}>DISABLED</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>No clinical inference from collected data</div>
          </div>
        </div>

      </div>

      {/* Prototype visualization; no clinical telemetry is generated. */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '28px', marginBottom: '28px' }}>
        
        <div style={{ height: '460px' }}>
          <NeuroBrain3D activeRiskScore={0} />
        </div>

        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} color="#8b5cf6" /> Collected measurements
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Saved for review only; not analyzed</p>
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>{collectedMeasurements.length} entries</span>
            </div>

            <div style={{ borderRadius: '14px', padding: '18px', marginBottom: '20px', background: 'rgba(120, 53, 15, 0.2)', color: '#fde68a', lineHeight: 1.5 }}>
              No clinical risk score is available. This visualization is decorative and does not represent a patient measurement.
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Local prototype; no external system connected</span>
          </div>
        </div>

      </div>

      {/* Patient roster and prototype output status */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '28px' }}>
        
        {/* Patient Roster Sidebar */}
        <div className="glass-panel" style={{ padding: '20px', maxHeight: '680px', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="#06b6d4" /> Patient Roster Queue ({filteredPatients.length})
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>Loading roster...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredPatients.map((p) => {
                const isSelected = selectedPatient?.id === p.id;
                const latestSession = p.sessions?.[0];
                return (
                  <div
                    key={p.id}
                    onClick={() => selectPatient(p)}
                    className="glass-card-interactive"
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                      border: isSelected ? '1px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
                          {p.user?.name || 'Anonymous Patient'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                          {p.age} yrs • {p.gender}
                        </div>
                      </div>

                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.72rem', color: '#94a3b8' }}>
                      <span>{latestSession?.status || 'No Session'}</span>
                      <ChevronRight size={14} color="#94a3b8" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>
            Record external clinical measurements
          </h2>
          <p style={{ color: '#fde68a', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '18px' }}>
            Enter values from an instrument or assessment you are authorized to use. This saves the supplied values and their source only; it does not validate the instrument, interpret results, or run AI scoring. Legacy model scores, heatmaps, explanations, and risk bands are intentionally not shown.
          </p>

          {!selectedSession && (
            <p role="status" style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '16px' }}>
              Saving the first measurement will create an assessment session for this patient.
            </p>
          )}

          <form onSubmit={saveClinicalMeasurement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#cbd5e1', fontSize: '0.85rem' }}>
              Measurement type
              <select
                value={measurementModality}
                onChange={(event) => setMeasurementModality(event.target.value)}
                style={{ padding: '10px', borderRadius: '8px', background: '#030712', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <option value="motor">Motor / gait measurement</option>
                <option value="cognitive">Clinician-entered cognitive test scores</option>
                <option value="imaging">Numeric finding from an imaging report</option>
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#cbd5e1', fontSize: '0.85rem' }}>
              Source instrument, device, or report
              <input
                value={measurementInstrument}
                onChange={(event) => setMeasurementInstrument(event.target.value)}
                maxLength={120}
                required
                placeholder={measurementModality === 'imaging' ? 'Name the radiology report or measurement source' : 'Name the external device or authorized assessment'}
                style={{ padding: '10px', borderRadius: '8px', background: '#030712', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
              />
            </label>

            {measurementModality === 'imaging' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {imagingFindings.map((finding, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px' }}>
                    <input
                      aria-label={`Imaging finding ${index + 1} name`}
                      value={finding.label}
                      onChange={(event) => setImagingFindings((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))}
                      maxLength={80}
                      required
                      placeholder="Finding name from report"
                      style={{ minWidth: 0, padding: '9px', borderRadius: '8px', background: '#030712', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
                    />
                    <input
                      aria-label={`Imaging finding ${index + 1} value`}
                      type="number"
                      step="any"
                      value={finding.value}
                      onChange={(event) => setImagingFindings((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))}
                      required
                      placeholder="Value"
                      style={{ minWidth: 0, padding: '9px', borderRadius: '8px', background: '#030712', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
                    />
                    <input
                      aria-label={`Imaging finding ${index + 1} unit`}
                      value={finding.unit}
                      onChange={(event) => setImagingFindings((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, unit: event.target.value } : item))}
                      maxLength={24}
                      required
                      placeholder="Unit"
                      style={{ minWidth: 0, padding: '9px', borderRadius: '8px', background: '#030712', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
                    />
                    {imagingFindings.length > 1 && (
                      <button
                        type="button"
                        className="btn-secondary"
                        aria-label={`Remove imaging finding ${index + 1}`}
                        onClick={() => setImagingFindings((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={imagingFindings.length >= 20}
                  onClick={() => setImagingFindings((items) => [...items, { label: '', value: '', unit: '' }])}
                  style={{ alignSelf: 'flex-start' }}
                >
                  Add report finding
                </button>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                  Do not upload MRI images or patient-identifying report text. Enter numeric values and units from the report only.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {measurementFields.map((field) => (
                  <label key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#cbd5e1', fontSize: '0.82rem' }}>
                    {field.label} ({field.unit})
                    <input
                      type="number"
                      step="any"
                      value={measurementValues[field.name] ?? ''}
                      onChange={(event) => setMeasurementValues((values) => ({ ...values, [field.name]: event.target.value }))}
                      style={{ padding: '9px', borderRadius: '8px', background: '#030712', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
                    />
                  </label>
                ))}
                <p style={{ gridColumn: '1 / -1', color: '#94a3b8', fontSize: '0.8rem' }}>
                  Enter only fields measured by the named source. At least one value is required. Cognitive scores are saved as entered and are not interpreted.
                </p>
              </div>
            )}

            {measurementError && <div role="alert" style={{ color: '#fda4af' }}>{measurementError}</div>}
            {measurementMessage && <div role="status" style={{ color: '#67e8f9' }}>{measurementMessage}</div>}

            <button
              type="submit"
              className="btn-primary"
              disabled={measurementSaving || !selectedPatient}
              style={{ alignSelf: 'flex-start' }}
            >
              {measurementSaving ? 'Saving measurement...' : 'Save unscored measurement'}
            </button>
          </form>

          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>Saved collected measurements</h3>
            {collectedMeasurements.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No clinician-entered measurements in this session.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {collectedMeasurements.map((item) => {
                  const capture = readMeasurementJson(item.rawDataJson);
                  const features = readMeasurementJson(item.featureVectorJson);
                  return (
                    <div key={item.id} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(15,23,42,0.65)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <strong style={{ textTransform: 'capitalize' }}>{item.modality}</strong>
                      <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}> · {capture?.instrument || 'Source not recorded'} · {new Date(item.createdAt).toLocaleString()}</span>
                      {capture && features ? (
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#cbd5e1', fontSize: '0.8rem', marginTop: '8px' }}>
                          {JSON.stringify(features.findings || features, null, 2)}
                        </pre>
                      ) : (
                        <p role="alert" style={{ color: '#fda4af', fontSize: '0.8rem', marginTop: '8px' }}>
                          Saved measurement details could not be displayed. Check the application logs.
                        </p>
                      )}
                      <div style={{ color: '#fbbf24', fontSize: '0.78rem' }}>Collected only — not analyzed or scored</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
