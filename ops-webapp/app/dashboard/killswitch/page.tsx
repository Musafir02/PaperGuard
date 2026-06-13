"use client";

import { useState, useEffect } from "react";
import { api } from "../../lib/api";

export default function KillSwitchPage() {
  const [centerId, setCenterId] = useState("MH-001");
  const [centers, setCenters] = useState<{ id: string; name: string; phase: string }[]>([]);
  const [mode, setMode] = useState("PRE_PRINT");
  const [officerToken, setOfficerToken] = useState("NTA-OFFICER-2026");
  const [countdown, setCountdown] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.getCenters().then(setCenters).catch(console.error);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const activate = () => {
    setConfirming(true);
    setCountdown(10);
  };

  const confirm = async () => {
    try {
      const res = await api.killSwitch(centerId, mode, officerToken);
      setResult(res);
    } catch (e: unknown) {
      setResult({ error: e instanceof Error ? e.message : "Failed" });
    }
    setConfirming(false);
    setCountdown(0);
  };

  const cancel = () => {
    setConfirming(false);
    setCountdown(0);
  };

  const selectedCenter = centers.find((c) => c.id === centerId);
  const validPhases = mode === "PRE_PRINT" ? ["SEALED", "QUORUM"] : ["PRINTING", "DISTRIBUTED"];
  const canActivate = selectedCenter && validPhases.includes(selectedCenter.phase);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-mono font-bold">M9 — Kill Switch</h1>
      <p className="text-muted text-sm">Emergency stop. Locks all terminals at a center. Requires officer token + confirmation.</p>

      <div className="bg-card border border-red/30 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted uppercase tracking-wider block mb-1">Center</label>
            <select value={centerId} onChange={(e) => setCenterId(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent">
              {centers.map((c) => (
                <option key={c.id} value={c.id}>{c.id} — {c.name} [{c.phase}]</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider block mb-1">Mode</label>
            <div className="flex gap-2">
              {["PRE_PRINT", "POST_PRINT"].map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex-1 px-3 py-2 text-xs font-mono rounded border transition-colors ${
                    mode === m ? "bg-red/10 border-red text-red" : "border-border text-muted"
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted uppercase tracking-wider block mb-1">Officer Token</label>
          <input value={officerToken} onChange={(e) => setOfficerToken(e.target.value)}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent" />
        </div>

        {!canActivate && selectedCenter && (
          <p className="text-xs text-yellow">
            Center {centerId} is in {selectedCenter.phase} phase. Mode {mode} requires: {validPhases.join(" or ")}
          </p>
        )}

        {confirming ? (
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-3xl font-mono font-bold text-red">{countdown}</p>
              <p className="text-xs text-muted mt-1">seconds until activation</p>
            </div>
            <div className="flex gap-3">
              <button onClick={confirm} disabled={countdown > 0}
                className="flex-1 px-4 py-3 bg-red text-white rounded text-sm font-mono hover:opacity-90 transition-colors disabled:opacity-50">
                Confirm Kill Switch
              </button>
              <button onClick={cancel}
                className="px-4 py-3 border border-border rounded text-sm font-mono hover:bg-white/5 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={activate} disabled={!canActivate}
            className="w-full px-4 py-3 bg-red text-white rounded text-sm font-mono hover:opacity-90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            Activate Kill Switch
          </button>
        )}
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
