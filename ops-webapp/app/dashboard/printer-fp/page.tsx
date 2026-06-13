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
      setResult(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-8 space-y-5  animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold">Printer Fingerprint</h1>
        <p className="text-[12px] text-text-muted mt-0.5">Invisible margin micro-pattern with batch ID</p>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Center ID", value: centerId, set: setCenterId },
            { label: "Press ID", value: pressId, set: setPressId },
            { label: "Batch ID", value: batchId, set: setBatchId },
            { label: "Time Window", value: timeWindow, set: setTimeWindow },
          ].map((f) => (
            <div key={f.label} className="space-y-1.5">
              <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">{f.label}</label>
              <input value={f.value} onChange={(e) => f.set(e.target.value)}
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary transition-colors" />
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Paper Image</label>
          <div className="border border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent/30 transition-colors"
            onClick={() => inputRef.current?.click()}>
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file ? <p className="text-[12px] font-mono text-accent">{file.name}</p> :
              <p className="text-[12px] text-text-muted">Click to select image</p>}
          </div>
        </div>

        <button onClick={embed} disabled={loading || !file}
          className="px-4 py-2 bg-accent text-white rounded-lg text-[12px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-40">
          {loading ? "Embedding..." : "Embed Fingerprint"}
        </button>
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
