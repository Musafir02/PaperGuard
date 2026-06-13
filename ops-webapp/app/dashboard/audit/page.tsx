"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

interface AuditEvent {
  id: number;
  type: string;
  roll_no: string;
  center_id: string;
  payload: string;
  hmac: string;
  timestamp: string;
}

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; broken_at: number | null; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.exportAudit()
      .then((res) => setEvents(res.events || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const verify = async () => {
    const res = await api.verifyAudit();
    setVerifyResult(res);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit_chain.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-muted">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-mono font-bold">M8 — Audit Chain</h1>
        <div className="flex gap-2">
          <button onClick={verify}
            className="px-4 py-2 bg-accent text-white rounded text-sm font-mono hover:bg-accent-hover transition-colors">
            Verify Chain
          </button>
          <button onClick={exportJson}
            className="px-4 py-2 border border-border rounded text-sm font-mono hover:bg-white/5 transition-colors">
            Export JSON
          </button>
        </div>
      </div>

      {verifyResult && (
        <div className={`border rounded-lg p-4 ${verifyResult.valid ? "bg-green/5 border-green" : "bg-red/5 border-red"}`}>
          <p className={`text-sm font-mono font-bold ${verifyResult.valid ? "text-green" : "text-red"}`}>
            {verifyResult.valid ? `Chain Valid — ${verifyResult.total} entries` : `Broken at entry #${verifyResult.broken_at}`}
          </p>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted text-xs uppercase border-b border-border">
              <th className="text-left p-3 font-mono">ID</th>
              <th className="text-left p-3 font-mono">Type</th>
              <th className="text-left p-3 font-mono">Roll No</th>
              <th className="text-left p-3 font-mono">Center</th>
              <th className="text-left p-3 font-mono">Timestamp</th>
              <th className="text-left p-3 font-mono">HMAC</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                <td className="p-3 font-mono text-accent">{e.id}</td>
                <td className="p-3 font-mono text-xs">{e.type}</td>
                <td className="p-3 font-mono text-xs">{e.roll_no || "—"}</td>
                <td className="p-3 font-mono text-xs">{e.center_id || "—"}</td>
                <td className="p-3 font-mono text-xs text-muted">{e.timestamp}</td>
                <td className="p-3 font-mono text-xs text-muted truncate max-w-[120px]">{e.hmac}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
