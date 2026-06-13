"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Center {
  id: string;
  name: string;
  city: string;
  state: string;
  phase: string;
  risk_score: number;
  risk_level: string;
}

interface Alert {
  id: number;
  channel_name: string;
  status: string;
  similarity_score: number;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-1">
      <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-semibold font-mono text-text-primary">{value}</p>
      {sub && <p className="text-[11px] text-text-muted">{sub}</p>}
    </div>
  );
}

function PhaseBar({ phase, count, total }: { phase: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-[12px] text-text-muted font-mono">{phase.toLowerCase()}</span>
      <div className="flex-1 h-[6px] bg-bg-primary rounded-full overflow-hidden">
        <div
          className="h-full bg-accent/70 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-14 text-right text-[11px] text-text-muted font-mono">{count}/{total}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getCenters(), api.getAlerts()])
      .then(([c, a]) => { setCenters(c); setAlerts(a.alerts || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-text-muted text-[13px]">Loading...</div>;

  const flagged = centers.filter((c) => c.risk_level === "FLAG" || c.risk_level === "BLOCK").length;
  const phases = ["SEALED", "QUORUM", "DECRYPTED", "PRINTING", "DISTRIBUTED"];

  return (
    <div className="p-8 space-y-6 max-w-[1200px] animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-[12px] text-text-muted mt-0.5">System-wide operations overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green pulse-dot"></span>
          <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Centers" value={centers.length} sub="registered" />
        <StatCard label="Printing" value={centers.filter((c) => c.phase === "PRINTING").length} sub="active" />
        <StatCard label="Alerts" value={alerts.filter((a) => a.status === "PENDING").length} sub="pending review" />
        <StatCard label="Flagged" value={flagged} sub="high risk" />
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Pipeline Progress</p>
        <div className="space-y-2.5">
          {phases.map((p) => (
            <PhaseBar key={p} phase={p} count={centers.filter((c) => c.phase === p).length} total={centers.length} />
          ))}
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Centers</p>
        </div>
        <div className="divide-y divide-border">
          {centers.map((c) => (
            <div key={c.id} className="px-5 py-3 flex items-center justify-between hover:bg-bg-hover/50 transition-colors">
              <div className="flex items-center gap-4">
                <span className="text-[12px] font-mono text-accent w-16">{c.id}</span>
                <div>
                  <p className="text-[13px] font-medium text-text-primary">{c.name}</p>
                  <p className="text-[11px] text-text-muted">{c.city}, {c.state}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-text-muted bg-bg-primary px-2 py-0.5 rounded">{c.phase.toLowerCase()}</span>
                <span
                  className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
                    c.risk_level === "PASS"
                      ? "text-green bg-green-dim"
                      : c.risk_level === "MONITOR"
                      ? "text-yellow bg-yellow-dim"
                      : "text-red bg-red-dim"
                  }`}
                >
                  {c.risk_level.toLowerCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
