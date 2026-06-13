"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "../../lib/api";

interface Student {
  roll_no: string;
  name: string;
  center_id: string;
}

export default function WatermarkPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ batch_id: string; image_url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ roll_no: string; batch_id: string; image_url: string; time: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getCenters().then(async (centers: { id: string }[]) => {
      const allStudents: Student[] = [];
      for (const c of centers.slice(0, 3)) {
        const detail = await api.getCenter(c.id);
        if (detail.students) allStudents.push(...detail.students);
      }
      setStudents(allStudents);
    });
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const embed = async () => {
    if (!file || !selectedStudent) return;
    setLoading(true);
    try {
      const res = await api.watermark(selectedStudent.roll_no, selectedStudent.center_id, file);
      setResult({ batch_id: res.batch_id, image_url: res.image_url });
      setHistory((prev) => [
        { roll_no: selectedStudent.roll_no, batch_id: res.batch_id, image_url: res.image_url, time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-semibold">M2 — Watermark</h1>
        <p className="text-[12px] text-text-muted mt-0.5">
          Embed per-student invisible DCT watermark — survives JPEG/WhatsApp compression
        </p>
      </div>

      <div className="grid grid-cols-[280px_1fr] gap-5">
        <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Students</p>
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {students.map((s) => (
              <button
                key={s.roll_no}
                onClick={() => { setSelectedStudent(s); setResult(null); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-[12px] transition-colors ${
                  selectedStudent?.roll_no === s.roll_no
                    ? "bg-accent-dim text-accent"
                    : "text-text-secondary hover:bg-bg-hover"
                }`}
              >
                <span className="font-mono text-[11px]">{s.roll_no}</span>
                <span className="ml-2 text-text-muted">{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-bg-card border border-border rounded-xl p-5 space-y-4">
            {selectedStudent ? (
              <>
                <div className="flex items-center gap-4 pb-3 border-b border-border/50">
                  <div>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider">Student</p>
                    <p className="text-[14px] font-medium">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider">Roll No</p>
                    <p className="text-[13px] font-mono text-accent">{selectedStudent.roll_no}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider">Center</p>
                    <p className="text-[13px] font-mono">{selectedStudent.center_id}</p>
                  </div>
                </div>

                <div
                  className="border border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent/30 transition-colors"
                  onClick={() => inputRef.current?.click()}
                >
                  <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                  {preview ? (
                    <img src={preview} alt="Preview" className="max-h-[200px] mx-auto rounded-lg" />
                  ) : (
                    <div>
                      <p className="text-[13px] text-text-secondary">Drop paper image or click to browse</p>
                      <p className="text-[11px] text-text-muted mt-1">JPEG, PNG — the watermark survives compression</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={embed}
                  disabled={loading || !file}
                  className="px-4 py-2.5 bg-accent text-white rounded-lg text-[12px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 w-full"
                >
                  {loading ? "Embedding watermark..." : "Embed Watermark"}
                </button>
              </>
            ) : (
              <div className="py-12 text-center text-[13px] text-text-muted">
                Select a student from the list to begin
              </div>
            )}
          </div>

          {result && (
            <div className="bg-green-dim border border-green/20 rounded-xl p-4 animate-fade-in">
              <p className="text-[10px] font-medium text-green uppercase tracking-wider mb-3">Watermark Embedded</p>
              <div className="flex gap-6">
                <div className="flex-1">
                  <p className="text-[10px] text-text-muted mb-1">Batch ID</p>
                  <p className="text-[13px] font-mono font-medium text-green">{result.batch_id}</p>
                </div>
                <div className="w-[180px]">
                  <p className="text-[10px] text-text-muted mb-1">Watermarked Image</p>
                  <img src={`http://localhost:8000${result.image_url}`} alt="Watermarked"
                    className="w-full rounded-lg border border-green/20" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-3">Recent Watermarks</p>
          <div className="space-y-1.5">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-4 text-[12px] py-2 border-b border-border/30 last:border-0">
                <img src={`http://localhost:8000${h.image_url}`} alt="" className="w-10 h-10 rounded object-cover" />
                <span className="font-mono text-accent">{h.roll_no}</span>
                <span className="font-mono text-text-muted">{h.batch_id}</span>
                <span className="text-text-muted ml-auto">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
