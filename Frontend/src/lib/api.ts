import axios from "axios";
import type {
  User,
  Dispute,
  DisputeCreate,
  DisputeDetail,
  DisputeListResponse,
  GeneratedEmail,
  EmailLog,
  DashboardStats,
  UserSettings,
  SheetValidationResult,
} from "./types";

// ============================================================
// Base API client
// ============================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Axios instance with credentials (cookies) included on every request
export const axiosClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Generic helper that wraps axios for typed responses
export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const method = (options?.method ?? "GET").toLowerCase() as
    | "get"
    | "post"
    | "put"
    | "patch"
    | "delete";

  const body = options?.body ? JSON.parse(options.body as string) : undefined;

  try {
    const res = await axiosClient.request<T>({
      url: path,
      method,
      data: body,
      headers: options?.headers as Record<string, string>,
    });
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const detail = err.response?.data?.detail;
      throw new Error(detail || `HTTP ${err.response?.status ?? "unknown"}`);
    }
    throw err;
  }
}

// ============================================================
// Typed API methods
// ============================================================

export const api = {
  auth: {
    me: () => apiFetch<User>("/auth/me"),
    logout: () => apiFetch<void>("/auth/logout", { method: "POST" }),
    loginUrl: () => `${API_BASE}/auth/login`,
    /**
     * Redirect the browser to the backend OAuth login endpoint.
     * The backend issues a 302 redirect to Google — the browser must
     * follow this natively, so we use window.location.href directly.
     * Axios cannot intercept browser-level OAuth redirects.
     */
    login: () => {
      window.location.href = `${API_BASE}/auth/login`;
    },
  },

  dashboard: {
    stats: () => apiFetch<DashboardStats>("/api/dashboard/stats"),
  },

  disputes: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
      return apiFetch<DisputeListResponse>(`/api/disputes${qs}`);
    },
    get: (id: string) => apiFetch<DisputeDetail>(`/api/disputes/${id}`),
    create: (data: DisputeCreate) =>
      apiFetch<Dispute>("/api/disputes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Dispute>) =>
      apiFetch<Dispute>(`/api/disputes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    generateEmail: (id: string) =>
      apiFetch<GeneratedEmail>(`/api/disputes/${id}/generate-email`, {
        method: "POST",
      }),
    sendEmail: (id: string, email?: { subject: string; body: string }) =>
      apiFetch<void>(`/api/disputes/${id}/send-email`, {
        method: "POST",
        body: JSON.stringify(email ?? {}),
      }),
    getEmails: (id: string) =>
      apiFetch<EmailLog[]>(`/api/disputes/${id}/emails`),
    getPendingDraft: (id: string) =>
      apiFetch<GeneratedEmail>(`/api/disputes/${id}/pending-draft`),
    approveSend: (id: string, edited?: { subject: string; body: string }) =>
      apiFetch<void>(`/api/disputes/${id}/approve-send`, {
        method: "POST",
        body: JSON.stringify(edited ?? {}),
      }),
    skip: (id: string) =>
      apiFetch<void>(`/api/disputes/${id}/skip`, { method: "POST" }),
  },

  settings: {
    update: (data: Partial<UserSettings>) =>
      apiFetch<User>("/api/users/me/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    updateApprovalMode: (mode: "auto" | "manual") =>
      apiFetch<User>("/api/users/me/settings", {
        method: "PATCH",
        body: JSON.stringify({ approval_mode: mode }),
      }),
    validateSheet: (spreadsheetId: string) =>
      apiFetch<SheetValidationResult>(
        `/api/sheets/validate?spreadsheet_id=${encodeURIComponent(spreadsheetId)}`
      ),
  },
} as const;
