// ============================================================
// Application Types
// ============================================================

export type DisputeStatus =
  | "new"
  | "pending_approval"
  | "sent"
  | "follow_up_1"
  | "follow_up_2"
  | "escalated"
  | "resolved"
  | "closed";

export type ApprovalMode = "auto" | "manual";

export type DigestFrequency = "daily" | "weekly" | "off";

export type Currency = "USD" | "EUR" | "GBP" | "INR" | "BRL" | "AUD";

// ============================================================
// User
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  // Settings fields stored flat in Firestore (not nested under 'settings')
  approval_mode?: ApprovalMode;
  spreadsheet_id?: string;
  digest_frequency?: DigestFrequency;
  notification_email?: string;
  slack_webhook_url?: string;
  created_at?: string;
  // Virtual computed property for backward compat with components that use user.settings
  settings: UserSettings;
}

export interface UserSettings {
  approval_mode: ApprovalMode;
  spreadsheet_id?: string;
  digest_frequency: DigestFrequency;
  notification_email?: string;
  slack_webhook_url?: string;
}

// ============================================================
// Disputes
// ============================================================

export interface Dispute {
  id: string;
  vendor_name: string;
  contact_email: string;
  issue_description: string;
  amount: number;
  currency: Currency;
  evidence_description?: string;
  account_number?: string;
  status: DisputeStatus;
  amount_recovered?: number;
  filed_date: string;
  updated_at: string;
  next_action?: string;
  next_action_date?: string;
}

export interface DisputeCreate {
  vendor_name: string;
  contact_email: string;
  issue_description: string;
  amount: number;
  currency: Currency;
  evidence_description?: string;
  account_number?: string;
}

export interface DisputeDetail extends Dispute {
  emails: EmailLog[];
  pending_draft?: GeneratedEmail;
}

export interface DisputeListResponse {
  disputes: Dispute[];
  total: number;
  page: number;
  per_page: number;
}

// ============================================================
// Emails
// ============================================================

export interface GeneratedEmail {
  id?: string;
  subject: string;
  body: string;
  email_type?: string;
  created_at?: string;
}

export interface EmailLog {
  id: string;
  subject: string;
  body: string;
  email_type: string;
  sent_at: string;
  status: string;
}

// ============================================================
// Dashboard
// ============================================================

export interface DashboardStats {
  active_disputes: number;
  total_disputed: number;
  recovered_this_month: number;
  success_rate: number;
}

// ============================================================
// Sheets
// ============================================================

export interface SheetValidationResult {
  valid: boolean;
  message?: string;
  sheet_name?: string;
  columns?: string[];
}
