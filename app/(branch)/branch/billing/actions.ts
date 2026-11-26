"use server";

import { settleMembership } from "@/lib/gym/staff-operations";

export async function confirmBranchPayment(input: {
  paymentId: number;
  method: "CASH" | "GCASH";
  referenceNumber?: string;
}) {
  return settleMembership({
    target_member: null, pending_payment: input.paymentId,
    method: input.method, reference: input.referenceNumber,
  });
}

export async function recordBranchPayment(input: {
  userId: string;
  method: "CASH" | "GCASH";
  referenceNumber?: string;
}) {
  return settleMembership({
    target_member: input.userId, method: input.method, reference: input.referenceNumber,
  });
}
