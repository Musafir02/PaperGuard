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

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-muted text-xs uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-mono font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function PhaseBar({ phase, count, total }: { phase: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 text-muted font-mono text-xs">{phase}</span>
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-muted font-mono text-xs">{count}/{total}</span>
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

  if (loading) return <div className="p-8 text-muted">Loading...</div>;

  const flagged = centers.filter((c) => c.risk_level === "FLAG" || c.risk_level === "BLOCK").length;
  const phases = ["SEALED", "QUORUM", "DECRYPTED", "PRINTING", "DISTRIBUTED"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-mono font-bold">Operations Dashboard</h1>
        <span className="text-xs text-muted font-mono">LIVE</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Centers" value={centers.length} color="text-foreground" />
        <StatCard label="Printing Phase" value={centers.filter((c) => c.phase === "PRINTING").length} color="text-accent" />
        <StatCard label="Active Alerts" value={alerts.filter((a) => a.status === "PENDING").length} color="text-yellow" />
        <StatCard label="Flagged Centers" value={flagged} color="text-red" />
      </div>

      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-mono uppercase text-muted tracking-wider">Pipeline Progress</h2>
        {phases.map((p) => (
          <PhaseBar key={p} phase={p} count={centers.filter((c) => c.phase === p).length} total={centers.length} />
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-mono uppercase text-muted tracking-wider">Center Status</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted text-xs uppercase border-b border-border">
              <th className="text-left p-3 font-mono">ID</th>
              <th className="text-left p-3 font-mono">Name</th>
              <th className="text-left p-3 font-mono">City</th>
              <th className="text-left p-3 font-mono">Phase</th>
              <th className="text-left p-3 font-mono">Risk</th>
            </tr>
          </thead>
          <tbody>
            {centers.map((c) => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                <td className="p-3 font-mono text-accent">{c.id}</td>
                <td className="p-3">{c.name}</td>
                <td className="p-3 text-muted">{c.city}</td>
                <td className="p-3">
                  <span className="font-mono text-xs px-2 py-1 rounded bg-white/5">{c.phase}</span>
                </td>
                <td className="p-3">
                  <span
                    className={`font-mono text-xs px-2 py-1 rounded ${
                      c.risk_level === "PASS"
                        ? "bg-green/10 text-green"
                        : c.risk_level === "MONITOR"
                        ? "bg-yellow/10 text-yellow"
                        : "bg-red/10 text-red"
                    }`}
                  >
                    {c.risk_level} ({c.risk_score})
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
