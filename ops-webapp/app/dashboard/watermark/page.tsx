"use client";

import { useState, useRef } from "react";
import { api } from "../../lib/api";

export default function WatermarkPage() {
  const [rollNo, setRollNo] = useState("NEET2026-0001");
  const [centerId, setCenterId] = useState("MH-001");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const run = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await api.watermark(rollNo, centerId, file);
      setResult(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-8 space-y-5  animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold">Watermark</h1>
        <p className="text-[12px] text-text-muted mt-0.5">Embed per-student invisible DCT watermark</p>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Roll No</label>
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Center ID</label>
            <input
              type="text"
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Paper Image</label>
          <div
            className="border border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent/30 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file ? (
              <p className="text-[12px] font-mono text-accent">{file.name}</p>
            ) : (
              <p className="text-[12px] text-text-muted">Click to select image</p>
            )}
          </div>
        </div>

        <button
          onClick={run}
          disabled={loading || !file}
          className="px-4 py-2 bg-accent text-white rounded-lg text-[12px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-40"
        >
          {loading ? "Embedding..." : "Embed Watermark"}
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
