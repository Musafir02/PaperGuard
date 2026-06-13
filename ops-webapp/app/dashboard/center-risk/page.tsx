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
  latitude: number;
  longitude: number;
}

interface RiskResult {
  score: number;
  level: string;
  reasons: string[];
}

const LEVEL_STYLE: Record<string, string> = {
  PASS: "text-green bg-green-dim",
  MONITOR: "text-yellow bg-yellow-dim",
  FLAG: "text-red bg-red-dim",
  BLOCK: "text-red bg-red-dim",
};

export default function CenterRiskPage() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [riskDetails, setRiskDetails] = useState<Record<string, RiskResult>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCenters().then(setCenters).catch(console.error).finally(() => setLoading(false));
  }, []);

  const toggle = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!riskDetails[id]) {
      const r = await api.calcRisk(id);
      setRiskDetails((prev) => ({ ...prev, [id]: r.risk }));
    }
  };

  const filtered = filter === "ALL" ? centers : centers.filter((c) => c.risk_level === filter);

  if (loading) return <div className="p-8 text-text-muted text-[13px]">Loading...</div>;

  return (
    <div className="p-8 space-y-5  animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold">Risk Assessment</h1>
        <p className="text-[12px] text-text-muted mt-0.5">Pre-assignment center risk scoring</p>
      </div>

      <div className="flex gap-1.5">
        {["ALL", "PASS", "MONITOR", "FLAG", "BLOCK"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-[11px] font-mono rounded-lg border transition-all ${
              filter === f
                ? "bg-accent-dim border-accent/30 text-accent"
                : "border-border text-text-muted hover:text-text-secondary hover:border-border"
            }`}
          >
            {f.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((c) => {
          const risk = riskDetails[c.id];
          return (
            <div
              key={c.id}
              className="bg-bg-card border border-border rounded-xl overflow-hidden cursor-pointer"
              onClick={() => toggle(c.id)}
            >
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-[12px] font-mono text-accent w-16">{c.id}</span>
                  <div>
                    <p className="text-[13px] font-medium">{c.name}</p>
                    <p className="text-[11px] text-text-muted">{c.city}, {c.state}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[14px] font-semibold font-mono text-text-primary">{c.risk_score}<span className="text-[11px] text-text-muted font-normal">/100</span></span>
                  <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${LEVEL_STYLE[c.risk_level] || ""}`}>
                    {c.risk_level.toLowerCase()}
                  </span>
                </div>
              </div>

              {expanded === c.id && risk && (
                <div className="px-5 pb-4 pt-3 border-t border-border/50">
                  {risk.reasons.length === 0 ? (
                    <p className="text-[12px] text-text-muted">No risk factors identified.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {risk.reasons.map((r, i) => (
                        <li key={i} className="text-[12px] text-text-secondary flex items-start gap-2">
                          <span className="text-red mt-px">·</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[11px] text-text-muted mt-3 font-medium">
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
