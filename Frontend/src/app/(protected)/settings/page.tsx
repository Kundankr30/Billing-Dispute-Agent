"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  Sheet,
  Mail,
  Bell,
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ApprovalMode, DigestFrequency } from "@/lib/types";

export default function SettingsPage() {
  const { user, refresh } = useAuth();

  // Google Sheets
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message?: string;
  } | null>(null);

  // Approval Mode
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>("manual");
  const [isUpdatingApproval, setIsUpdatingApproval] = useState(false);

  // Notifications
  const [digestFrequency, setDigestFrequency] = useState<DigestFrequency>("weekly");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Delete account
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.settings) {
      setSpreadsheetId(user.settings.spreadsheet_id ?? "");
      setApprovalMode(user.settings.approval_mode);
      setDigestFrequency(user.settings.digest_frequency);
      setNotificationEmail(user.settings.notification_email ?? user.email);
      setSlackWebhook(user.settings.slack_webhook_url ?? "");
    }
  }, [user]);

  async function handleValidateSheet() {
    if (!spreadsheetId.trim()) {
      toast.error("Please enter a Spreadsheet ID.");
      return;
    }
    setIsValidating(true);
    setValidationResult(null);
    try {
      const result = await api.settings.validateSheet(spreadsheetId.trim());
      setValidationResult(result);
      if (result.valid) {
        toast.success("Google Sheet connection is valid.");
      } else {
        toast.error(result.message ?? "Invalid Google Sheet configuration.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to validate sheet.");
      setValidationResult({ valid: false, message: err instanceof Error ? err.message : "Validation failed" });
    } finally {
      setIsValidating(false);
    }
  }

  async function handleSaveSheet() {
    setIsSaving(true);
    try {
      await api.settings.update({ spreadsheet_id: spreadsheetId.trim() || undefined });
      toast.success("Google Sheets settings saved.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDisconnectSheet() {
    setIsSaving(true);
    try {
      await api.settings.update({ spreadsheet_id: undefined });
      setSpreadsheetId("");
      setValidationResult(null);
      toast.success("Google Sheet disconnected.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect sheet.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleApprovalModeChange(mode: ApprovalMode) {
    setIsUpdatingApproval(true);
    try {
      await api.settings.updateApprovalMode(mode);
      setApprovalMode(mode);
      toast.success(`Approval mode changed to ${mode === "auto" ? "Auto-send" : "Review before send"}.`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update approval mode.");
    } finally {
      setIsUpdatingApproval(false);
    }
  }

  async function handleSaveNotifications() {
    setIsSavingNotifications(true);
    try {
      await api.settings.update({
        digest_frequency: digestFrequency,
        notification_email: notificationEmail.trim() || undefined,
        slack_webhook_url: slackWebhook.trim() || undefined,
      });
      toast.success("Notification settings saved.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save notification settings.");
    } finally {
      setIsSavingNotifications(false);
    }
  }

  function handleExportData() {
    // Frontend-only export - in a real implementation, this would call a backend endpoint
    toast.info("Export functionality would call a backend endpoint if available.");
    // Placeholder: download user data as JSON
    const data = { user, message: "Export endpoint not yet implemented" };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `disputeflow-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDeleteAccount() {
    setDeleteDialogOpen(true);
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      {/* Google Sheets */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sheet className="h-5 w-5 text-green-600" />
            <CardTitle>Google Sheets Integration</CardTitle>
          </div>
          <CardDescription>
            Connect a Google Sheet to sync disputes and track them in a spreadsheet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="spreadsheetId">Spreadsheet ID</Label>
            <Input
              id="spreadsheetId"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              placeholder="1AbC...xyz"
            />
            <p className="text-xs text-muted-foreground">
              Find this in your Sheet URL between <code>/d/</code> and <code>/edit</code>
            </p>
          </div>

          {validationResult && (
            <Alert variant={validationResult.valid ? "default" : "destructive"}>
              {validationResult.valid ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {validationResult.message ?? (validationResult.valid ? "Connection valid" : "Connection failed")}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleValidateSheet}
              disabled={isValidating || !spreadsheetId.trim()}
            >
              {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
            <Button onClick={handleSaveSheet} disabled={isSaving || !spreadsheetId.trim()}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
            {user?.settings?.spreadsheet_id && (
              <Button variant="destructive" onClick={handleDisconnectSheet} disabled={isSaving}>
                Disconnect Sheet
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Approval */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <CardTitle>Email Approval</CardTitle>
          </div>
          <CardDescription>
            Control how generated dispute emails are sent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={approvalMode}
            onValueChange={(v) => handleApprovalModeChange(v as ApprovalMode)}
            disabled={isUpdatingApproval}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="auto" id="approval-auto" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="approval-auto" className="font-semibold cursor-pointer">
                  Auto-send
                </Label>
                <p className="text-sm text-muted-foreground">
                  Generated dispute emails are sent automatically without review.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="manual" id="approval-manual" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="approval-manual" className="font-semibold cursor-pointer">
                  Review before send
                </Label>
                <p className="text-sm text-muted-foreground">
                  Review and approve every generated email before it is sent.
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-600" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure how you receive updates about your disputes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="digestFrequency">Digest Frequency</Label>
            <Select
              value={digestFrequency}
              onValueChange={(v) => setDigestFrequency(v as DigestFrequency)}
            >
              <SelectTrigger id="digestFrequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="off">Off</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notificationEmail">Notification Email</Label>
            <Input
              id="notificationEmail"
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder={user?.email ?? "your@email.com"}
            />
            <p className="text-xs text-muted-foreground">
              Defaults to your login email if left blank.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
            <Input
              id="slackWebhook"
              type="url"
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
            />
            <p className="text-xs text-muted-foreground">
              Optional: receive notifications in Slack.
            </p>
          </div>

          <Button onClick={handleSaveNotifications} disabled={isSavingNotifications}>
            {isSavingNotifications && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Notification Settings
          </Button>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-600" />
            <CardTitle>Data &amp; Privacy</CardTitle>
          </div>
          <CardDescription>
            Export or delete your account data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <Download className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Export My Data</p>
              <p className="text-sm text-muted-foreground">
                Download all your disputes and emails as JSON.
              </p>
              <Button variant="outline" size="sm" className="mt-2" onClick={handleExportData}>
                <Download className="mr-2 h-4 w-4" /> Export Data
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-destructive">Delete My Account</p>
              <p className="text-sm text-muted-foreground">
                This will permanently delete all your data including disputes, emails, and settings.
              </p>
              <Button variant="destructive" size="sm" className="mt-2" onClick={handleDeleteAccount}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This will permanently delete all your data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Account deletion endpoint is not yet implemented. Please contact support to delete your account.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                toast.error("Account deletion is not yet implemented.");
                setDeleteDialogOpen(false);
              }}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
