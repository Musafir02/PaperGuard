"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

interface Student {
  id: number;
  roll_no: string;
  name: string;
  center_id: string;
}

interface Invigilator {
  id: string;
  name: string;
  status: string;
}

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
  students?: Student[];
  invigilators?: Invigilator[];
}

export default function CentersPage() {
  const [role, setRole] = useState<string | null>(null);
  const [centerId, setCenterId] = useState<string | null>(null);

  const [centers, setCenters] = useState<Center[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState<Center | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = sessionStorage.getItem("user_role");
      const storedCenterId = sessionStorage.getItem("center_id");
      setRole(storedRole);
      setCenterId(storedCenterId);

      if (storedRole === "nta_member") {
        api.getCenters()
          .then(setCenters)
          .catch(console.error)
          .finally(() => setLoading(false));
      } else if (storedCenterId) {
        api.getCenter(storedCenterId)
          .then((c) => {
            setCenters([c]);
            setSelected(c.id);
            setDetails(c);
          })
          .catch(console.error)
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, []);

  const toggle = async (id: string) => {
    if (role !== "nta_member") return;
    if (selected === id) {
      setSelected(null);
      setDetails(null);
      return;
    }
    setSelected(id);
    const c = await api.getCenter(id);
    setDetails(c);
  };

  if (loading) return <div className="p-8 text-[#52525b] text-[13px] font-mono">Loading telemetry...</div>;

  return (
    <div className="p-8 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold text-white">
          {role === "nta_member" ? "Centers Registry" : "Assigned Center Details"}
        </h1>
        <p className="text-[12px] text-[#a1a1aa] mt-0.5">
          {role === "nta_member"
            ? `${centers.length} exam centers registered system-wide`
            : "Authorized command and allocation workspace details"}
        </p>
      </div>

      <div className="space-y-3">
        {centers.map((c) => (
          <div
            key={c.id}
            className={`bg-[#141418] border rounded-xl overflow-hidden transition-all duration-200 ${
              selected === c.id ? "border-[#c2835e]/60 ring-1 ring-[#c2835e]/10" : "border-[#232329] hover:border-[#52525b]/45 cursor-pointer"
            }`}
            onClick={() => toggle(c.id)}
          >
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[12px] font-mono text-[#c2835e] w-16">{c.id}</span>
                <div>
                  <p className="text-[13.5px] font-medium text-white">{c.name}</p>
                  <p className="text-[11px] text-[#52525b]">{c.city}, {c.state}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-[#52525b] bg-[#09090b] px-2 py-0.5 rounded border border-[#232329]/40">{c.phase.toLowerCase()}</span>
                <span
                  className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
                    c.risk_level === "PASS"
                      ? "text-green-400 bg-green-500/10"
                      : c.risk_level === "MONITOR"
                      ? "text-yellow-400 bg-yellow-500/10"
                      : "text-red-400 bg-red-500/10"
                  }`}
                >
                  {c.risk_level.toLowerCase()}
                </span>
              </div>
            </div>

            {selected === c.id && details && (
              <div className="px-5 pb-5 pt-3 border-t border-[#232329]/50 bg-[#0f0f12]/30 space-y-4">
                {role !== "invigilator" && details.invigilators && (
                  <div>
                    <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-wider mb-2">Invigilators</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {details.invigilators.map((i) => (
                        <div key={i.id} className="flex items-center justify-between p-2 rounded-lg bg-[#141418] border border-[#232329] text-xs">
                          <span className="text-[#e4e4e7]">{i.name}</span>
                          <span className="font-mono text-[#52525b]">{i.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {details.students && (
                  <div>
                    <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-wider mb-2">Authorized Candidates</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                      {details.students.map((s) => (
                        <div key={s.id} className="flex items-center gap-2 text-[12.5px] py-1 border-b border-[#232329]/30 last:border-0">
                          <span className="font-mono text-[#c2835e] font-semibold">{s.roll_no}</span>
                          <span className="text-[#52525b]">·</span>
                          <span className="text-[#a1a1aa]">{s.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
