import { Router } from "express";
import { getCurrentUser } from "../middleware/auth";
import type { AuthedRequest } from "../middleware/auth";
import { DisputeCreate, DisputeUpdate } from "../schemas/dispute";
import * as disputeService from "../services/disputeService";

const router = Router();

// ----------------------------------------------------------------
// Filter helper: maps frontend filter tabs to status values
// ----------------------------------------------------------------
const FILTER_TO_STATUSES: Record<string, string[]> = {
  active: ["new", "pending_approval", "sent", "followup_1", "followup_2"],
  resolved: ["resolved"],
  escalated: ["escalated"],
};

// POST /api/disputes — create a new dispute
router.post("", getCurrentUser, async (req: AuthedRequest, res) => {
  try {
    const data = DisputeCreate.parse(req.body);
    const dispute = await disputeService.createDispute(req.user!.id, data);
    res.json(dispute);
  } catch (e: any) {
    res.status(e.status ?? 400).json({ error: e.message ?? "Validation error" });
  }
});

// GET /api/disputes — list disputes with optional filtering and pagination
router.get("", getCurrentUser, async (req: AuthedRequest, res) => {
  try {
    const filter = req.query.filter as string | undefined;
    const status = req.query.status as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const per_page = Math.min(100, Math.max(1, parseInt(req.query.per_page as string) || 10));

    // Determine which statuses to filter by
    let statuses: string[] | undefined;
    if (filter && FILTER_TO_STATUSES[filter]) {
      statuses = FILTER_TO_STATUSES[filter];
    } else if (status) {
      statuses = [status];
    }

    const { disputes, total } = await disputeService.getDisputes(
      req.user!.id,
      statuses,
      page,
      per_page
    );

    res.json({ disputes, total, page, per_page });
  } catch (e: any) {
    res.status(e.status ?? 500).json({ error: e.message });
  }
});

// GET /api/disputes/:disputeId — get a single dispute with email thread
router.get("/:disputeId", getCurrentUser, async (req: AuthedRequest, res) => {
  try {
    const disputeId = req.params.disputeId as string;
    const dispute = await disputeService.getDisputeDetail(req.user!.id, disputeId);
    res.json(dispute);
  } catch (e: any) {
    res.status(e.status ?? 500).json({ error: e.message });
  }
});

// PATCH /api/disputes/:disputeId — update status / resolution / amount_recovered
router.patch("/:disputeId", getCurrentUser, async (req: AuthedRequest, res) => {
  try {
    const data = DisputeUpdate.parse(req.body);
    const disputeId = req.params.disputeId as string;
    res.json(await disputeService.updateDispute(req.user!.id, disputeId, data));
  } catch (e: any) {
    res.status(e.status ?? 500).json({ error: e.message });
  }
});

// DELETE /api/disputes/:disputeId
router.delete("/:disputeId", getCurrentUser, async (req: AuthedRequest, res) => {
  try {
    await disputeService.deleteDispute(req.user!.id, req.params.disputeId);
    res.status(204).end();
  } catch (e: any) {
    res.status(e.status ?? 500).json({ error: e.message });
  }
});

// POST /api/disputes/:disputeId/generate-email
// Generates a dispute email draft (stored as pending_draft)
router.post(
  "/:disputeId/generate-email",
  getCurrentUser,
  async (req: AuthedRequest, res) => {
    try {
      const disputeId = req.params.disputeId;
      const email = await disputeService.generateEmailDraft(req.user!.id, disputeId);
      res.json(email);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  }
);

// POST /api/disputes/:disputeId/send-email
// Immediately sends an email (bypasses approval flow)
router.post(
  "/:disputeId/send-email",
  getCurrentUser,
  async (req: AuthedRequest, res) => {
    try {
      const disputeId = req.params.disputeId;
      const edited = req.body as { subject?: string; body?: string };
      await disputeService.sendEmail(req.user!.id, disputeId, edited);
      res.json({ status: "sent" });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  }
);

// GET /api/disputes/:disputeId/emails — list sent email logs
router.get(
  "/:disputeId/emails",
  getCurrentUser,
  async (req: AuthedRequest, res) => {
    try {
      const disputeId = req.params.disputeId;
      const emails = await disputeService.getEmailLogs(req.user!.id, disputeId);
      res.json(emails);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  }
);

// GET /api/disputes/:disputeId/pending-draft — get the pending email draft
router.get(
  "/:disputeId/pending-draft",
  getCurrentUser,
  async (req: AuthedRequest, res) => {
    try {
      const disputeId = req.params.disputeId;
      const draft = await disputeService.getPendingDraft(req.user!.id, disputeId);
      if (!draft) return res.status(404).json({ error: "No pending draft" });
      res.json(draft);
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  }
);

// POST /api/disputes/:disputeId/approve-send — approve and send the pending draft
router.post(
  "/:disputeId/approve-send",
  getCurrentUser,
  async (req: AuthedRequest, res) => {
    try {
      const disputeId = req.params.disputeId;
      const edited = req.body as { subject?: string; body?: string };
      await disputeService.approveSend(req.user!.id, disputeId, edited);
      res.json({ status: "sent" });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  }
);

// POST /api/disputes/:disputeId/skip — skip the pending draft without sending
router.post(
  "/:disputeId/skip",
  getCurrentUser,
  async (req: AuthedRequest, res) => {
    try {
      const disputeId = req.params.disputeId;
      await disputeService.skipDraft(req.user!.id, disputeId);
      res.json({ status: "skipped" });
    } catch (e: any) {
      res.status(e.status ?? 500).json({ error: e.message });
    }
  }
);

export default router;
