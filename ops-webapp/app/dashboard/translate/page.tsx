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
      const res = await api.translate({
        master_paper: mockPaper,
        languages: languages.split(",").map((l) => l.trim()),
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-mono font-bold">M1 — Translate</h1>
      <p className="text-muted text-sm">Split master paper into per-language versions.</p>

      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div>
          <label className="text-xs text-muted uppercase tracking-wider block mb-1">Languages (comma-separated)</label>
          <input
            type="text"
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
          />
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="px-4 py-2 bg-accent text-white rounded text-sm font-mono hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {loading ? "Translating..." : "Run Translation"}
        </button>
      </div>

      {result && (
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted uppercase tracking-wider mb-3">Result</p>
          <pre className="text-sm font-mono text-green overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
