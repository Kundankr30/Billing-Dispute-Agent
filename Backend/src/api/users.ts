import { Router } from "express";
import { getCurrentUser, AuthedRequest } from "../middleware/auth";
import { db } from "../firestoreClient";
import { z } from "zod";

const router = Router();

// Zod schema for PATCH body
const UserSettingsUpdate = z.object({
  approval_mode: z.enum(["auto", "manual"]).optional(),
  spreadsheet_id: z.string().nullable().optional(),
  digest_frequency: z.enum(["daily", "weekly", "off"]).optional(),
  notification_email: z.string().email().nullable().optional(),
  slack_webhook_url: z.string().url().nullable().optional(),
});

/**
 * PATCH /api/users/me/settings
 * Updates the user's settings fields (merges into Firestore user doc).
 */
router.patch("/me/settings", getCurrentUser, async (req: AuthedRequest, res) => {
  try {
    const data = UserSettingsUpdate.parse(req.body);

    // Filter out undefined values so Firestore merge works correctly
    const update: Record<string, any> = { updated_at: new Date() };
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) update[key] = val === null ? null : val;
    }

    const userRef = db.collection("users").doc(req.user!.id);
    await userRef.set(update, { merge: true });

    const doc = await userRef.get();
    const { google_refresh_token_encrypted, ...safeData } = doc.data()!;
    res.json({ id: req.user!.id, ...safeData });
  } catch (e: any) {
    res.status(e.status ?? 400).json({ error: e.message ?? "Validation error" });
  }
});

export default router;
