/**
 * reportExporter.js
 * Utility to generate and print a formal clinical PDF report for NeuroEarly AI assessment sessions.
 */

export function exportClinicalReport({ patientName, patientAge, patientGender, sessionDate, riskReport }) {
  if (!riskReport) return;

  const hasScore = Number.isFinite(riskReport.fusedRiskScore);
  const scorePct = hasScore ? `${(riskReport.fusedRiskScore * 100).toFixed(0)}%` : 'Not generated';
  const confidenceLow = Number.isFinite(riskReport.confidenceIntervalLow)
    ? `${(riskReport.confidenceIntervalLow * 100).toFixed(0)}%`
    : 'Not available';
  const confidenceHigh = Number.isFinite(riskReport.confidenceIntervalHigh)
    ? `${(riskReport.confidenceIntervalHigh * 100).toFixed(0)}%`
    : 'Not available';
  const modalitySources = riskReport.modalitySources || {};
  const hasSimulatedInput = Object.values(modalitySources).includes('simulated');
  const modalities = ['imaging', 'speech', 'motor', 'ocular', 'cognitive'];

  let modalityScores = {};
  let topFeatures = [];
  try {
    if (riskReport.modalityScoresJson) modalityScores = JSON.parse(riskReport.modalityScoresJson);
    else if (riskReport.modalityScores) modalityScores = riskReport.modalityScores;

    if (riskReport.topContributingFeaturesJson) topFeatures = JSON.parse(riskReport.topContributingFeaturesJson);
    else if (riskReport.topContributingFeatures) topFeatures = riskReport.topContributingFeatures;
  } catch (e) {
    console.error('Error parsing report JSON:', e);
  }

  const mmseEstimate = hasScore
    ? (riskReport.mmseEstimate || Math.round(30 - riskReport.fusedRiskScore * 10))
    : null;
  const mocaEstimate = hasScore ? Math.max(10, mmseEstimate - 2) : null;

  const reportHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>NeuroEarly AI - Clinical Assessment Report</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=Orbitron:wght@700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 40px;
          background: #fff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #06b6d4;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-family: 'Orbitron', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #030712;
        }
        .subtitle {
          color: #06b6d4;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .patient-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 30px;
        }
        .meta-item {
          display: flex;
          flex-direction: column;
        }
        .meta-label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 700;
        }
        .meta-val {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 4px;
        }
        .score-banner {
          background: ${hasScore && riskReport.fusedRiskScore > 0.6 ? '#fff1f2' : '#f0fdf4'};
          border: 2px solid ${hasScore && riskReport.fusedRiskScore > 0.6 ? '#f43f5e' : '#10b981'};
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .score-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: ${hasScore && riskReport.fusedRiskScore > 0.6 ? '#f43f5e' : '#64748b'};
          color: #fff;
          font-family: 'Orbitron', sans-serif;
          font-size: 26px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .band-title {
          font-size: 20px;
          font-weight: 800;
          color: ${hasScore && riskReport.fusedRiskScore > 0.6 ? '#be123c' : '#15803d'};
          text-transform: capitalize;
        }
        .section-title {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 8px;
          margin-bottom: 16px;
          margin-top: 28px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        th {
          background: #f1f5f9;
          text-align: left;
          padding: 10px 14px;
          font-size: 12px;
          color: #475569;
          font-weight: 700;
        }
        td {
          padding: 10px 14px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
          color: #1e293b;
        }
        .footer {
          margin-top: 50px;
          border-top: 1px dashed #cbd5e1;
          padding-top: 20px;
          display: flex;
          justify-content: space-between;
          color: #64748b;
          font-size: 11px;
        }
        .signature-box {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
        }
        .sig-line {
          width: 220px;
          border-top: 1px solid #0f172a;
          padding-top: 6px;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">NeuroEarly AI</div>
          <div class="subtitle">Multi-Modal Neurological Risk Screening Report</div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #64748b;">
          <strong>Report ID:</strong> RPT-${Math.floor(100000 + Math.random() * 900000)}<br>
          <strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
      </div>

      <div class="patient-card">
        <div class="meta-item">
          <span class="meta-label">Patient Name</span>
          <span class="meta-val">${patientName || 'Anonymous Patient'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Age / Gender</span>
          <span class="meta-val">${patientAge || 68} y / ${patientGender || 'Female'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Session Date</span>
          <span class="meta-val">${sessionDate || new Date().toLocaleDateString()}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Status</span>
          <span class="meta-val" style="color: #06b6d4;">Clinical Screening</span>
        </div>
      </div>

      ${!hasScore ? `
        <div class="score-banner" style="display: block; color: #92400e; background: #fffbeb; border-color: #f59e0b;">
          <strong>${hasSimulatedInput ? 'DEMO MODE' : 'NO SCORE GENERATED'} - No screening score available</strong>
          <p>Simulated and missing inputs are excluded. No measured modality data was available for scoring.</p>
        </div>
      ` : `
        <div class="score-banner">
          <div>
            <div class="band-title">${riskReport.riskBand || 'Screening Complete'}</div>
            <div style="font-size: 13px; color: #475569; margin-top: 4px;">
              Fused Confidence Interval: <strong>${confidenceLow} – ${confidenceHigh}</strong>
            </div>
          </div>
          <div class="score-circle">${scorePct}</div>
        </div>

        <div class="section-title">Clinical Scale Mappings</div>
        <table>
          <thead>
            <tr>
              <th>Clinical Scale</th>
              <th>Estimated Score Range</th>
              <th>Clinical Interpretation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>MMSE (Mini-Mental State Exam)</strong></td>
              <td><strong>${mmseEstimate} / 30</strong></td>
              <td>${mmseEstimate >= 24 ? 'Normal cognitive baseline' : 'Mild cognitive impairment indication'}</td>
            </tr>
            <tr>
              <td><strong>MoCA (Montreal Cognitive Assessment)</strong></td>
              <td><strong>${mocaEstimate} / 30</strong></td>
              <td>${mocaEstimate >= 22 ? 'Normal orientation & executive score' : 'Early executive / memory variation'}</td>
            </tr>
          </tbody>
        </table>
      `}

      <div class="section-title">Per-Modality Risk Scores</div>
      <table>
        <thead>
          <tr>
            <th>Modality</th>
            <th>Calculated Risk Index</th>
            <th>Signal Status</th>
          </tr>
        </thead>
        <tbody>
          ${modalities.map((mod) => {
            const source = modalitySources[mod] || 'not_provided';
            const hasModalityScore = source === 'measured' && Number.isFinite(modalityScores[mod]);
            const score = modalityScores[mod];
            return `
            <tr>
              <td style="text-transform: capitalize;"><strong>${mod}</strong></td>
              <td><strong>${hasModalityScore ? `${(score * 100).toFixed(1)}%` : '—'}</strong></td>
              <td style="font-weight: 700;">${source.replace('_', ' ')}</td>
            </tr>
          `}).join('')}
        </tbody>
      </table>

      ${topFeatures && topFeatures.length > 0 ? `
        <div class="section-title">Top Contributing Biomarkers (AI Explainability)</div>
        <table>
          <thead>
            <tr>
              <th>Biomarker Feature</th>
              <th>Feature Importance Weight</th>
              <th>Observed Value</th>
            </tr>
          </thead>
          <tbody>
            ${topFeatures.map(f => `
              <tr>
                <td><strong>${f.feature}</strong></td>
                <td>${(f.importance * 100).toFixed(1)}%</td>
                <td>${f.value}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <div class="signature-box">
        <div>
          <p style="font-size: 11px; color: #64748b; max-width: 320px;">
            * This research prototype is not a validated diagnostic tool and does not replace specialist clinical assessment. Synthetic demo inputs must not be interpreted as patient findings.
          </p>
        </div>
        <div>
          <div style="height: 40px;"></div>
          <div class="sig-line">Reviewing Clinician Signature</div>
        </div>
      </div>

      <div class="footer">
        <span>NeuroEarly AI Screening Platform v1.0</span>
        <span>Confidential Medical Information</span>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(reportHTML);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
}
