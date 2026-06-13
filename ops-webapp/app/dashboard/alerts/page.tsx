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

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getAlerts(filter === "ALL" ? undefined : filter)
      .then((res) => setAlerts(res.alerts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const confirm = async (id: number) => { await api.confirmAlert(id); load(); };
  const escalate = async (id: number) => { await api.escalateAlert(id); load(); };

  const stats = {
    total: alerts.length,
    pending: alerts.filter((a) => a.status === "PENDING").length,
    confirmed: alerts.filter((a) => a.status === "CONFIRMED").length,
    escalated: alerts.filter((a) => a.status === "ESCALATED").length,
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-mono font-bold">M7 — Telegram Hunter Alerts</h1>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Pending", value: stats.pending, color: "text-yellow" },
          { label: "Confirmed", value: stats.confirmed, color: "text-accent" },
          { label: "Escalated", value: stats.escalated, color: "text-red" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl font-mono font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {["ALL", "PENDING", "CONFIRMED", "ESCALATED"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
              filter === f ? "bg-accent/10 border-accent text-accent" : "border-border text-muted hover:text-foreground"
            }`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-muted">Loading...</div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div key={a.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-accent text-sm">#{a.id}</span>
                  <span className="ml-2">{a.channel_name}</span>
                  <span className="ml-2 text-muted text-sm">msg:{a.message_id}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-mono ${
                    a.similarity_score > 0.8 ? "text-red" : a.similarity_score > 0.6 ? "text-yellow" : "text-muted"
                  }`}>
                    {(a.similarity_score * 100).toFixed(0)}% match
                  </span>
                  <span className={`font-mono text-xs px-2 py-1 rounded ${
                    a.status === "PENDING" ? "bg-yellow/10 text-yellow" :
                    a.status === "CONFIRMED" ? "bg-accent/10 text-accent" : "bg-red/10 text-red"
                  }`}>
                    {a.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {a.status === "PENDING" && (
                  <>
                    <button onClick={() => confirm(a.id)}
                      className="px-3 py-1 text-xs font-mono bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors">
                      Confirm
                    </button>
                    <button onClick={() => escalate(a.id)}
                      className="px-3 py-1 text-xs font-mono bg-red/10 text-red rounded hover:bg-red/20 transition-colors">
                      Escalate to CBI
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
