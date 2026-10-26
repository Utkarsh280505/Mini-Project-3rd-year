import React, { useEffect, useRef, useState } from 'react';
import { RotateCw, Zap, ShieldAlert, Cpu } from 'lucide-react';

const BRAIN_LOBES = [
  { id: 'frontal', name: 'Frontal Lobe', function: 'Executive Control & Motor', risk: 'Elevated Atrophy (34%)', color: '#f59e0b', coords: [0, 45, 30] },
  { id: 'temporal', name: 'Temporal Lobe', function: 'Memory & Hippocampus', risk: 'High Risk / Ventricle Exp.', color: '#f43f5e', coords: [-40, -10, 0] },
  { id: 'parietal', name: 'Parietal Lobe', function: 'Sensory Integration', risk: 'Normal Baseline', color: '#10b981', coords: [0, -35, 45] },
  { id: 'occipital', name: 'Occipital Lobe', function: 'Visual Processing', risk: 'Normal Baseline', color: '#06b6d4', coords: [0, -70, 0] },
  { id: 'cerebellum', name: 'Cerebellum', function: 'Motor Coordination & Balance', risk: 'Mild Gait Variance', color: '#8b5cf6', coords: [0, -60, -45] },
];

export default function NeuroBrain3D({ activeRiskScore = 0.68, onSelectLobe }) {
  const canvasRef = useRef(null);
  const [selectedLobe, setSelectedLobe] = useState(BRAIN_LOBES[1]); // Temporal Lobe default
  const [rotation, setRotation] = useState({ rx: 0.2, ry: 0.5 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.clientWidth || 360);
    let height = (canvas.height = canvas.parentElement.clientHeight || 340);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Generate 3D Brain Point Cloud Points
    const points = [];
    const numPoints = 650;

    for (let i = 0; i < numPoints; i++) {
      // Approximate 3D ellipsoid brain hemisphere shapes
      const u = Math.random() * Math.PI * 2;
      const v = (Math.random() - 0.5) * Math.PI;

      // Brain dual-hemisphere offset
      const side = Math.random() > 0.5 ? 1 : -1;
      const rx = 100 + Math.sin(v * 3) * 12;
      const ry = 75 + Math.cos(u * 2) * 10;
      const rz = 90 + Math.sin(u) * 15;

      let x = rx * Math.cos(v) * Math.cos(u) * 0.9;
      let y = ry * Math.sin(v);
      let z = rz * Math.cos(v) * Math.sin(u);

      // Add central sulcus and fissure curve
      x += side * 14;

      // Determine lobe association
      let lobeId = 'temporal';
      if (y > 25) lobeId = 'frontal';
      else if (z > 25) lobeId = 'parietal';
      else if (z < -30 && y > -20) lobeId = 'occipital';
      else if (y < -25) lobeId = 'cerebellum';

      points.push({
        x, y, z,
        baseX: x, baseY: y, baseZ: z,
        lobeId,
        size: Math.random() * 2 + 1.2,
        pulse: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.03 + 0.01,
      });
    }

    let angleY = rotation.ry;
    let angleX = rotation.rx;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Automatic smooth rotational tilt
      if (!isDragging.current) {
        angleY += 0.005;
      } else {
        angleY = rotation.ry;
        angleX = rotation.rx;
      }

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const centerX = width / 2;
      const centerY = height / 2 + 10;

      const projectedPoints = [];

      // Project 3D to 2D
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.pulse += p.speed;

        // 3D Rotation Matrix around Y and X
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        let y1 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        // Perspective Projection
        const fov = 300;
        const scale = fov / (fov + z2);
        const x2D = centerX + x1 * scale;
        const y2D = centerY - y1 * scale;

        projectedPoints.push({
          x: x2D,
          y: y2D,
          z: z2,
          scale,
          lobeId: p.lobeId,
          pulse: p.pulse,
          size: p.size * scale,
        });
      }

      // Sort points by Z for proper depth sorting
      projectedPoints.sort((a, b) => b.z - a.z);

      // Draw axon synaptic connections between nearby points
      for (let i = 0; i < projectedPoints.length; i += 4) {
        const p1 = projectedPoints[i];
        for (let j = i + 1; j < Math.min(i + 5, projectedPoints.length); j++) {
          const p2 = projectedPoints[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 40) {
            const isSelected = selectedLobe?.id === p1.lobeId;
            const strokeColor = isSelected
              ? 'rgba(244, 63, 94, 0.45)'
              : p1.lobeId === 'temporal'
              ? 'rgba(244, 63, 94, 0.25)'
              : 'rgba(6, 182, 212, 0.18)';

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = isSelected ? 1.2 : 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw 3D Point Cloud Nodes
      for (let i = 0; i < projectedPoints.length; i++) {
        const p = projectedPoints[i];
        const isSelected = selectedLobe?.id === p.lobeId;

        const glow = Math.sin(p.pulse) * 0.5 + 0.5;
        const radius = Math.max(0.8, p.size * (isSelected ? 1.4 : 1.0));

        let color = '#06b6d4';
        if (p.lobeId === 'temporal') color = '#f43f5e';
        else if (p.lobeId === 'frontal') color = '#f59e0b';
        else if (p.lobeId === 'cerebellum') color = '#8b5cf6';
        else if (p.lobeId === 'parietal') color = '#10b981';

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = Math.min(1, Math.max(0.2, (p.scale - 0.5) * 1.5)) * (isSelected ? 1 : 0.7);
        if (isSelected || p.lobeId === 'temporal') {
          ctx.shadowBlur = 8 * glow;
          ctx.shadowColor = color;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [rotation, selectedLobe]);

  // Drag interaction handlers
  const handleMouseDown = (e) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;

    setRotation((prev) => ({
      rx: Math.max(-1.2, Math.min(1.2, prev.rx + dy * 0.008)),
      ry: prev.ry + dx * 0.008,
    }));

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleLobeSelect = (lobe) => {
    setSelectedLobe(lobe);
    if (onSelectLobe) onSelectLobe(lobe);
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="#06b6d4" />
            3D Holographic Neural Mesh
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Interactive 3D particle brain scan • Drag to rotate 360°
          </p>
        </div>

        <button
          onClick={() => setRotation({ rx: 0.2, ry: 0.5 })}
          className="btn-secondary"
          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
          title="Reset 3D Camera View"
        >
          <RotateCw size={12} /> Reset 3D
        </button>
      </div>

      {/* 3D Canvas Area */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          flex: 1,
          minHeight: '260px',
          position: 'relative',
          cursor: isDragging.current ? 'grabbing' : 'grab',
          background: 'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.08) 0%, rgba(3,7,18,0.6) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          overflow: 'hidden',
        }}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

        {/* Live Signal Pulse Overlay */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="badge badge-high" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>
            <Zap size={10} /> Active Axon Firing
          </span>
        </div>

        {/* Selected Lobe Floating Badge */}
        {selectedLobe && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${selectedLobe.color}`,
              padding: '8px 14px',
              borderRadius: '10px',
              boxShadow: `0 0 16px ${selectedLobe.color}33`,
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
              {selectedLobe.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: selectedLobe.color, fontWeight: 600 }}>
              {selectedLobe.risk}
            </div>
          </div>
        )}
      </div>

      {/* Brain Lobe Selector Chips */}
      <div style={{ display: 'flex', gap: '6px', marginTop: '14px', flexWrap: 'wrap' }}>
        {BRAIN_LOBES.map((lobe) => {
          const isSelected = selectedLobe?.id === lobe.id;
          return (
            <button
              key={lobe.id}
              onClick={() => handleLobeSelect(lobe)}
              style={{
                background: isSelected ? lobe.color : 'rgba(255, 255, 255, 0.04)',
                color: isSelected ? '#ffffff' : '#94a3b8',
                border: isSelected ? `1px solid ${lobe.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '5px 10px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {lobe.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
