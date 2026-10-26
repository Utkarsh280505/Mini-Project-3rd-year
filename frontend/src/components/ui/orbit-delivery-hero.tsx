import React, { useState } from "react";
import NeuroBrain3D from "../NeuroBrain3D";
import { Brain, Activity, Sparkles, ShieldCheck, ArrowRight, Cpu, Zap, Eye } from "lucide-react";

export function OrbitDeliveryHero({ className = "", onStartAssessment, onOpenClinician }: any) {
  const [activeModality, setActiveModality] = useState("mri");

  return (
    <div className={`relative w-full min-h-[540px] bg-slate-950/90 rounded-3xl overflow-hidden border border-cyan-500/30 p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-xl ${className}`}>
      
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">
        
        {/* Left Column: Authoritative Platform Info & Live Controls */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-widest px-3.5 py-1.5 bg-cyan-950/70 border border-cyan-500/30 rounded-full mb-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>3D Spatial Biometric Telemetry Hub</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
              Interactive 3D Multimodal <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                Neural Biomarker Engine
              </span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              Simulate 360° volumetric brain tissue atrophy, track real-time acoustic vocal tremor jitter, and inspect explainable SHAP saliency maps directly inside the spatial 3D mesh.
            </p>
          </div>

          {/* Interactive Modality Selector */}
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
              <span>Select Telemetry Layer</span>
              <span className="text-cyan-400 text-[11px] font-mono">60 FPS Active</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "mri", label: "Volumetric MRI", icon: Brain, color: "text-cyan-400" },
                { id: "motor", label: "Motor Tremor", icon: Activity, color: "text-amber-400" },
                { id: "speech", label: "Speech Jitter", icon: Zap, color: "text-purple-400" }
              ].map((m) => {
                const Icon = m.icon;
                const isActive = activeModality === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveModality(m.id)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-[1.02]"
                        : "bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : m.color}`} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Telemetry Stats Row */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-medium">Render Latency</div>
              <div className="text-lg font-bold text-emerald-400 font-mono">12 ms</div>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-medium">Fusion Engine</div>
              <div className="text-lg font-bold text-cyan-400 font-mono">96.4% AUC</div>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <div className="text-[11px] text-slate-400 font-medium">Node Mesh</div>
              <div className="text-lg font-bold text-indigo-400 font-mono">650 Nodes</div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onStartAssessment}
              className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.03] transition-all cursor-pointer"
            >
              <span>Launch 3D Spatial Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenClinician}
              className="btn-secondary flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Clinician Telemetry Feed</span>
            </button>
          </div>
        </div>

        {/* Right Column: Embedded Interactive 3D Canvas Box */}
        <div className="lg:col-span-6 h-[440px] relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950/80 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]">
          <div className="absolute top-3 left-4 z-20 flex items-center gap-2 text-[11px] font-mono text-cyan-400 bg-slate-900/90 px-3 py-1 rounded-full border border-cyan-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>3D BRAIN MESH // ROTATE & CLICK LOBES</span>
          </div>

          <div className="w-full h-full pt-4">
            <NeuroBrain3D
              activeRiskScore={activeModality === 'mri' ? 0.74 : activeModality === 'motor' ? 0.52 : 0.38}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

export default OrbitDeliveryHero;
