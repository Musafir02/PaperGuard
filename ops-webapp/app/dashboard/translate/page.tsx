"use client";

import { useState } from "react";
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

interface TranslationResult {
  language: string;
  batch_id: string;
  status: "completed" | "pending";
}

export default function TranslatePage() {
  const [selected, setSelected] = useState<string[]>(["en", "hi"]);
  const [results, setResults] = useState<TranslationResult[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = (code: string) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const run = async () => {
    setLoading(true);
    try {
      const res = await api.translate({
        master_paper: {
          exam: "NEET 2026",
          subjects: ["Physics", "Chemistry", "Biology"],
          total_questions: 180,
        },
        languages: selected.map((c) => LANGUAGES.find((l) => l.code === c)?.name || c),
      });
      const papers = (res.papers || []) as { language: string; batch_id: string }[];
      setResults(papers.map((p) => ({ ...p, status: "completed" as const })));
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
          Split master paper into per-language versions for translator assignment
        </p>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Target Languages</p>
            <p className="text-[12px] text-text-muted mt-0.5">{selected.length} of 12 selected</p>
          </div>
          <button
            onClick={() => setSelected(LANGUAGES.map((l) => l.code))}
            className="px-3 py-1.5 text-[11px] font-mono border border-border rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-hover transition-colors"
          >
            Select All
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {LANGUAGES.map((lang) => {
            const active = selected.includes(lang.code);
            return (
              <button
                key={lang.code}
                onClick={() => toggle(lang.code)}
                className={`px-3 py-2.5 text-[12px] font-mono rounded-lg border transition-all text-left ${
                  active
                    ? "bg-accent-dim border-accent/30 text-accent"
                    : "border-border text-text-secondary hover:border-border hover:bg-bg-hover"
                }`}
              >
                <span className="font-medium">{lang.name}</span>
                <span className="text-[10px] text-text-muted ml-1.5">{lang.code.toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={run}
          disabled={loading || selected.length === 0}
          className="px-4 py-2 bg-accent text-white rounded-lg text-[12px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-40"
        >
          {loading ? "Generating language versions..." : `Generate ${selected.length} Language Versions`}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
            Generated Versions
          </p>
          <div className="grid grid-cols-3 gap-3">
            {results.map((r) => (
              <div key={r.language} className="bg-bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium">{r.language}</span>
                  <span className="text-[10px] font-mono text-green bg-green-dim px-2 py-0.5 rounded">
                    {r.status}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted font-mono">{r.batch_id}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
