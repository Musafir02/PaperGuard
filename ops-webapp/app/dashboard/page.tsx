"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";

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

interface Alert {
  id: number;
  channel_name: string;
  status: string;
  similarity_score: number;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#141418] border border-[#232329] rounded-xl p-5 space-y-1.5 shadow-sm">
      <p className="text-[11px] font-semibold text-[#52525b] uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold font-mono text-[#e4e4e7]">{value}</p>
      {sub && <p className="text-[11px] text-[#52525b] font-medium">{sub}</p>}
    </div>
  );
}

function PhaseBar({ phase, count, total }: { phase: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-[12px] text-[#52525b] font-mono">{phase.toLowerCase()}</span>
      <div className="flex-1 h-[6px] bg-[#09090b] rounded-full overflow-hidden border border-[#232329]/50">
        <div
          className="h-full bg-[#c2835e] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-14 text-right text-[11px] text-[#52525b] font-mono">{count}/{total}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const [centerId, setCenterId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  
  const [centers, setCenters] = useState<Center[]>([]);
  const [centerDetails, setCenterDetails] = useState<Center | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = sessionStorage.getItem("user_role");
      const storedCenterId = sessionStorage.getItem("center_id");
      const storedUsername = sessionStorage.getItem("username");
      
      setRole(storedRole);
      setCenterId(storedCenterId);
      setUsername(storedUsername);

      if (storedRole === "nta_member") {
        Promise.all([api.getCenters(), api.getAlerts()])
          .then(([c, a]) => {
            setCenters(c);
            setAlerts(a.alerts || []);
          })
          .catch(console.error)
          .finally(() => setLoading(false));
      } else if (storedCenterId) {
        api.getCenter(storedCenterId)
          .then(setCenterDetails)
          .catch(console.error)
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, []);

  if (loading) return <div className="p-8 text-[#52525b] text-[13px] font-mono">Loading telemetry...</div>;

  if (role === "invigilator" && centerDetails) {
    return (
      <div className="p-8 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between border-b border-[#232329] pb-5">
          <div>
            <h1 className="text-xl font-bold text-white">Invigilator Workspace</h1>
            <p className="text-sm text-[#a1a1aa] mt-0.5">{centerDetails.name} ({centerDetails.city}, {centerDetails.state})</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141418] border border-[#232329]">
            <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot"></span>
            <span className="text-[11px] font-mono text-[#a1a1aa] uppercase tracking-wider">Terminal Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Assigned Center" value={centerDetails.id} sub={`${centerDetails.city}, ${centerDetails.state}`} />
          <StatCard label="Phase" value={centerDetails.phase} sub="current status" />
          <StatCard label="Registered Students" value={centerDetails.students?.length || 0} sub="assigned to sit" />
          <StatCard label="CCTV Monitoring" value="ONLINE" sub="2 active streams" />
        </div>

        <div className="bg-[#141418] border border-[#232329] rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[#232329] bg-[#1a1a1f]/35 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-[#e4e4e7] uppercase tracking-wider">Student Registry</p>
              <p className="text-[11px] text-[#52525b] mt-0.5">Students authorized at this center</p>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-[#c2835e]/15 text-[#c2835e] border border-[#c2835e]/20">
              Verified List
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#232329] text-[11px] text-[#52525b] uppercase tracking-wider font-semibold bg-[#1a1a1f]/10">
                  <th className="px-6 py-3.5">Roll Number</th>
                  <th className="px-6 py-3.5">Full Name</th>
                  <th className="px-6 py-3.5">Center ID</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232329]/40">
                {centerDetails.students?.map((s) => (
                  <tr key={s.id} className="hover:bg-[#1f1f25]/30 transition-colors text-sm">
                    <td className="px-6 py-4 font-mono text-[#c2835e] font-semibold">{s.roll_no}</td>
                    <td className="px-6 py-4 text-[#e4e4e7]">{s.name}</td>
                    <td className="px-6 py-4 font-mono text-[#a1a1aa]">{s.center_id}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-green-500/10 text-green-400">
                        authorized
                      </span>
                    </td>
                  </tr>
                ))}
                {(!centerDetails.students || centerDetails.students.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-xs text-[#52525b] font-mono">
                      No students registered for this center
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (role === "center_officer" && centerDetails) {
    return (
      <div className="p-8 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between border-b border-[#232329] pb-5">
          <div>
            <h1 className="text-xl font-bold text-white">Center Command Console</h1>
            <p className="text-sm text-[#a1a1aa] mt-0.5">{centerDetails.name} — Superintendent View</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141418] border border-[#232329]">
            <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot"></span>
            <span className="text-[11px] font-mono text-[#a1a1aa] uppercase tracking-wider">Superintendent Terminal</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Assigned Center" value={centerDetails.id} sub={`${centerDetails.city}, ${centerDetails.state}`} />
          <StatCard label="Invigilators on Duty" value={centerDetails.invigilators?.length || 0} sub="staff registered" />
          <StatCard label="Total Candidates" value={centerDetails.students?.length || 0} sub="assigned seats" />
          <StatCard label="Phase" value={centerDetails.phase} sub="current status" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#141418] border border-[#232329] rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-[#232329] bg-[#1a1a1f]/35">
              <p className="text-xs font-semibold text-[#e4e4e7] uppercase tracking-wider">Invigilators Registry</p>
              <p className="text-[11px] text-[#52525b] mt-0.5">Assigned staff members and operational status</p>
            </div>
            <div className="divide-y divide-[#232329]/40">
              {centerDetails.invigilators?.map((i) => (
                <div key={i.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-[#1f1f25]/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#c2835e]">{i.id}</span>
                    <span className="text-sm font-medium text-[#e4e4e7]">{i.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                    {i.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#141418] border border-[#232329] rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-[#232329] bg-[#1a1a1f]/35">
              <p className="text-xs font-semibold text-[#e4e4e7] uppercase tracking-wider">Candidate Registry</p>
              <p className="text-[11px] text-[#52525b] mt-0.5">Assigned student seating roster</p>
            </div>
            <div className="divide-y divide-[#232329]/40">
              {centerDetails.students?.map((s) => (
                <div key={s.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-[#1f1f25]/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#a1a1aa]">{s.roll_no}</span>
                    <span className="text-sm font-medium text-[#e4e4e7]">{s.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#52525b]">
                    Room A-12
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const flagged = centers.filter((c) => c.risk_level === "FLAG" || c.risk_level === "BLOCK").length;
  const phases = ["SEALED", "QUORUM", "DECRYPTED", "PRINTING", "DISTRIBUTED"];

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">NTA Command Center</h1>
          <p className="text-[12px] text-[#a1a1aa] mt-0.5">System-wide national operations overview</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141418] border border-[#232329]">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-dot"></span>
          <span className="text-[11px] font-mono text-[#a1a1aa] uppercase tracking-wider">HQ Feed</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Centers" value={centers.length} sub="registered" />
        <StatCard label="Printing" value={centers.filter((c) => c.phase === "PRINTING").length} sub="active centers" />
        <StatCard label="Alerts" value={alerts.filter((a) => a.status === "PENDING").length} sub="pending review" />
        <StatCard label="Flagged" value={flagged} sub="high risk facilities" />
      </div>

      <div className="bg-[#141418] border border-[#232329] rounded-xl p-5 space-y-4 shadow-sm">
        <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider">Pipeline Progress</p>
        <div className="space-y-3">
          {phases.map((p) => (
            <PhaseBar key={p} phase={p} count={centers.filter((c) => c.phase === p).length} total={centers.length} />
          ))}
        </div>
      </div>

      <div className="bg-[#141418] border border-[#232329] rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[#232329] bg-[#1a1a1f]/35">
          <p className="text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider">Registered Centers</p>
        </div>
        <div className="divide-y divide-[#232329]/40">
          {centers.map((c) => (
            <div key={c.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-[#1f1f25]/20 transition-colors">
              <div className="flex items-center gap-4">
                <span className="text-[12px] font-mono text-[#c2835e] w-16">{c.id}</span>
                <div>
                  <p className="text-[13.5px] font-medium text-[#e4e4e7]">{c.name}</p>
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
          ))}
        </div>
      </div>
    </div>
  );
}
