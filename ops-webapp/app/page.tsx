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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-mono font-bold text-accent tracking-wider">PAPERGUARD</h1>
          <p className="text-muted text-sm mt-2">Ops Console Login</p>
        </div>
        <form onSubmit={login} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <label className="text-xs text-muted uppercase tracking-wider block mb-1">Invigilator ID</label>
            <input value={invigilatorId} onChange={(e) => setInvigilatorId(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent" required />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider block mb-1">Center ID</label>
            <input value={centerId} onChange={(e) => setCenterId(e.target.value)} placeholder="e.g. MH-001"
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent" required />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider block mb-1">Device ID</label>
            <input value={deviceId} onChange={(e) => setDeviceId(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent" required />
          </div>
          {error && <p className="text-red text-xs font-mono">{error}</p>}
          <button type="submit"
            className="w-full py-2 bg-accent text-white rounded text-sm font-mono hover:bg-accent-hover transition-colors">
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}
