"use client";

import { useState, useRef } from "react";
import { api } from "../../lib/api";

interface DecodeResult {
  watermark: { decoded: boolean; roll_no?: string; center_id?: string; data?: string };
  fingerprint: { decoded: boolean; press_id?: string; batch_id?: string; time_window?: string };
}

export default function ForensicsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [traceTime, setTraceTime] = useState(0);
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

  const decode = async () => {
    if (!file) return;
    setLoading(true);
    const start = performance.now();
    try {
      setResult(await api.decodeImage(file));
      setTraceTime(Math.round(performance.now() - start));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const matched = result?.watermark?.decoded || result?.fingerprint?.decoded;

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">Forensics</h1>
          <p className="text-[12px] text-text-muted mt-0.5">
            Upload suspect image — decode watermark + printer fingerprint to trace source
          </p>
        </div>
        {traceTime > 0 && (
          <div className="bg-bg-card border border-border rounded-xl px-4 py-3 text-center">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Trace Time</p>
            <p className="text-xl font-semibold font-mono text-accent">
              {(traceTime / 1000).toFixed(1)}<span className="text-[11px] text-text-muted font-normal">s</span>
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-5">
        <div className="space-y-4">
          <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
            <div
              className="border border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-accent/30 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              {preview ? (
                <img src={preview} alt="Suspect image" className="max-h-[280px] mx-auto rounded-lg" />
              ) : (
                <div>
                  <div className="w-12 h-12 rounded-xl bg-bg-primary border border-border flex items-center justify-center mx-auto mb-3">
                    <span className="text-text-muted text-xl">↑</span>
                  </div>
                  <p className="text-[13px] text-text-secondary">Drop suspect image here or click to browse</p>
                  <p className="text-[11px] text-text-muted mt-1">JPEG, PNG — photo of leaked paper, screenshot, etc.</p>
                </div>
              )}
            </div>

            <button
              onClick={decode}
              disabled={loading || !file}
              className="w-full py-2.5 bg-accent text-white rounded-lg text-[12px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-40"
            >
              {loading ? "Decoding..." : "Decode Watermark & Fingerprint"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`border rounded-xl p-5 transition-colors ${
            result?.watermark?.decoded ? "bg-green-dim border-green/20" : "bg-bg-card border-border"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Watermark</p>
              {result && (
                <span className={`text-[11px] font-mono font-semibold ${
                  result.watermark.decoded ? "text-green" : "text-text-muted"
                }`}>
                  {result.watermark.decoded ? "MATCHED" : "NO MATCH"}
                </span>
              )}
            </div>
            {result?.watermark?.decoded ? (
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-text-muted">Roll Number</p>
                  <p className="text-[18px] font-mono font-semibold text-green">{result.watermark.roll_no}</p>
                </div>
                {result.watermark.center_id && (
                  <div>
                    <p className="text-[10px] text-text-muted">Center ID</p>
                    <p className="text-[14px] font-mono font-medium">{result.watermark.center_id}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-text-muted">No watermark detected</p>
            )}
          </div>

          <div className={`border rounded-xl p-5 transition-colors ${
            result?.fingerprint?.decoded ? "bg-green-dim border-green/20" : "bg-bg-card border-border"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Printer Fingerprint</p>
              {result && (
                <span className={`text-[11px] font-mono font-semibold ${
                  result.fingerprint.decoded ? "text-green" : "text-text-muted"
                }`}>
                  {result.fingerprint.decoded ? "DECODED" : "NO MATCH"}
                </span>
              )}
            </div>
            {result?.fingerprint?.decoded ? (
              <div className="space-y-2">
                {[
                  { label: "Press ID", value: result.fingerprint.press_id },
                  { label: "Batch ID", value: result.fingerprint.batch_id },
                  { label: "Print Window", value: result.fingerprint.time_window },
                ].filter((f) => f.value).map((f) => (
                  <div key={f.label}>
                    <p className="text-[10px] text-text-muted">{f.label}</p>
                    <p className="text-[13px] font-mono font-medium">{f.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-text-muted">No fingerprint detected</p>
            )}
          </div>

          {result && matched && (
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">Source Identified</p>
              <p className="text-[12px] text-text-secondary">
                This image traces to student{" "}
                <span className="font-mono text-accent">{result.watermark?.roll_no}</span> at center{" "}
                <span className="font-mono">{result.watermark?.center_id}</span>, printed by{" "}
                <span className="font-mono">{result.fingerprint?.press_id}</span> during window{" "}
                <span className="font-mono">{result.fingerprint?.time_window}</span>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
