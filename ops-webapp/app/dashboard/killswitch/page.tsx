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

  useEffect(() => { api.getCenters().then(setCenters).catch(console.error); }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const activate = () => { setConfirming(true); setCountdown(10); };

  const confirm = async () => {
    try { setResult(await api.killSwitch(centerId, mode, officerToken)); }
    catch (e: unknown) { setResult({ error: e instanceof Error ? e.message : "Failed" }); }
    setConfirming(false); setCountdown(0);
  };

  const cancel = () => { setConfirming(false); setCountdown(0); };

  const selectedCenter = centers.find((c) => c.id === centerId);
  const validPhases = mode === "PRE_PRINT" ? ["SEALED", "QUORUM"] : ["PRINTING", "DISTRIBUTED"];
  const canActivate = selectedCenter && validPhases.includes(selectedCenter.phase);

  return (
    <div className="p-8 space-y-5  animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold">Kill Switch</h1>
        <p className="text-[12px] text-text-muted mt-0.5">Emergency stop — locks all terminals at a center</p>
      </div>

      <div className="bg-bg-card border border-red/20 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Center</label>
            <select value={centerId} onChange={(e) => setCenterId(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary transition-colors">
              {centers.map((c) => (<option key={c.id} value={c.id}>{c.id} — {c.name}</option>))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Mode</label>
            <div className="flex gap-1.5">
              {["PRE_PRINT", "POST_PRINT"].map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex-1 px-2 py-2 text-[11px] font-mono rounded-lg border transition-all ${
                    mode === m ? "bg-red-dim border-red/30 text-red" : "border-border text-text-muted"
                  }`}>
                  {m.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Officer Token</label>
          <input value={officerToken} onChange={(e) => setOfficerToken(e.target.value)}
            className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary transition-colors" />
        </div>

        {!canActivate && selectedCenter && (
          <p className="text-[11px] text-yellow bg-yellow-dim rounded-lg px-3 py-2">
            Center is {selectedCenter.phase.toLowerCase()} — mode requires {validPhases.join(" or ").toLowerCase()}
          </p>
        )}

        {confirming ? (
          <div className="space-y-3 text-center pt-2">
            <p className="text-4xl font-semibold font-mono text-red tabular-nums">{countdown}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">seconds until activation</p>
            <div className="flex gap-2 pt-2">
              <button onClick={confirm} disabled={countdown > 0}
                className="flex-1 py-2.5 bg-red text-white rounded-lg text-[12px] font-medium hover:opacity-90 transition-colors disabled:opacity-40">
                Confirm
              </button>
              <button onClick={cancel}
                className="px-4 py-2.5 border border-border rounded-lg text-[12px] font-medium text-text-secondary hover:bg-bg-hover transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button onClick={activate} disabled={!canActivate}
            className="w-full py-2.5 bg-red text-white rounded-lg text-[12px] font-medium hover:opacity-90 transition-colors disabled:opacity-20 disabled:cursor-not-allowed">
            Activate Kill Switch
          </button>
        )}
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
