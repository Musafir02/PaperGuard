"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "../../lib/api";

interface Alert {
  id: number;
  channel_name: string;
  message_id: number;
  similarity_score: number;
  status: string;
  created_at: string;
}

interface ScanResult {
  status: string;
  similarity: number;
  match_found: boolean;
  roll_no?: string | null;
  center_id?: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "text-yellow bg-yellow-dim border border-yellow/20",
  CONFIRMED: "text-accent bg-accent-dim border border-accent/20",
  ESCALATED: "text-red bg-red-dim border border-red/20",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    api.getAlerts(filter === "ALL" ? undefined : filter)
      .then((r) => setAlerts(r.alerts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const confirm = async (id: number) => {
    await api.confirmAlert(id);
    load();
  };

  const escalate = async (id: number) => {
    await api.escalateAlert(id);
    load();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanFile(file);
    setScanResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setScanPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const runScan = async () => {
    if (!scanFile) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await api.scanTelegramLeak(scanFile);
      setScanResult(res);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in text-[#e4e4e7]">
      <div>
        <h1 className="text-xl font-bold text-white">M7 — Telegram Hunter</h1>
        <p className="text-[12px] text-[#a1a1aa] mt-0.5">Automated image-matching and real-time alerts across public channels</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Alerts", value: alerts.length },
          { label: "Pending Reviews", value: alerts.filter((a) => a.status === "PENDING").length },
          { label: "Confirmed Leaks", value: alerts.filter((a) => a.status === "CONFIRMED").length },
          { label: "Escalated to CBI", value: alerts.filter((a) => a.status === "ESCALATED").length },
        ].map((s) => (
          <div key={s.label} className="bg-[#141418] border border-[#232329] rounded-xl p-5 space-y-1 shadow-sm">
            <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold font-mono text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-[#141418] border border-[#232329] rounded-xl p-5 space-y-4 shadow-sm self-start">
          <p className="text-[10px] font-semibold text-[#a1a1aa] uppercase tracking-widest">Perceptual Leak Scanner</p>
          
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-[#232329] rounded-xl p-6 text-center cursor-pointer hover:border-[#c2835e]/40 transition-all bg-[#0f0f12]/50"
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {scanPreview ? (
              <img src={scanPreview} alt="Scan preview" className="max-h-[160px] mx-auto rounded-lg shadow-md" />
            ) : (
              <div className="space-y-2 py-4">
                <span className="text-2xl block">📷</span>
                <p className="text-xs text-[#a1a1aa] font-medium">Click to upload suspicious screenshot</p>
                <p className="text-[10px] text-[#52525b] font-mono">PNG, JPEG (crops and compression supported)</p>
              </div>
            )}
          </div>

          <button
            onClick={runScan}
            disabled={scanning || !scanFile}
            className="w-full py-2 bg-[#c2835e] hover:bg-[#b3744f] text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {scanning ? "COMPUTING PERCEPTUAL HASHES..." : "RUN SCANNER & VERIFY IMAGE"}
          </button>

          {scanResult && (
            <div className={`p-4 border rounded-xl space-y-2 animate-fade-in ${
              scanResult.match_found 
                ? "bg-red-500/10 border-red-500/20 text-red-200" 
                : "bg-green-500/10 border-green-500/20 text-green-200"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider">Scan Telemetry</span>
                <span className="font-mono text-xs font-semibold">
                  Similarity: {(scanResult.similarity * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs font-light">
                {scanResult.match_found 
                  ? "CRITICAL MATCH DETECTED: Perceptual hash aligns with an issued student question sheet!" 
                  : "NO THREAT DETECTED: The screenshot does not match any watermarked files in our active registry."}
              </p>
              {scanResult.match_found && (
                <div className="pt-2 border-t border-red-500/10 grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-[#52525b] block">Roll Number</span>
                    <span className="text-red-400 font-bold">{scanResult.roll_no}</span>
                  </div>
                  <div>
                    <span className="text-[#52525b] block">Center ID</span>
                    <span className="text-red-400 font-bold">{scanResult.center_id}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 bg-[#141418] border border-[#232329] rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[#232329] bg-[#1a1a1f]/35 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold text-[#e4e4e7] uppercase tracking-wider">Alerts Feed</p>
              <p className="text-[11px] text-[#52525b] mt-0.5">Real-time leak reports from Telegram client honeypots</p>
            </div>
            <div className="flex gap-1">
              {["ALL", "PENDING", "CONFIRMED", "ESCALATED"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all ${
                    filter === f 
                      ? "bg-[#c2835e]/15 border-[#c2835e]/30 text-[#c2835e]" 
                      : "border-[#232329] text-[#52525b] hover:text-[#a1a1aa]"
                  }`}
                >
                  {f.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[#232329]/40 max-h-[500px] overflow-y-auto">
            {loading ? (
              <p className="p-6 text-center text-xs font-mono text-[#52525b]">Syncing database records...</p>
            ) : alerts.length === 0 ? (
              <p className="p-6 text-center text-xs font-mono text-[#52525b]">No active alerts found matching filter</p>
            ) : (
              alerts.map((a) => (
                <div key={a.id} className="p-5 space-y-3 hover:bg-[#1f1f25]/15 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[#c2835e]">#{a.id}</span>
                      <span className="text-sm font-medium text-white">{a.channel_name}</span>
                      <span className="text-[10px] font-mono text-[#52525b]">msg_id: {a.message_id}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono font-semibold ${
                        a.similarity_score > 0.85 ? "text-[#f87171]" : "text-yellow-400"
                      }`}>
                        {(a.similarity_score * 100).toFixed(0)}% Match
                      </span>
                      <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded ${STATUS_STYLE[a.status] || ""}`}>
                        {a.status.toLowerCase()}
                      </span>
                    </div>
                  </div>
                  
                  {a.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => confirm(a.id)}
                        className="px-3 py-1.5 text-[11px] font-medium bg-[#c2835e]/15 hover:bg-[#c2835e]/25 text-[#c2835e] rounded-lg border border-[#c2835e]/20 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => escalate(a.id)}
                        className="px-3 py-1.5 text-[11px] font-medium bg-red-500/10 hover:bg-red-500/20 text-[#f87171] rounded-lg border border-red-500/15 transition-colors"
                      >
                        Escalate to CBI
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
