"use client";

import { useState } from "react";
import { api } from "../../lib/api";

export default function TranslatorShieldPage() {
  const [translatorId, setTranslatorId] = useState("T001");
  const [section, setSection] = useState("Physics");
  const [deviceId, setDeviceId] = useState("DEV-001");
  const [shardData, setShardData] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [verifyResult, setVerifyResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const issue = async () => {
    setLoading(true);
    try {
      const res = await api.issueShard({ translator_id: translatorId, section, device_id: deviceId, shard_data: shardData });
      setResult(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const verify = async () => {
    setLoading(true);
    try {
      const res = await api.verifyShard(translatorId, deviceId);
      setVerifyResult(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-mono font-bold">M3 — Translator Shield</h1>
      <p className="text-muted text-sm">Issue Shamir Secret Sharing shards. Each translator sees only their section.</p>

      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted uppercase tracking-wider block mb-1">Translator ID</label>
            <input value={translatorId} onChange={(e) => setTranslatorId(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider block mb-1">Section</label>
            <input value={section} onChange={(e) => setSection(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider block mb-1">Device ID</label>
            <input value={deviceId} onChange={(e) => setDeviceId(e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted uppercase tracking-wider block mb-1">Shard Data</label>
          <textarea value={shardData} onChange={(e) => setShardData(e.target.value)} rows={3}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent" />
        </div>
        <div className="flex gap-3">
          <button onClick={issue} disabled={loading}
            className="px-4 py-2 bg-accent text-white rounded text-sm font-mono hover:bg-accent-hover transition-colors disabled:opacity-50">
            {loading ? "Issuing..." : "Issue Shard"}
          </button>
          <button onClick={verify} disabled={loading}
            className="px-4 py-2 border border-border rounded text-sm font-mono hover:bg-white/5 transition-colors disabled:opacity-50">
            Verify Access
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted uppercase tracking-wider mb-2">Issue Result</p>
          <pre className="text-sm font-mono text-green overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      {verifyResult && (
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted uppercase tracking-wider mb-2">Verify Result</p>
          <pre className="text-sm font-mono text-blue overflow-x-auto">{JSON.stringify(verifyResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
