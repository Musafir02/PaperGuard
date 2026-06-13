"use client";

import { useState, useRef } from "react";
import { api } from "../../lib/api";

const LANGUAGES = [
  { code: "hi", name: "Hindi" },
  { code: "en", name: "English" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "bn", name: "Bengali" },
  { code: "mr", name: "Marathi" },
  { code: "gu", name: "Gujarati" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "or", name: "Odia" },
  { code: "pa", name: "Punjabi" },
  { code: "ur", name: "Urdu" },
];

interface PaperResult {
  language: string;
  batch_id: string;
  image_url: string;
  status: string;
}

export default function TranslatePage() {
  const [selected, setSelected] = useState<string[]>(["en", "hi"]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<PaperResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = (code: string) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResults([]);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const run = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("languages", selected.map((c) => LANGUAGES.find((l) => l.code === c)?.name || c).join(","));
      const res = await fetch("http://localhost:8000/api/v1/pipeline/translate", { method: "POST", body: fd });
      const data = await res.json();
      setResults(data.papers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold">M1 — Translate</h1>
        <p className="text-[12px] text-text-muted mt-0.5">
          Upload master paper — split into per-language versions for translator assignment
        </p>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5">
        <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Master Paper</p>
          <div
            className="border border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent/30 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            {preview ? (
              <img src={preview} alt="Master paper" className="max-h-[240px] mx-auto rounded-lg" />
            ) : (
              <div>
                <div className="w-12 h-12 rounded-xl bg-bg-primary border border-border flex items-center justify-center mx-auto mb-3">
                  <span className="text-text-muted text-xl">↑</span>
                </div>
                <p className="text-[13px] text-text-secondary">Drop master paper image or click to browse</p>
                <p className="text-[11px] text-text-muted mt-1">JPEG, PNG — the original exam paper</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Languages</p>
              <p className="text-[12px] text-text-muted mt-0.5">{selected.length} of 12 selected</p>
            </div>
            <button onClick={() => setSelected(LANGUAGES.map((l) => l.code))}
              className="px-3 py-1.5 text-[11px] font-mono border border-border rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors">
              All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-[280px] overflow-y-auto">
            {LANGUAGES.map((lang) => {
              const active = selected.includes(lang.code);
              return (
                <button key={lang.code} onClick={() => toggle(lang.code)}
                  className={`px-2.5 py-2 text-[11px] font-mono rounded-lg border transition-all text-left ${
                    active ? "bg-accent-dim border-accent/30 text-accent" : "border-border text-text-secondary hover:bg-bg-hover"
                  }`}>
                  {lang.name}
                </button>
              );
            })}
          </div>

          <button onClick={run} disabled={loading || !file || selected.length === 0}
            className="w-full px-4 py-2.5 bg-accent text-white rounded-lg text-[12px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-40">
            {loading ? "Generating versions..." : `Generate ${selected.length} Language Versions`}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
            Generated Versions — {results.length} papers
          </p>
          <div className="grid grid-cols-4 gap-3">
            {results.map((r) => (
              <div key={r.language} className="bg-bg-card border border-border rounded-xl overflow-hidden">
                <img src={`http://localhost:8000${r.image_url}`} alt={r.language}
                  className="w-full h-[120px] object-cover object-top" />
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium">{r.language}</span>
                    <span className="text-[10px] font-mono text-green bg-green-dim px-2 py-0.5 rounded">done</span>
                  </div>
                  <p className="text-[10px] text-text-muted font-mono mt-1">{r.batch_id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
