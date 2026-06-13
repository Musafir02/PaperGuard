"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "./lib/api";

type Role = "nta_member" | "center_officer" | "invigilator";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("nta_member");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [centerId, setCenterId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.login({
        username,
        password,
        role,
        center_id: role !== "nta_member" ? centerId : ""
      });

      if (res.status === "authenticated") {
        sessionStorage.setItem("user_role", res.role);
        sessionStorage.setItem("username", res.username);
        sessionStorage.setItem("center_id", res.center_id);
        router.push("/dashboard");
      } else {
        setError("Invalid response from server");
      }
    } catch (err: any) {
      setError(err.message || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#060608] text-[#e4e4e7] overflow-hidden select-none font-sans">
      <div className="hidden lg:flex lg:w-3/5 relative flex-col justify-between p-16 overflow-hidden border-r border-[#1c1c24]">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 ease-out scale-105"
          style={{ backgroundImage: `url('/background.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#060608] via-[#060608]/85 to-[#c2835e]/15 opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#c2835e]/10 via-transparent to-transparent" />
        
        <div className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`, backgroundSize: '24px 24px' }} 
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c2835e] to-[#915e41] flex items-center justify-center shadow-lg shadow-[#c2835e]/10 border border-[#c2835e]/30">
            <span className="text-white text-sm font-bold font-mono tracking-tighter">PG</span>
          </div>
          <div>
            <span className="text-xs font-mono text-[#a1a1aa] tracking-[0.25em] uppercase">PaperGuard</span>
            <span className="block text-[8px] font-mono text-[#c2835e] uppercase tracking-wider font-semibold">Active Shield</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8 max-w-xl my-auto">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-medium bg-[#c2835e]/10 text-[#c2835e] border border-[#c2835e]/25">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c2835e] animate-pulse"></span>
              SECURE DISTRIBUTION NETWORK
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15]">
              Securing exam integrity, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c2835e] to-[#e8a27d]">from draft to desk.</span>
            </h2>
          </div>
          
          <p className="text-[#a1a1aa] text-[15px] leading-relaxed font-light">
            PaperGuard replaces vulnerable transport logistics with encrypted digital delivery, dynamic watermarking, and instant leak forensics.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#1c1c24]/50">
            <div className="space-y-1">
              <p className="text-2xl font-bold font-mono text-white tracking-tight">0.8s</p>
              <p className="text-[10px] text-[#52525b] uppercase tracking-wider">Forensic Trace</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold font-mono text-white tracking-tight">AES-256</p>
              <p className="text-[10px] text-[#52525b] uppercase tracking-wider">Quorum Decrypt</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold font-mono text-white tracking-tight">Zero</p>
              <p className="text-[10px] text-[#52525b] uppercase tracking-wider">Leak Convoy Cost</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <span className="text-[10px] text-[#52525b] font-mono tracking-widest uppercase">
            Ops Command Module 2.1
          </span>
          <span className="text-[10px] text-[#c2835e] font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block pulse-dot"></span>
            All Decryption Channels Encrypted
          </span>
        </div>
      </div>

      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-[#09090b] relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#c2835e]/5 via-transparent to-transparent opacity-60" />
        
        <div className="w-full max-w-[380px] space-y-8 relative z-10">
          <div className="space-y-2.5 text-center lg:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Welcome back</h1>
            <p className="text-xs text-[#a1a1aa] font-light">Sign in to access your administrative operations console</p>
          </div>

          <div className="bg-[#101014] p-1 rounded-xl border border-[#1c1c24] flex">
            {(["nta_member", "center_officer", "invigilator"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setError("");
                }}
                className={`flex-1 py-2 rounded-lg text-[11px] font-mono transition-all duration-300 font-medium ${
                  role === r
                    ? "bg-[#c2835e]/15 text-[#c2835e] border border-[#c2835e]/25 shadow-sm"
                    : "text-[#52525b] hover:text-[#a1a1aa] border border-transparent"
                }`}
              >
                {r === "nta_member" ? "NTA HQ" : r === "center_officer" ? "Superintendent" : "Invigilator"}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-[#a1a1aa] font-mono uppercase tracking-widest">Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={role === "nta_member" ? "e.g. nta" : role === "center_officer" ? "e.g. officer" : "e.g. invigilator"}
                  className="w-full bg-[#101014] border border-[#1c1c24] rounded-lg pl-10 pr-4 py-3 text-xs text-white placeholder:text-[#52525b] transition-all focus:border-[#c2835e] focus:ring-1 focus:ring-[#c2835e]/20"
                  required
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#52525b]">👤</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-[#a1a1aa] font-mono uppercase tracking-widest">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#101014] border border-[#1c1c24] rounded-lg pl-10 pr-4 py-3 text-xs text-white placeholder:text-[#52525b] transition-all focus:border-[#c2835e] focus:ring-1 focus:ring-[#c2835e]/20"
                  required
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#52525b]">🔑</span>
              </div>
            </div>

            {role !== "nta_member" && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-[10px] font-semibold text-[#a1a1aa] font-mono uppercase tracking-widest">Center Identification Code</label>
                <div className="relative">
                  <input
                    type="text"
                    value={centerId}
                    onChange={(e) => setCenterId(e.target.value)}
                    placeholder={role === "center_officer" ? "e.g. RJ-042" : "e.g. MH-001"}
                    className="w-full bg-[#101014] border border-[#1c1c24] rounded-lg pl-10 pr-4 py-3 text-xs text-white placeholder:text-[#52525b] transition-all focus:border-[#c2835e] focus:ring-1 focus:ring-[#c2835e]/20"
                    required
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#52525b]">🏢</span>
                </div>
              </div>
            )}

            {error && (
              <div className="text-[#f87171] text-xs bg-[#f87171]/10 border border-[#f87171]/20 rounded-lg px-3.5 py-2.5 font-mono">
                [error] {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#c2835e] hover:bg-[#b3744f] active:scale-[0.98] text-white rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#c2835e]/15 border border-[#c2835e]/30"
            >
              {loading ? "AUTHENTICATING TELEMETRY..." : "ESTABLISH SECURE LINK →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
