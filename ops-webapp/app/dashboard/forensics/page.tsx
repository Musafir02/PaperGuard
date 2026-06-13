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
  const [traceTime, setTraceTime] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const decode = async () => {
    if (!file) return;
    setLoading(true);
    const start = performance.now();
    try {
      const res = await api.decodeImage(file);
      setResult(res);
      setTraceTime(Math.round(performance.now() - start));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-mono font-bold">Forensics — Decode</h1>
          <p className="text-muted text-sm mt-1">Upload a leaked image to extract watermark + printer fingerprint.</p>
        </div>
        {traceTime > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted uppercase tracking-wider">Trace Time</p>
            <p className="text-2xl font-mono font-bold text-accent">{traceTime}ms</p>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {file ? (
            <div>
              <p className="text-sm font-mono text-accent">{file.name}</p>
              <p className="text-xs text-muted mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <p className="text-muted text-sm">Drag & drop or click to upload</p>
          )}
          <button onClick={() => inputRef.current?.click()}
            className="mt-3 px-4 py-2 text-xs font-mono border border-border rounded hover:bg-white/5 transition-colors">
            Select Image
          </button>
        </div>

        <button onClick={decode} disabled={loading || !file}
          className="w-full px-4 py-3 bg-accent text-white rounded text-sm font-mono hover:bg-accent-hover transition-colors disabled:opacity-50">
          {loading ? "Decoding..." : "Decode Watermark & Fingerprint"}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className={`bg-card border rounded-lg p-4 ${result.watermark.decoded ? "border-green" : "border-border"}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted uppercase tracking-wider">Watermark Decode</p>
              <span className={`text-sm font-mono font-bold ${result.watermark.decoded ? "text-green" : "text-red"}`}>
                {result.watermark.decoded ? "MATCH FOUND" : "NO MATCH"}
              </span>
            </div>
            {result.watermark.decoded && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted">Roll Number</p>
                  <p className="text-lg font-mono font-bold text-accent">{result.watermark.roll_no || result.watermark.data}</p>
                </div>
                {result.watermark.center_id && (
                  <div>
                    <p className="text-xs text-muted">Center ID</p>
                    <p className="text-lg font-mono font-bold">{result.watermark.center_id}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={`bg-card border rounded-lg p-4 ${result.fingerprint.decoded ? "border-green" : "border-border"}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted uppercase tracking-wider">Printer Fingerprint</p>
              <span className={`text-sm font-mono font-bold ${result.fingerprint.decoded ? "text-green" : "text-red"}`}>
                {result.fingerprint.decoded ? "DECODED" : "NO MATCH"}
              </span>
            </div>
            {result.fingerprint.decoded && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted">Press ID</p>
                  <p className="text-sm font-mono font-bold">{result.fingerprint.press_id || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Batch ID</p>
                  <p className="text-sm font-mono font-bold">{result.fingerprint.batch_id || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Time Window</p>
                  <p className="text-sm font-mono font-bold">{result.fingerprint.time_window || "—"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
