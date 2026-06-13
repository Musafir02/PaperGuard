"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

interface Center {
  id: string;
  name: string;
  city: string;
  state: string;
  risk_score: number;
  risk_level: string;
}

interface RiskResult {
  score: number;
  level: string;
  reasons: string[];
}

export default function CenterRiskPage() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [riskDetails, setRiskDetails] = useState<Record<string, RiskResult>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCenters().then(setCenters).catch(console.error).finally(() => setLoading(false));
  }, []);

  const loadRisk = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!riskDetails[id]) {
      const r = await api.calcRisk(id);
      setRiskDetails((prev) => ({ ...prev, [id]: r.risk }));
    }
  };

  const filtered = filter === "ALL" ? centers : centers.filter((c) => c.risk_level === filter);

  if (loading) return <div className="p-8 text-muted">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-mono font-bold">Center Risk Assessment</h1>

      <div className="flex gap-2">
        {["ALL", "PASS", "MONITOR", "FLAG", "BLOCK"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
              filter === f
                ? "bg-accent/10 border-accent text-accent"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((c) => {
          const risk = riskDetails[c.id];
          return (
            <div
              key={c.id}
              className="bg-card border border-border rounded-lg overflow-hidden cursor-pointer"
              onClick={() => loadRisk(c.id)}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-accent text-sm">{c.id}</span>
                  <span>{c.name}</span>
                  <span className="text-muted text-sm">{c.city}, {c.state}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold">{c.risk_score}/100</span>
                  <span
                    className={`font-mono text-xs px-2 py-1 rounded ${
                      c.risk_level === "PASS"
                        ? "bg-green/10 text-green"
                        : c.risk_level === "MONITOR"
                        ? "bg-yellow/10 text-yellow"
                        : "bg-red/10 text-red"
                    }`}
                  >
                    {c.risk_level}
                  </span>
                </div>
              </div>

              {expanded === c.id && risk && (
                <div className="px-4 pb-4 border-t border-border pt-3">
                  <p className="text-xs text-muted uppercase tracking-wider mb-2">Reasons</p>
                  {risk.reasons.length === 0 ? (
                    <p className="text-sm text-muted">No risk factors identified</p>
                  ) : (
                    <ul className="space-y-1">
                      {risk.reasons.map((r, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-red mt-0.5">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-muted mt-3">
                    Recommendation: {c.risk_level === "BLOCK" ? "DO NOT ASSIGN" : c.risk_level === "FLAG" ? "REVIEW REQUIRED" : c.risk_level === "MONITOR" ? "MONITOR CLOSELY" : "SAFE TO ASSIGN"}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
