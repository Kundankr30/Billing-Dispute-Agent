"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, Send, X, Pencil, Loader2 } from "lucide-react";
import type { GeneratedEmail } from "@/lib/types";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface PendingApprovalProps {
  disputeId: string;
  draft: GeneratedEmail;
  onResolved: () => void;
}

export function PendingApproval({
  disputeId,
  draft,
  onResolved,
}: PendingApprovalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleApprove() {
    setIsProcessing(true);
    try {
      if (isEditing) {
        await api.disputes.approveSend(disputeId, { subject, body });
        toast.success("Email edited and sent successfully.");
      } else {
        await api.disputes.approveSend(disputeId);
        toast.success("Email approved and sent successfully.");
      }
      onResolved();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to approve and send email."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSkip() {
    setIsProcessing(true);
    try {
      await api.disputes.skip(disputeId);
      toast.success("Email draft skipped.");
      onResolved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to skip.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Alert className="border-purple-200 bg-purple-50">
      <AlertCircle className="h-4 w-4 text-purple-600" />
      <AlertTitle className="text-purple-900">
        Email Awaiting Your Approval
      </AlertTitle>
      <AlertDescription className="mt-3 space-y-4">
        <p className="text-sm text-purple-800">
          This email has been generated and is ready to send. Please review and
          approve, or make edits before sending.
        </p>

        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Draft Email</CardTitle>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 h-8"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isEditing ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="approval-subject" className="text-xs">
                    Subject
                  </Label>
                  <Input
                    id="approval-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="approval-body" className="text-xs">
                    Body
                  </Label>
                  <Textarea
                    id="approval-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={10}
                    className="font-mono text-xs"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Subject
                  </p>
                  <p className="mt-0.5 text-sm font-medium">{subject}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Body
                  </p>
                  <div
                    className="mt-1 rounded-md border bg-white p-3 text-xs leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: (body ?? "").replace(/\n/g, "<br />"),
                    }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button
            onClick={handleApprove}
            disabled={isProcessing}
            className="gap-2"
            size="sm"
          >
            {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
            <Send className="h-3 w-3" />
            {isEditing ? "Send Edited Email" : "Approve & Send"}
          </Button>
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubject(draft.subject);
                setBody(draft.body);
                setIsEditing(false);
              }}
            >
              Cancel Edit
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSkip}
            disabled={isProcessing}
            className="gap-2"
          >
            <X className="h-3 w-3" /> Skip
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
