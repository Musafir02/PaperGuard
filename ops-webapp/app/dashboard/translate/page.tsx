"use client";

import { useState } from "react";
import { api } from "../../lib/api";

export default function TranslatePage() {
  const [languages, setLanguages] = useState("Hindi,English,Tamil");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const mockPaper = {
    questions: [
      { id: 1, text: "What is the chemical formula of water?", options: ["H2O", "CO2", "NaCl", "O2"] },
      { id: 2, text: "What is the powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi"] },
    ],
  };

  const run = async () => {
    setLoading(true);
    try {
      const res = await api.translate({ master_paper: mockPaper, languages: languages.split(",").map((l) => l.trim()) });
      setResult(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-8 space-y-5  animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold">Translate</h1>
        <p className="text-[12px] text-text-muted mt-0.5">Split master paper into per-language versions</p>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Languages</label>
          <input
            type="text"
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary placeholder:text-text-muted/50 transition-colors"
            placeholder="Hindi, English, Tamil"
          />
          <p className="text-[10px] text-text-muted">Comma-separated list of target languages</p>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="px-4 py-2 bg-accent text-white rounded-lg text-[12px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-40"
        >
          {loading ? "Translating..." : "Run Translation"}
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
