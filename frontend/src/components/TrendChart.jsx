import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

export default function TrendChart({ timeline = [] }) {
  // Format data for chart
  const data = timeline.map(item => ({
    date: item.formattedDate || new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    RiskScore: Math.round((item.fusedRiskScore || 0) * 100),
    MMSE: item.mmseEstimate || 30
  }));

  if (data.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
        <TrendingUp size={28} style={{ marginBottom: '8px', opacity: 0.5 }} />
        <p style={{ fontSize: '0.85rem' }}>No historical trend assessments recorded yet</p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#14b8a6" />
            Longitudinal Risk Trajectory
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Progression of fused AI risk scores across historical screening sessions
          </p>
        </div>
      </div>

      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: '#121a2f',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px'
              }}
            />
            <Line
              type="monotone"
              dataKey="RiskScore"
              name="Fused Risk Score (%)"
              stroke="#f43f5e"
              strokeWidth={3}
              dot={{ r: 5, fill: '#f43f5e' }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
