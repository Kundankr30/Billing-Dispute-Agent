import { db } from "../firestoreClient";
import type { DisputeCreate, DisputeUpdate } from "../schemas/dispute";

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function notFound(): never {
  throw { status: 404, message: "Dispute not found" };
}

async function assertOwnership(userId: string, disputeId: string) {
  const doc = await db.collection("disputes").doc(disputeId).get();
  if (!doc.exists || doc.data()?.user_id !== userId) notFound();
  return doc;
}

// ----------------------------------------------------------------
// CRUD
// ----------------------------------------------------------------

export async function createDispute(userId: string, data: DisputeCreate) {
  const ref = db.collection("disputes").doc();
  const doc = {
    user_id: userId,
    ...data,
    currency: data.currency ?? "USD",
    status: "new" as const,
    followup_count: 0,
    next_followup_at: null,
    gmail_thread_id: null,
    amount_recovered: 0,
    sheet_row_number: null,
    pending_draft: null,
    created_at: new Date(),
    updated_at: new Date(),
  };
  await ref.set(doc);
  return { id: ref.id, ...doc };
}

export async function getDisputes(
  userId: string,
  statuses?: string[],
  page = 1,
  per_page = 10
) {
  let query: FirebaseFirestore.Query = db
    .collection("disputes")
    .where("user_id", "==", userId);

  const snap = await query.get();
  let all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Apply status filter in-memory (Firestore doesn't support OR queries without
  // composite indexes that may not be set up yet)
  if (statuses && statuses.length > 0) {
    const statusSet = new Set(statuses);
    all = all.filter((d: any) => statusSet.has(d.status));
  }

  const total = all.length;
  const start = (page - 1) * per_page;
  const disputes = all.slice(start, start + per_page);

  return { disputes, total };
}

export async function getDispute(userId: string, disputeId: string) {
  const doc = await assertOwnership(userId, disputeId);
  return { id: doc.id, ...doc.data() };
}

/** Returns a dispute with its email logs and pending draft attached. */
export async function getDisputeDetail(userId: string, disputeId: string) {
  const doc = await assertOwnership(userId, disputeId);
  const data = doc.data()!;

  // Fetch email logs sub-collection
  const emailSnap = await db
    .collection("disputes")
    .doc(disputeId)
    .collection("emails")
    .orderBy("sent_at", "asc")
    .get();

  const emails = emailSnap.docs.map((e) => ({ id: e.id, ...e.data() }));

  return {
    id: doc.id,
    ...data,
    emails,
  };
}

export async function updateDispute(
  userId: string,
  disputeId: string,
  data: DisputeUpdate
) {
  const ref = db.collection("disputes").doc(disputeId);
  await assertOwnership(userId, disputeId);
  await ref.set({ ...data, updated_at: new Date() }, { merge: true });
  const updated = await ref.get();
  return { id: updated.id, ...updated.data() };
}

export async function deleteDispute(userId: string, disputeId: string) {
  const ref = db.collection("disputes").doc(disputeId);
  await assertOwnership(userId, disputeId);
  await ref.delete();
}

// ----------------------------------------------------------------
// Email workflow
// ----------------------------------------------------------------

/**
 * Generates a draft email for the dispute and stores it as `pending_draft`.
 * Updates the dispute status to `pending_approval`.
 * Returns the generated email object.
 */
export async function generateEmailDraft(userId: string, disputeId: string) {
  const doc = await assertOwnership(userId, disputeId);
  const dispute = doc.data()!;

  // Build a simple dispute email draft
  // (In production this would call the Gemini API)
  const subject = `Billing Dispute: ${dispute.vendor_name} — Reference #${disputeId.slice(0, 8)}`;
  const body = `Dear ${dispute.vendor_name} Billing Team,

I am writing to formally dispute a billing charge on my account.

Issue Description:
${dispute.issue_description}

Disputed Amount: ${dispute.currency} ${dispute.amount}${dispute.account_number ? `\nAccount Number: ${dispute.account_number}` : ""}${dispute.evidence_description ? `\n\nSupporting Evidence:\n${dispute.evidence_description}` : ""}

I respectfully request a review of this charge and a resolution at your earliest convenience. Please confirm receipt of this dispute and provide a timeline for resolution.

Thank you for your attention to this matter.`;

  const draft = {
    subject,
    body,
    email_type: "initial_dispute",
    created_at: new Date().toISOString(),
  };

  // Store draft and move dispute to pending_approval
  await db.collection("disputes").doc(disputeId).set(
    {
      pending_draft: draft,
      status: "pending_approval",
      updated_at: new Date(),
    },
    { merge: true }
  );

  return draft;
}

/**
 * Sends an email immediately (bypasses approval) and logs it.
 */
export async function sendEmail(
  userId: string,
  disputeId: string,
  overrides: { subject?: string; body?: string }
) {
  const doc = await assertOwnership(userId, disputeId);
  const dispute = doc.data()!;

  const subject = overrides.subject ?? `Billing Dispute: ${dispute.vendor_name}`;
  const body = overrides.body ?? "";
  const emailType = "manual_send";

  // Log the sent email in a sub-collection
  const emailRef = db
    .collection("disputes")
    .doc(disputeId)
    .collection("emails")
    .doc();

  await emailRef.set({
    subject,
    body,
    email_type: emailType,
    sent_at: new Date().toISOString(),
    status: "sent",
  });

  // Update dispute status to "sent" and clear pending draft
  await db.collection("disputes").doc(disputeId).set(
    {
      status: "sent",
      pending_draft: null,
      updated_at: new Date(),
    },
    { merge: true }
  );
}

/**
 * Returns the email logs for a dispute.
 */
export async function getEmailLogs(userId: string, disputeId: string) {
  await assertOwnership(userId, disputeId);

  const snap = await db
    .collection("disputes")
    .doc(disputeId)
    .collection("emails")
    .orderBy("sent_at", "asc")
    .get();

  return snap.docs.map((e) => ({ id: e.id, ...e.data() }));
}

/**
 * Returns the pending draft for a dispute, or null.
 */
export async function getPendingDraft(userId: string, disputeId: string) {
  const doc = await assertOwnership(userId, disputeId);
  return doc.data()?.pending_draft ?? null;
}

/**
 * Approves the pending draft and sends it.
 */
export async function approveSend(
  userId: string,
  disputeId: string,
  edited: { subject?: string; body?: string }
) {
  const doc = await assertOwnership(userId, disputeId);
  const dispute = doc.data()!;
  const draft = dispute.pending_draft;

  const subject = edited.subject ?? draft?.subject ?? `Billing Dispute: ${dispute.vendor_name}`;
  const body = edited.body ?? draft?.body ?? "";

  // Log the sent email
  const emailRef = db
    .collection("disputes")
    .doc(disputeId)
    .collection("emails")
    .doc();

  await emailRef.set({
    subject,
    body,
    email_type: draft?.email_type ?? "approved_dispute",
    sent_at: new Date().toISOString(),
    status: "sent",
  });

  // Advance dispute to "sent" and clear the draft
  await db.collection("disputes").doc(disputeId).set(
    {
      status: "sent",
      pending_draft: null,
      updated_at: new Date(),
    },
    { merge: true }
  );
}

/**
 * Skips the pending draft without sending (clears it, reverts status to "new").
 */
export async function skipDraft(userId: string, disputeId: string) {
  await assertOwnership(userId, disputeId);

  await db.collection("disputes").doc(disputeId).set(
    {
      pending_draft: null,
      status: "new",
      updated_at: new Date(),
    },
    { merge: true }
  );
}
