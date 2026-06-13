"use client";

import { useState, useEffect } from "react";
import { api } from "../../lib/api";

const PHASES = ["SEALED", "QUORUM", "DECRYPTED", "PRINTING", "DISTRIBUTED"];

export default function PreprintPage() {
  const [centerId, setCenterId] = useState("MH-001");
  const [centers, setCenters] = useState<{ id: string; name: string; phase: string }[]>([]);
  const [phase, setPhase] = useState("SEALED");
  const [totpCode, setTotpCode] = useState("");
  const [currentTotp, setCurrentTotp] = useState("");
  const [countdown, setCountdown] = useState(90);
  const [hashVerified, setHashVerified] = useState(false);
  const [result, setResult] = useState<{ status?: string; phase?: string; sha256_hash?: string; error?: string } | null>(null);

  useEffect(() => {
    api.getCenters().then((c) => {
      setCenters(c);
      const found = c.find((x: { id: string }) => x.id === centerId);
      if (found) setPhase(found.phase);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCountdown((p) => (p <= 1 ? 90 : p - 1)), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchState = async () => {
    const r = await api.getPreprintState(centerId);
    setPhase(r.phase);
  };

  const fetchTotp = async () => {
    const r = await api.getTotp(centerId);
    setCurrentTotp(r.totp_code);
  };

  const seal = async () => {
    const r = await api.sealPaper(centerId, "NEET2026-PAPER-DATA");
    setResult(r);
    setHashVerified(true);
    fetchState();
  };

  const unlock = async () => {
    try {
      const r = await api.unlockPaper(centerId, totpCode || currentTotp);
      setResult(r);
      fetchState();
    } catch (e: unknown) {
      setResult({ error: e instanceof Error ? e.message : "Failed" });
    }
  };

  const phaseIndex = PHASES.indexOf(phase);
  const selectedCenter = centers.find((c) => c.id === centerId);

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold">M4 — Pre-Print Protocol</h1>
        <p className="text-[12px] text-text-muted mt-0.5">
          Encrypted paper delivery — TOTP unlock → hash verify → print → seal
        </p>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5">
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Center</label>
            <select value={centerId} onChange={(e) => { setCenterId(e.target.value); fetchState(); }}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary transition-colors">
              {centers.map((c) => (
                <option key={c.id} value={c.id}>{c.id} — {c.name} [{c.phase.toLowerCase()}]</option>
              ))}
            </select>
          </div>
          <button onClick={fetchTotp}
            className="px-4 py-2 text-[11px] font-mono border border-border rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors">
            Refresh TOTP
          </button>
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5">
        <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-4">Protocol State</p>
        <div className="flex items-center gap-2">
          {PHASES.map((p, i) => (
            <div key={p} className="flex items-center">
              <div className={`px-4 py-2 rounded-lg text-[11px] font-mono transition-all ${
                i < phaseIndex ? "bg-accent/20 text-accent" :
                i === phaseIndex ? "bg-accent text-white" :
                "bg-bg-primary text-text-muted border border-border"
              }`}>
                {p.toLowerCase()}
              </div>
              {i < PHASES.length - 1 && (
                <span className={`mx-1.5 text-[10px] ${i < phaseIndex ? "text-accent" : "text-text-muted/30"}`}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-bg-card border border-border rounded-xl p-5 text-center">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">TOTP Window</p>
          <p className="text-3xl font-mono font-semibold text-accent tabular-nums">{countdown}s</p>
          {currentTotp && (
            <p className="text-[13px] font-mono text-green mt-2 tracking-widest">{currentTotp}</p>
          )}
        </div>
        <div className={`border rounded-xl p-5 text-center transition-colors ${hashVerified ? "bg-green-dim border-green/20" : "bg-bg-card border-border"}`}>
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">SHA-256 Hash</p>
          {hashVerified ? (
            <div>
              <p className="text-[20px] text-green">✓</p>
              <p className="text-[11px] text-green font-medium mt-1">Verified</p>
            </div>
          ) : (
            <div>
              <p className="text-[20px] text-text-muted/30">—</p>
              <p className="text-[11px] text-text-muted mt-1">Pending</p>
            </div>
          )}
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">CCTV Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green pulse-dot"></span>
            <span className="text-[12px] text-green">Recording</span>
          </div>
          <p className="text-[11px] text-text-muted mt-2">2 staff present</p>
          <p className="text-[11px] text-text-muted">No personal devices</p>
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
        <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Actions</p>
        <div className="flex items-center gap-3">
          <button onClick={seal}
            className="px-4 py-2.5 bg-accent text-white rounded-lg text-[12px] font-medium hover:bg-accent-hover transition-colors">
            Seal & Send to Center
          </button>
          <div className="flex items-center gap-2">
            <input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="Enter TOTP"
              className="w-44 bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary placeholder:text-text-muted/40 transition-colors" />
            <button onClick={unlock}
              className="px-4 py-2.5 bg-green text-white rounded-lg text-[12px] font-medium hover:opacity-90 transition-colors">
              Unlock Decryption
            </button>
          </div>
        </div>
      </div>

      {result && !result.error && (
        <div className="bg-green-dim border border-green/20 rounded-xl p-4 animate-fade-in">
          <p className="text-[10px] font-medium text-green uppercase tracking-wider mb-1">
            {result.status === "sealed" ? "Paper Sealed & Encrypted" : "Decryption Unlocked"}
          </p>
          <p className="text-[12px] text-text-secondary">
            {result.status === "sealed"
              ? `Encrypted package sent to center ${centerId}. SHA-256 hash: ${result.sha256_hash?.slice(0, 16)}...`
              : `Center ${centerId} authorized to print. Phase: ${result.phase}`}
          </p>
        </div>
      )}
      {result?.error && (
        <div className="bg-red-dim border border-red/20 rounded-xl p-4 animate-fade-in">
          <p className="text-[12px] text-red">{result.error}</p>
        </div>
      )}
    </div>
  );
}
