import { z } from "zod";

export const DisputeCreate = z.object({
  vendor_name: z.string(),
  contact_email: z.string().email(),
  issue_description: z.string(),
  amount: z.number(),
  currency: z.string().default("USD"),
  evidence_description: z.string().optional(),
  account_number: z.string().optional(),
});
export type DisputeCreate = z.infer<typeof DisputeCreate>;

export const DisputeUpdate = z.object({
  status: z.enum([
    "new", "pending_approval", "sent", "followup_1",
    "followup_2", "escalated", "resolved", "closed",
  ]).optional(),
  resolution: z.string().optional(),
  amount_recovered: z.number().optional(),
});
export type DisputeUpdate = z.infer<typeof DisputeUpdate>;
