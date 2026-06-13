"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

interface Center {
  id: string;
  name: string;
  city: string;
  state: string;
  phase: string;
  risk_score: number;
  risk_level: string;
  latitude: number;
  longitude: number;
  students?: { id: number; roll_no: string; name: string }[];
}

export default function CentersPage() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState<Center | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCenters().then(setCenters).catch(console.error).finally(() => setLoading(false));
  }, []);

  const toggle = async (id: string) => {
    if (selected === id) { setSelected(null); setDetails(null); return; }
    setSelected(id);
    const c = await api.getCenter(id);
    setDetails(c);
  };

  if (loading) return <div className="p-8 text-text-muted text-[13px]">Loading...</div>;

  return (
    <div className="p-8 space-y-5  animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold">Centers</h1>
        <p className="text-[12px] text-text-muted mt-0.5">{centers.length} exam centers registered</p>
      </div>

      <div className="space-y-2">
        {centers.map((c) => (
          <div
            key={c.id}
            className={`bg-bg-card border rounded-xl overflow-hidden transition-colors cursor-pointer ${
              selected === c.id ? "border-accent/40" : "border-border hover:border-border"
            }`}
            onClick={() => toggle(c.id)}
          >
            <div className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[12px] font-mono text-accent w-16">{c.id}</span>
                <div>
                  <p className="text-[13px] font-medium">{c.name}</p>
                  <p className="text-[11px] text-text-muted">{c.city}, {c.state}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-text-muted bg-bg-primary px-2 py-0.5 rounded">{c.phase.toLowerCase()}</span>
                <span
                  className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
                    c.risk_level === "PASS" ? "text-green bg-green-dim" :
                    c.risk_level === "MONITOR" ? "text-yellow bg-yellow-dim" : "text-red bg-red-dim"
                  }`}
                >
                  {c.risk_level.toLowerCase()}
                </span>
              </div>
            </div>

            {selected === c.id && details && details.students && (
              <div className="px-5 pb-4 pt-2 border-t border-border/50">
                <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2.5">Students</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                  {details.students.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-[12px]">
                      <span className="font-mono text-accent">{s.roll_no}</span>
                      <span className="text-text-muted">·</span>
                      <span className="text-text-secondary">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
