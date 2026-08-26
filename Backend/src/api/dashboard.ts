import { Router } from "express";
import { getCurrentUser, AuthedRequest } from "../middleware/auth";
import { db } from "../firestoreClient";

const router = Router();

router.get(
  "/stats",
  getCurrentUser,
  async (req: AuthedRequest, res) => {
    const snapshot = await db
      .collection("disputes")
      .where("user_id", "==", req.user!.id)
      .get();

    const disputes = snapshot.docs.map((doc) => doc.data());

    const total = disputes.length;

    const total_amount = disputes.reduce(
      (sum, dispute) => sum + Number(dispute.amount ?? 0),
      0
    );

    const recovered_amount = disputes.reduce(
      (sum, dispute) => sum + Number(dispute.amount_recovered ?? 0),
      0
    );

    const by_status: Record<string, number> = {};
    const by_currency: Record<string, number> = {};

    const activeStatuses = new Set([
      "new", "pending_approval", "sent", "followup_1", "followup_2",
    ]);
    let active_disputes = 0;

    // Compute recovered this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let recovered_this_month = 0;

    for (const dispute of disputes) {
      const status = dispute.status ?? "unknown";
      const currency = dispute.currency ?? "unknown";

      by_status[status] = (by_status[status] ?? 0) + 1;
      by_currency[currency] =
        (by_currency[currency] ?? 0) + Number(dispute.amount ?? 0);

      if (activeStatuses.has(status)) {
        active_disputes++;
      }

      if (status === "resolved" && dispute.updated_at) {
        const updatedAt =
          dispute.updated_at instanceof Date
            ? dispute.updated_at
            : (dispute.updated_at.toDate?.() ?? new Date(dispute.updated_at));
        if (updatedAt >= startOfMonth) {
          recovered_this_month += Number(dispute.amount_recovered ?? 0);
        }
      }
    }

    const success_rate = total > 0 ? (by_status["resolved"] ?? 0) / total : 0;

    const recovery_rate =
      total_amount > 0 ? recovered_amount / total_amount : 0;

    res.json({
      // Fields expected by the frontend DashboardStats type
      active_disputes,
      total_disputed: total_amount,
      recovered_this_month,
      success_rate,
      // Extra fields kept for completeness
      total,
      total_amount,
      by_status,
      by_currency,
      recovered_amount,
      recovery_rate,
    });
  }
);

export default router;
