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
    <div className="p-8 space-y-5 max-w-[800px] animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold">Translator Shield</h1>
        <p className="text-[12px] text-text-muted mt-0.5">Shamir Secret Sharing — each translator sees only their section</p>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Translator ID</label>
            <input value={translatorId} onChange={(e) => setTranslatorId(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Section</label>
            <input value={section} onChange={(e) => setSection(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Device ID</label>
            <input value={deviceId} onChange={(e) => setDeviceId(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary transition-colors" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Shard Data</label>
          <textarea value={shardData} onChange={(e) => setShardData(e.target.value)} rows={3}
            className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary transition-colors resize-none" />
        </div>
        <div className="flex gap-2">
          <button onClick={issue} disabled={loading}
            className="px-4 py-2 bg-accent text-white rounded-lg text-[12px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-40">
            {loading ? "Issuing..." : "Issue Shard"}
          </button>
          <button onClick={verify} disabled={loading}
            className="px-4 py-2 border border-border rounded-lg text-[12px] font-medium text-text-secondary hover:bg-bg-hover transition-colors disabled:opacity-40">
            Verify Access
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-3">Issue Result</p>
          <pre className="text-[12px] font-mono text-green whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      {verifyResult && (
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-3">Verify Result</p>
          <pre className="text-[12px] font-mono text-blue whitespace-pre-wrap">{JSON.stringify(verifyResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
