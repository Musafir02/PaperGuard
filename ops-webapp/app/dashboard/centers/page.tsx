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
  const [selected, setSelected] = useState<Center | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCenters().then(setCenters).catch(console.error).finally(() => setLoading(false));
  }, []);

  const loadDetail = async (id: string) => {
    const c = await api.getCenter(id);
    setSelected(c);
  };

  if (loading) return <div className="p-8 text-muted">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-mono font-bold">Centers</h1>

      <div className="grid gap-4">
        {centers.map((c) => (
          <div
            key={c.id}
            className={`bg-card border rounded-lg p-4 cursor-pointer transition-colors ${
              selected?.id === c.id ? "border-accent" : "border-border hover:border-border/80"
            }`}
            onClick={() => loadDetail(c.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-accent text-sm">{c.id}</span>
                <span className="ml-3 font-medium">{c.name}</span>
                <span className="ml-2 text-muted text-sm">— {c.city}, {c.state}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs px-2 py-1 rounded bg-white/5">{c.phase}</span>
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
              </div>
            </div>

            {selected?.id === c.id && selected.students && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted uppercase tracking-wider mb-2">Students</p>
                <div className="grid grid-cols-2 gap-2">
                  {selected.students.map((s) => (
                    <div key={s.id} className="text-sm flex items-center gap-2">
                      <span className="font-mono text-accent">{s.roll_no}</span>
                      <span className="text-muted">—</span>
                      <span>{s.name}</span>
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
