"use client";

import { useState, useRef } from "react";
import { api } from "../../lib/api";

export default function PrinterFpPage() {
  const [centerId, setCenterId] = useState("MH-001");
  const [pressId, setPressId] = useState("PRESS-001");
  const [batchId, setBatchId] = useState("");
  const [timeWindow, setTimeWindow] = useState("09:00-11:00");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ batch_id: string; press_id: string; time_window: string; image_url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const embed = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const bid = batchId || `BATCH-${Date.now().toString(36).toUpperCase()}`;
      const params = new URLSearchParams({ center_id: centerId, press_id: pressId, batch_id: bid, time_window: timeWindow });
      const res = await fetch(`http://localhost:8000/api/v1/pipeline/watermark/printer-fp?${params}`, { method: "POST", body: fd });
      const data = await res.json();
      setResult({ batch_id: data.batch_id, press_id: data.press_id, time_window: data.time_window, image_url: data.image_url });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold">M5 — Printer Fingerprint</h1>
        <p className="text-[12px] text-text-muted mt-0.5">
          Invisible margin micro-pattern encoding press ID, batch, and time window
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Batch Configuration</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Center ID</label>
              <select value={centerId} onChange={(e) => setCenterId(e.target.value)}
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary transition-colors">
                <option value="MH-001">MH-001</option>
                <option value="RJ-042">RJ-042</option>
                <option value="DL-003">DL-003</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Press ID</label>
              <input value={pressId} onChange={(e) => setPressId(e.target.value)}
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Batch ID</label>
              <input value={batchId} onChange={(e) => setBatchId(e.target.value)} placeholder="Auto-generated"
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary placeholder:text-text-muted/40 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Print Window</label>
              <input value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)}
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary transition-colors" />
            </div>
          </div>

          <div className="pt-3 border-t border-border/50">
            <p className="text-[10px] text-text-muted mb-1">Encoded pattern</p>
            <p className="text-[12px] font-mono text-text-secondary bg-bg-primary rounded-lg px-3 py-2">
              {pressId} | {batchId || "AUTO"} | {timeWindow}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
            <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Paper Image</p>
            <div
              className="border border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent/30 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              {preview ? (
                <img src={preview} alt="Preview" className="max-h-[180px] mx-auto rounded-lg" />
              ) : (
                <div>
                  <p className="text-[13px] text-text-secondary">Drop printed paper image</p>
                  <p className="text-[11px] text-text-muted mt-1">Fingerprint embedded in bottom margin</p>
                </div>
              )}
            </div>

            <button onClick={embed} disabled={loading || !file}
              className="w-full px-4 py-2.5 bg-accent text-white rounded-lg text-[12px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-40">
              {loading ? "Embedding fingerprint..." : "Embed Fingerprint"}
            </button>
          </div>

          {result && (
            <div className="bg-green-dim border border-green/20 rounded-xl p-4 animate-fade-in">
              <p className="text-[10px] font-medium text-green uppercase tracking-wider mb-3">Fingerprint Embedded</p>
              <div className="flex gap-4">
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-text-muted">Press</p>
                    <p className="text-[13px] font-mono font-medium text-green">{result.press_id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted">Batch</p>
                    <p className="text-[13px] font-mono font-medium text-green">{result.batch_id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted">Window</p>
                    <p className="text-[13px] font-mono font-medium text-green">{result.time_window}</p>
                  </div>
                </div>
                <div className="w-[140px]">
                  <img src={`http://localhost:8000${result.image_url}`} alt="Fingerprinted"
                    className="w-full rounded-lg border border-green/20" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
