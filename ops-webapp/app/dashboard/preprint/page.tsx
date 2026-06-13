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

  useEffect(() => {
    api.getCenters().then((c) => setCenters(c));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 90 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchState = async () => {
    const res = await api.getPreprintState(centerId);
    setPhase(res.phase);
  };

  const fetchTotp = async () => {
    const res = await api.getTotp(centerId);
    setCurrentTotp(res.totp_code);
  };

  const seal = async () => {
    const res = await api.sealPaper(centerId, "MOCK_PAPER_DATA");
    setResult(res);
    fetchState();
  };

  const unlock = async () => {
    try {
      const res = await api.unlockPaper(centerId, totpCode || currentTotp);
      setResult(res);
      fetchState();
    } catch (e: unknown) {
      setResult({ error: e instanceof Error ? e.message : "Failed" });
    }
  };

  const phaseIndex = PHASES.indexOf(phase);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-mono font-bold">M4 — Pre-Print Protocol</h1>
      <p className="text-muted text-sm">Encrypted paper delivery with TOTP-based unlock at center.</p>

      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div>
          <label className="text-xs text-muted uppercase tracking-wider block mb-1">Center</label>
          <select
            value={centerId}
            onChange={(e) => setCenterId(e.target.value)}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
          >
            {centers.map((c) => (
              <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={fetchState} className="px-3 py-1 text-xs font-mono border border-border rounded hover:bg-white/5">
            Refresh State
          </button>
          <button onClick={fetchTotp} className="px-3 py-1 text-xs font-mono border border-border rounded hover:bg-white/5">
            Get Current TOTP
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-xs text-muted uppercase tracking-wider mb-4">State Machine</p>
        <div className="flex items-center gap-1">
          {PHASES.map((p, i) => (
            <div key={p} className="flex items-center">
              <div
                className={`px-3 py-2 text-xs font-mono rounded ${
                  i <= phaseIndex ? "bg-accent text-white" : "bg-border/50 text-muted"
                }`}
              >
                {p}
              </div>
              {i < PHASES.length - 1 && <span className="mx-1 text-muted">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-xs text-muted uppercase tracking-wider mb-3">TOTP Countdown</p>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-mono font-bold text-accent">{countdown}s</div>
          {currentTotp && (
            <div className="text-lg font-mono text-green">{currentTotp}</div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <p className="text-xs text-muted uppercase tracking-wider">Actions</p>
        <div className="flex gap-3">
          <button onClick={seal}
            className="px-4 py-2 bg-accent text-white rounded text-sm font-mono hover:bg-accent-hover transition-colors">
            Seal Paper
          </button>
          <div className="flex items-center gap-2">
            <input
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="Enter TOTP or auto-fill"
              className="bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent w-48"
            />
            <button onClick={unlock}
              className="px-4 py-2 bg-green text-white rounded text-sm font-mono hover:opacity-90 transition-colors">
              Unlock
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-xs text-muted uppercase tracking-wider mb-2">Mock CCTV</p>
        <div className="flex items-center gap-3">
          <div className="w-32 h-20 bg-border/30 rounded flex items-center justify-center text-muted text-xs">
            FEED OFFLINE
          </div>
          <div>
            <p className="text-sm">Printing Room: 2 staff present</p>
            <p className="text-xs text-green flex items-center gap-1 mt-1">
              <span className="inline-block w-1.5 h-1.5 bg-green rounded-full"></span>
              Recording Active
            </p>
          </div>
        </div>
      </div>

      {result && (
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted uppercase tracking-wider mb-2">Result</p>
          <pre className="text-sm font-mono text-green overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
