"use client";

import { useState } from "react";
import { api } from "../../lib/api";

export default function TranslatorShieldPage() {
  const [translatorId, setTranslatorId] = useState("");
  const [section, setSection] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [issued, setIssued] = useState<{ translator_id: string; section: string; expires_at: string }[]>([]);
  const [verifyResult, setVerifyResult] = useState<{ authorized: boolean; reason?: string; section?: string } | null>(null);
  const [reconstructedKey, setReconstructedKey] = useState<string | null>(null);
  const [reconstructError, setReconstructError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const SECTIONS = ["Physics", "Chemistry", "Biology"];

  const issue = async () => {
    if (!translatorId || !section) return;
    setLoading(true);
    try {
      const shardData = `shard-${Date.now().toString(36)}`;
      const res = await api.issueShard({ translator_id: translatorId, section, device_id: deviceId || "DEVICE-001", shard_data: shardData });
      setIssued((prev) => [{ translator_id: translatorId, section, expires_at: res.expires_at }, ...prev]);
      setTranslatorId("");
      setSection("");
      setDeviceId("");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (!translatorId) return;
    setLoading(true);
    try {
      const res = await api.verifyShard(translatorId, deviceId || "DEVICE-001");
      setVerifyResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const reconstruct = async () => {
    setLoading(true);
    setReconstructedKey(null);
    setReconstructError(null);
    try {
      const res = await api.combineShards();
      setReconstructedKey(res.reconstructed_key_hex);
    } catch (e: any) {
      setReconstructError(e.message || "Failed to reconstruct key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold">M3 — Translator Shield</h1>
        <p className="text-[12px] text-text-muted mt-0.5">
          Shamir Secret Sharing — each translator gets only their section, time-limited, device-locked
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Issue Shard</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Translator ID</label>
              <input value={translatorId} onChange={(e) => setTranslatorId(e.target.value)} placeholder="e.g. T-001"
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary placeholder:text-text-muted/40 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Section</label>
              <div className="flex gap-2">
                {SECTIONS.map((s) => (
                  <button key={s} onClick={() => setSection(s)}
                    className={`flex-1 px-3 py-2 text-[12px] font-mono rounded-lg border transition-all ${
                      section === s ? "bg-accent-dim border-accent/30 text-accent" : "border-border text-text-muted hover:text-text-secondary"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Device ID</label>
              <input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="e.g. DEV-001"
                className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-[13px] font-mono text-text-primary placeholder:text-text-muted/40 transition-colors" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={issue} disabled={loading || !translatorId || !section}
              className="px-4 py-2 bg-accent text-white rounded-lg text-[12px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-40">
              {loading ? "Issuing..." : "Issue Shard"}
            </button>
            <button onClick={verify} disabled={loading || !translatorId}
              className="px-4 py-2 border border-border rounded-lg text-[12px] font-medium text-text-secondary hover:bg-bg-hover transition-colors disabled:opacity-40">
              Verify Access
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {verifyResult && (
            <div className={`border rounded-xl p-4 ${verifyResult.authorized ? "bg-green-dim border-green/20" : "bg-red-dim border-red/20"}`}>
              <p className={`text-[12px] font-medium ${verifyResult.authorized ? "text-green" : "text-red"}`}>
                {verifyResult.authorized ? `Authorized — Section: ${verifyResult.section}` : `Denied — ${verifyResult.reason}`}
              </p>
            </div>
          )}

          <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
            <div>
              <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-3">Issued Shards</p>
              {issued.length === 0 ? (
                <p className="text-[12px] text-text-muted">No shards issued yet</p>
              ) : (
                <div className="space-y-2">
                  {issued.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[12px] text-accent">{s.translator_id}</span>
                        <span className="text-[12px] text-text-secondary">{s.section}</span>
                      </div>
                      <span className="text-[10px] font-mono text-text-muted">
                        expires {new Date(s.expires_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <button
                onClick={reconstruct}
                disabled={loading}
                className="w-full px-4 py-2 bg-accent text-white rounded-lg text-[12px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-40"
              >
                Reconstruct Master Key
              </button>
            </div>

            {reconstructedKey && (
              <div className="bg-green-dim border border-green/20 rounded-xl p-4 space-y-1">
                <p className="text-[11px] font-medium text-green uppercase tracking-wider">Key Reconstructed (2-of-3 Quorum)</p>
                <p className="font-mono text-[12px] text-text-primary break-all">{reconstructedKey}</p>
              </div>
            )}

            {reconstructError && (
              <div className="bg-red-dim border border-red/20 rounded-xl p-4">
                <p className="text-[12px] text-red font-medium">{reconstructError}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
