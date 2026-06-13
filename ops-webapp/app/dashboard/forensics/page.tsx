"use client";

import { useState, useRef } from "react";
import { api } from "../../lib/api";

interface DecodeResult {
  watermark: { decoded: boolean; data: string; roll_no?: string; center_id?: string };
  fingerprint: { decoded: boolean; data: string; press_id?: string; batch_id?: string; time_window?: string };
}

export default function ForensicsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [traceTime, setTraceTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const decode = async () => {
    if (!file) return;
    setLoading(true);
    const start = performance.now();
    try { setResult(await api.decodeImage(file)); setTraceTime(Math.round(performance.now() - start)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-8 space-y-5  animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">Forensics</h1>
          <p className="text-[12px] text-text-muted mt-0.5">Upload leaked image to extract watermark and fingerprint</p>
        </div>
        {traceTime > 0 && (
          <div className="text-right">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Trace Time</p>
            <p className="text-xl font-semibold font-mono text-accent">{traceTime}<span className="text-[11px] text-text-muted font-normal">ms</span></p>
          </div>
        )}
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
        <div
          className="border border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-accent/30 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {file ? (
            <div>
              <p className="text-[13px] font-mono text-accent">{file.name}</p>
              <p className="text-[11px] text-text-muted mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <div className="w-10 h-10 rounded-lg bg-bg-primary border border-border flex items-center justify-center mx-auto mb-3">
                <span className="text-text-muted text-lg">↑</span>
              </div>
              <p className="text-[13px] text-text-secondary">Drop image here or click to browse</p>
              <p className="text-[11px] text-text-muted mt-1">JPEG, PNG — max 25 MB</p>
            </div>
          )}
        </div>

        <button onClick={decode} disabled={loading || !file}
          className="w-full py-2.5 bg-accent text-white rounded-lg text-[12px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-40">
          {loading ? "Decoding..." : "Decode Watermark & Fingerprint"}
        </button>
      </div>

      {result && (
        <div className="space-y-3 animate-fade-in">
          <div className={`bg-bg-card border rounded-xl p-5 ${result.watermark.decoded ? "border-green/30" : "border-border"}`}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Watermark</p>
              <span className={`text-[12px] font-mono font-semibold ${result.watermark.decoded ? "text-green" : "text-text-muted"}`}>
                {result.watermark.decoded ? "MATCH FOUND" : "NO MATCH"}
              </span>
            </div>
            {result.watermark.decoded && (
              <div className="flex gap-8">
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Roll Number</p>
                  <p className="text-base font-mono font-semibold text-accent">{result.watermark.roll_no || result.watermark.data}</p>
                </div>
                {result.watermark.center_id && (
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Center</p>
                    <p className="text-base font-mono font-semibold">{result.watermark.center_id}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={`bg-bg-card border rounded-xl p-5 ${result.fingerprint.decoded ? "border-green/30" : "border-border"}`}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Printer Fingerprint</p>
              <span className={`text-[12px] font-mono font-semibold ${result.fingerprint.decoded ? "text-green" : "text-text-muted"}`}>
                {result.fingerprint.decoded ? "DECODED" : "NO MATCH"}
              </span>
            </div>
            {result.fingerprint.decoded && (
              <div className="flex gap-8">
                {[
                  { label: "Press", value: result.fingerprint.press_id },
                  { label: "Batch", value: result.fingerprint.batch_id },
                  { label: "Window", value: result.fingerprint.time_window },
                ].filter(f => f.value).map((f) => (
                  <div key={f.label}>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">{f.label}</p>
                    <p className="text-[13px] font-mono font-medium">{f.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
