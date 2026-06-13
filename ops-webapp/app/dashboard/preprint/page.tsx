"use client";

import { useState, useEffect } from "react";
import { api } from "../../lib/api";

const PHASES = ["SEALED", "QUORUM", "DECRYPTED", "PRINTING", "DISTRIBUTED"];

export default function PreprintPage() {
  const [centerId, setCenterId] = useState("MH-001");
  const [centers, setCenters] = useState<{ id: string; name: string }[]>([]);
  const [phase, setPhase] = useState("SEALED");
  const [totpCode, setTotpCode] = useState("");
  const [currentTotp, setCurrentTotp] = useState("");
  const [countdown, setCountdown] = useState(90);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => { api.getCenters().then(setCenters); }, []);

  useEffect(() => {
    const interval = setInterval(() => setCountdown((p) => (p <= 1 ? 90 : p - 1)), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchState = async () => { const r = await api.getPreprintState(centerId); setPhase(r.phase); };
  const fetchTotp = async () => { const r = await api.getTotp(centerId); setCurrentTotp(r.totp_code); };

  const seal = async () => { const r = await api.sealPaper(centerId, "MOCK_PAPER_DATA"); setResult(r); fetchState(); };

  const unlock = async () => {
    try { const r = await api.unlockPaper(centerId, totpCode || currentTotp); setResult(r); fetchState(); }
    catch (e: unknown) { setResult({ error: e instanceof Error ? e.message : "Failed" }); }
  };

  const phaseIndex = PHASES.indexOf(phase);

  return (
    <div className="p-8 space-y-5 max-w-[900px] animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold">Pre-Print Protocol</h1>
        <p className="text-[12px] text-text-muted mt-0.5">Encrypted paper delivery with TOTP-based unlock</p>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Center</label>
            <select value={centerId} onChange={(e) => setCenterId(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary transition-colors">
              {centers.map((c) => (<option key={c.id} value={c.id}>{c.id} — {c.name}</option>))}
            </select>
          </div>
          <button onClick={fetchState} className="px-3 py-2 text-[11px] font-mono border border-border rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors">
            Refresh
          </button>
          <button onClick={fetchTotp} className="px-3 py-2 text-[11px] font-mono border border-border rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors">
            Get TOTP
          </button>
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5">
        <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-4">State Machine</p>
        <div className="flex items-center gap-1.5">
          {PHASES.map((p, i) => (
            <div key={p} className="flex items-center">
              <div className={`px-3 py-1.5 text-[11px] font-mono rounded-md transition-colors ${
                i <= phaseIndex ? "bg-accent text-white" : "bg-bg-primary text-text-muted border border-border"
              }`}>
                {p.toLowerCase()}
              </div>
              {i < PHASES.length - 1 && <span className="mx-1 text-text-muted/40 text-[10px]">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5 flex items-center gap-6">
        <div className="text-center">
          <p className="text-3xl font-semibold font-mono text-accent tabular-nums">{countdown}</p>
          <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">seconds</p>
        </div>
        {currentTotp && (
          <div className="flex-1 text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Current TOTP</p>
            <p className="text-xl font-mono font-semibold text-green tracking-widest">{currentTotp}</p>
          </div>
        )}
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
        <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Actions</p>
        <div className="flex items-center gap-3">
          <button onClick={seal} className="px-4 py-2 bg-accent text-white rounded-lg text-[12px] font-medium hover:bg-accent-hover transition-colors">
            Seal Paper
          </button>
          <div className="flex items-center gap-2">
            <input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="TOTP code"
              className="w-40 bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary placeholder:text-text-muted/50 transition-colors" />
            <button onClick={unlock} className="px-4 py-2 bg-green text-white rounded-lg text-[12px] font-medium hover:opacity-90 transition-colors">
              Unlock
            </button>
          </div>
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5">
        <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-3">CCTV Status</p>
        <div className="flex items-center gap-4">
          <div className="w-24 h-16 bg-bg-primary border border-border rounded-lg flex items-center justify-center">
            <span className="text-[10px] text-text-muted font-mono">FEED</span>
          </div>
          <div>
            <p className="text-[12px] text-text-primary">Printing Room — 2 staff present</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green pulse-dot"></span>
              <span className="text-[11px] text-green">Recording</span>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-3">Result</p>
          <pre className="text-[12px] font-mono text-green whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
