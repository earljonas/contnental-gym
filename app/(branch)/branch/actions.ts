"use server";

import { settleMembership } from "@/lib/gym/staff-operations";

export async function activateMember(input: {
  memberId: string;
  membershipId: number;
  paymentMethod: "CASH" | "GCASH";
  referenceNumber?: string;
}) {
  return settleMembership({
    target_member: input.memberId,
    target_membership: input.membershipId,
    method: input.paymentMethod,
    reference: input.referenceNumber,
  });
}
