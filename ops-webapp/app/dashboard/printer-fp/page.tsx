"use client";

import { useState, useRef } from "react";
import { api } from "../../lib/api";

export default function PrinterFpPage() {
  const [centerId, setCenterId] = useState("MH-001");
  const [pressId, setPressId] = useState("PRESS-001");
  const [batchId, setBatchId] = useState("BATCH-A1");
  const [timeWindow, setTimeWindow] = useState("09:00-11:00");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const embed = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const params = new URLSearchParams({ center_id: centerId, press_id: pressId, batch_id: batchId, time_window: timeWindow });
      const res = await fetch(`http://localhost:8000/api/v1/pipeline/watermark/printer-fp?${params}`, { method: "POST", body: fd });
      const data = await res.json();
      setResult(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-mono font-bold">M5 — Printer Fingerprint</h1>
      <p className="text-muted text-sm">Embed invisible margin micro-pattern with batch ID, press, and time window.</p>

      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted uppercase tracking-wider block mb-1">Center ID</label>
            <input value={centerId} onChange={(e) => setCenterId(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider block mb-1">Press ID</label>
            <input value={pressId} onChange={(e) => setPressId(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider block mb-1">Batch ID</label>
            <input value={batchId} onChange={(e) => setBatchId(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider block mb-1">Time Window</label>
            <input value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent" />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted uppercase tracking-wider block mb-1">Paper Image</label>
          <input ref={inputRef} type="file" accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-accent file:text-white file:cursor-pointer" />
        </div>

        <button onClick={embed} disabled={loading || !file}
          className="px-4 py-2 bg-accent text-white rounded text-sm font-mono hover:bg-accent-hover transition-colors disabled:opacity-50">
          {loading ? "Embedding..." : "Embed Fingerprint"}
        </button>
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
