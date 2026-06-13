"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

interface Alert {
  id: number;
  channel_name: string;
  message_id: number;
  similarity_score: number;
  status: string;
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "text-yellow bg-yellow-dim",
  CONFIRMED: "text-accent bg-accent-dim",
  ESCALATED: "text-red bg-red-dim",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getAlerts(filter === "ALL" ? undefined : filter)
      .then((r) => setAlerts(r.alerts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const confirm = async (id: number) => { await api.confirmAlert(id); load(); };
  const escalate = async (id: number) => { await api.escalateAlert(id); load(); };

  return (
    <div className="p-8 space-y-5 max-w-[1000px] animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold">Telegram Hunter Alerts</h1>
        <p className="text-[12px] text-text-muted mt-0.5">Real-time leak detection across public channels</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: alerts.length },
          { label: "Pending", value: alerts.filter((a) => a.status === "PENDING").length },
          { label: "Confirmed", value: alerts.filter((a) => a.status === "CONFIRMED").length },
          { label: "Escalated", value: alerts.filter((a) => a.status === "ESCALATED").length },
        ].map((s) => (
          <div key={s.label} className="bg-bg-card border border-border rounded-xl p-3.5 space-y-0.5">
            <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{s.label}</p>
            <p className="text-xl font-semibold font-mono">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        {["ALL", "PENDING", "CONFIRMED", "ESCALATED"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-[11px] font-mono rounded-lg border transition-all ${
              filter === f ? "bg-accent-dim border-accent/30 text-accent" : "border-border text-text-muted hover:text-text-secondary"
            }`}>
            {f.toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? <p className="text-[13px] text-text-muted">Loading...</p> : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className="bg-bg-card border border-border rounded-xl px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-mono text-accent">#{a.id}</span>
                  <span className="text-[13px]">{a.channel_name}</span>
                  <span className="text-[11px] text-text-muted font-mono">msg:{a.message_id}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[12px] font-mono font-medium ${
                    a.similarity_score > 0.8 ? "text-red" : a.similarity_score > 0.6 ? "text-yellow" : "text-text-muted"
                  }`}>
                    {(a.similarity_score * 100).toFixed(0)}%
                  </span>
                  <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded ${STATUS_STYLE[a.status] || ""}`}>
                    {a.status.toLowerCase()}
                  </span>
                </div>
              </div>
              {a.status === "PENDING" && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                  <button onClick={() => confirm(a.id)}
                    className="px-3 py-1.5 text-[11px] font-medium bg-accent-dim text-accent rounded-lg hover:bg-accent/15 transition-colors">
                    Confirm
                  </button>
                  <button onClick={() => escalate(a.id)}
                    className="px-3 py-1.5 text-[11px] font-medium bg-red-dim text-red rounded-lg hover:bg-red/15 transition-colors">
                    Escalate to CBI
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
