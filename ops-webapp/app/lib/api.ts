const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export const api = {
  health: () => request("/api/v1/health"),

  login: (data: { username: string; password?: string; role: string; center_id?: string }) =>
    request("/api/v1/auth/login", { method: "POST", body: JSON.stringify(data) }),

  getCenters: () => request("/api/v1/center"),
  getCenter: (id: string) => request(`/api/v1/center/${id}`),
  createCenter: (data: Record<string, string | number>) =>
    request("/api/v1/center?" + new URLSearchParams(data as Record<string, string>), { method: "POST" }),
  calcRisk: (id: string) => request(`/api/v1/center/${id}/risk-score`, { method: "POST" }),

  translate: (data: { master_paper: Record<string, unknown>; languages: string[] }) =>
    request("/api/v1/pipeline/translate", { method: "POST", body: JSON.stringify(data) }),

  watermark: (rollNo: string, centerId: string, file: File) => {
    const fd = new FormData();
    fd.append("image", file);
    return request(`/api/v1/pipeline/watermark?roll_no=${rollNo}&center_id=${centerId}`, { method: "POST", body: fd, headers: {} });
  },

  sealPaper: (centerId: string, paperData: string) =>
    request("/api/v1/pipeline/preprint/seal", { method: "POST", body: JSON.stringify({ center_id: centerId, paper_data: paperData }) }),

  unlockPaper: (centerId: string, totpCode: string) =>
    request("/api/v1/pipeline/preprint/unlock", { method: "POST", body: JSON.stringify({ center_id: centerId, totp_code: totpCode }) }),

  getTotp: (centerId: string) => request(`/api/v1/pipeline/preprint/totp/${centerId}`),
  getPreprintState: (centerId: string) => request(`/api/v1/pipeline/preprint/state/${centerId}`),

  decodeImage: (file: File) => {
    const fd = new FormData();
    fd.append("image", file);
    return request("/api/v1/pipeline/decode", { method: "POST", body: fd, headers: {} });
  },

  getAlerts: (status?: string) => request(`/api/v1/telegram-hunter/alerts${status ? `?status=${status}` : ""}`),
  confirmAlert: (id: number) => request(`/api/v1/telegram-hunter/alerts/${id}/confirm`, { method: "POST" }),
  escalateAlert: (id: number) => request(`/api/v1/telegram-hunter/alerts/${id}/escalate`, { method: "POST" }),
  scanTelegramLeak: (file: File) => {
    const fd = new FormData();
    fd.append("image", file);
    return request("/api/v1/telegram-hunter/scan", { method: "POST", body: fd, headers: {} });
  },

  exportAudit: () => request("/api/v1/audit/export"),
  verifyAudit: () => request("/api/v1/audit/verify"),

  killSwitch: (centerId: string, mode: string, officerToken: string) =>
    request(`/api/v1/killswitch/${centerId}`, { method: "POST", body: JSON.stringify({ center_id: centerId, mode, officer_token: officerToken }) }),
  killSwitchStatus: (centerId: string) => request(`/api/v1/killswitch/status/${centerId}`),

  issueShard: (data: { translator_id: string; section: string; device_id: string; shard_data: string }) =>
    request("/api/v1/pipeline/translator-shield/issue", { method: "POST", body: JSON.stringify(data) }),
  verifyShard: (translatorId: string, deviceId: string) =>
    request(`/api/v1/pipeline/translator-shield/verify/${translatorId}?device_id=${deviceId}`),
  combineShards: () =>
    request("/api/v1/pipeline/translator-shield/combine", { method: "POST" }),
};
