"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/StatusBadge";
import { EmailPreview } from "@/components/EmailPreview";
import { EmailThread } from "@/components/EmailThread";
import { PendingApproval } from "@/components/PendingApproval";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { DisputeDetail, GeneratedEmail } from "@/lib/types";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  DollarSign,
  Building2,
  FileText,
} from "lucide-react";

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.id as string;

  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const [resolveOpen, setResolveOpen] = useState(false);
  const [amountRecovered, setAmountRecovered] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const [closeOpen, setCloseOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const fetchDispute = useCallback(async () => {
    try {
      const data = await api.disputes.get(disputeId);
      setDispute(data);
      setGeneratedEmail(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load dispute."
      );
    } finally {
      setIsLoading(false);
    }
  }, [disputeId]);

  useEffect(() => {
    fetchDispute();
  }, [fetchDispute]);

  async function handleGenerateEmail() {
    setIsGenerating(true);
    try {
      const email = await api.disputes.generateEmail(disputeId);
      setGeneratedEmail(email);
      toast.success("Email generated successfully.");
      await fetchDispute();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate email."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleResolve() {
    setIsResolving(true);
    try {
      await api.disputes.update(disputeId, {
        status: "resolved",
        amount_recovered: parseFloat(amountRecovered) || 0,
      });
      toast.success("Dispute marked as resolved.");
      setResolveOpen(false);
      await fetchDispute();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resolve.");
    } finally {
      setIsResolving(false);
    }
  }

  async function handleClose() {
    setIsClosing(true);
    try {
      await api.disputes.update(disputeId, { status: "closed" });
      toast.success("Dispute closed.");
      setCloseOpen(false);
      await fetchDispute();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to close.");
    } finally {
      setIsClosing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <XCircle className="mb-4 h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Dispute Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The dispute you're looking for doesn't exist.
        </p>
        <Button className="mt-6" onClick={() => router.push("/disputes")}>
          Back to Disputes
        </Button>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      amount
    );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => router.push("/disputes")}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
          {dispute.status !== "resolved" && dispute.status !== "closed" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResolveOpen(true)}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" /> Mark Resolved
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCloseOpen(true)}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" /> Close Dispute
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Dispute Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{dispute.vendor_name}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Dispute #{dispute.id.slice(0, 8)}
              </p>
            </div>
            <StatusBadge status={dispute.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-red-50 p-2">
                <DollarSign className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-semibold">
                  {formatCurrency(dispute.amount, dispute.currency)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Filed Date</p>
                <p className="font-semibold">{formatDate(dispute.filed_date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-purple-50 p-2">
                <Building2 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contact Email</p>
                <p className="font-semibold text-sm">{dispute.contact_email}</p>
              </div>
            </div>
            {dispute.amount_recovered !== undefined &&
              dispute.amount_recovered > 0 && (
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-green-50 p-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Recovered</p>
                    <p className="font-semibold">
                      {formatCurrency(
                        dispute.amount_recovered,
                        dispute.currency
                      )}
                    </p>
                  </div>
                </div>
              )}
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Issue Description</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {dispute.issue_description}
            </p>
          </div>

          {dispute.evidence_description && (
            <div>
              <p className="text-sm font-medium mb-1">Evidence</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {dispute.evidence_description}
              </p>
            </div>
          )}

          {dispute.account_number && (
            <div>
              <p className="text-sm font-medium mb-1">Account Number</p>
              <p className="text-sm text-muted-foreground">
                {dispute.account_number}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Approval */}
      {dispute.status === "pending_approval" && dispute.pending_draft && (
        <PendingApproval
          disputeId={disputeId}
          draft={dispute.pending_draft}
          onResolved={fetchDispute}
        />
      )}

      {/* Email Workflow */}
      {dispute.status === "new" && !generatedEmail && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Mail className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              Ready to Generate Email
            </h3>
            <p className="mb-6 text-sm text-muted-foreground max-w-md">
              Generate a professional dispute email using AI based on the issue
              description and evidence provided.
            </p>
            <Button
              onClick={handleGenerateEmail}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
              <Mail className="h-4 w-4" /> Generate Email
            </Button>
          </CardContent>
        </Card>
      )}

      {generatedEmail && (
        <EmailPreview
          disputeId={disputeId}
          email={generatedEmail}
          onSent={fetchDispute}
        />
      )}

      {/* Email Thread */}
      <EmailThread emails={dispute.emails ?? []} />

      {/* Resolve Dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Dispute as Resolved</DialogTitle>
            <DialogDescription>
              Enter the amount recovered (if any) and mark this dispute as
              resolved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amountRecovered">Amount Recovered</Label>
              <Input
                id="amountRecovered"
                type="number"
                step="0.01"
                min="0"
                value={amountRecovered}
                onChange={(e) => setAmountRecovered(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank or enter 0 if nothing was recovered.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={isResolving}>
              {isResolving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Dispute</DialogTitle>
            <DialogDescription>
              Are you sure you want to close this dispute? This action will mark
              it as closed without resolution.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClose}
              disabled={isClosing}
            >
              {isClosing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Close Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
