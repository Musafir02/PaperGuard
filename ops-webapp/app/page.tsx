"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [invigilatorId, setInvigilatorId] = useState("");
  const [centerId, setCenterId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [error, setError] = useState("");

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/invigilator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invigilator_id: invigilatorId, center_id: centerId, device_id: deviceId }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || "Login failed");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Cannot reach server");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="w-full max-w-[340px] animate-fade-in">
        <div className="mb-8 text-center">
          <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center mx-auto mb-4">
            <span className="text-accent text-sm font-bold font-mono">PG</span>
          </div>
          <h1 className="text-base font-semibold text-text-primary">PaperGuard</h1>
          <p className="text-[11px] text-text-muted mt-1 font-mono uppercase tracking-widest">Ops Console</p>
        </div>

        <form onSubmit={login} className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Invigilator ID</label>
            <input
              value={invigilatorId}
              onChange={(e) => setInvigilatorId(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted/50 transition-colors"
              placeholder="e.g. INV-001"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Center ID</label>
            <input
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted/50 transition-colors"
              placeholder="e.g. MH-001"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Device ID</label>
            <input
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted/50 transition-colors"
              placeholder="e.g. DEV-001"
              required
            />
          </div>

          {error && (
            <p className="text-red text-[12px] bg-red-dim rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-accent text-white rounded-lg text-[13px] font-medium hover:bg-accent-hover transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
