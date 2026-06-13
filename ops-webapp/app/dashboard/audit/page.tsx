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
    api.exportAudit().then((r) => setEvents(r.events || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const verify = async () => { setVerifyResult(await api.verifyAudit()); };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "audit_chain.json"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-text-muted text-[13px]">Loading...</div>;

  return (
    <div className="p-8 space-y-5 max-w-[1200px] animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Audit Chain</h1>
          <p className="text-[12px] text-text-muted mt-0.5">HMAC-chained append-only log</p>
        </div>
        <div className="flex gap-2">
          <button onClick={verify}
            className="px-4 py-2 bg-accent text-white rounded-lg text-[12px] font-medium hover:bg-accent-hover transition-colors">
            Verify Chain
          </button>
          <button onClick={exportJson}
            className="px-4 py-2 border border-border rounded-lg text-[12px] font-medium text-text-secondary hover:bg-bg-hover transition-colors">
            Export JSON
          </button>
        </div>
      </div>

      {verifyResult && (
        <div className={`border rounded-xl px-5 py-3.5 ${
          verifyResult.valid ? "bg-green-dim border-green/20" : "bg-red-dim border-red/20"
        }`}>
          <p className={`text-[12px] font-mono font-medium ${verifyResult.valid ? "text-green" : "text-red"}`}>
            {verifyResult.valid ? `Chain valid — ${verifyResult.total} entries verified` : `Chain broken at entry #${verifyResult.broken_at}`}
          </p>
        </div>
      )}

      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <div className="divide-y divide-border">
          {events.map((e) => (
            <div key={e.id} className="px-5 py-3 flex items-center gap-6 hover:bg-bg-hover/50 transition-colors">
              <span className="text-[11px] font-mono text-accent w-8">{e.id}</span>
              <span className="text-[11px] font-mono text-text-secondary w-28">{e.type}</span>
              <span className="text-[11px] font-mono text-text-muted w-24">{e.roll_no || "—"}</span>
              <span className="text-[11px] font-mono text-text-muted w-20">{e.center_id || "—"}</span>
              <span className="text-[11px] font-mono text-text-muted flex-1 truncate">{e.timestamp}</span>
              <span className="text-[10px] font-mono text-text-muted/60 w-28 truncate">{e.hmac}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
