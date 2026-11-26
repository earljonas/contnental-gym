"use server";

import { createClient } from "@/lib/supabase/server";
import { settleMembership } from "@/lib/gym/staff-operations";
import { getUserRole } from "@/lib/supabase/roles";

type ActionResult = {
  success?: boolean;
  error?: string;
};

async function requireSuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" as const, user: null };
  }

  const roleInfo = await getUserRole(supabase, user.id);
  if (roleInfo.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" as const, user: null };
  }

  return { error: null, user };
}

export async function confirmPayment(paymentId: number): Promise<ActionResult> {
  const supabase = await createClient();
  const auth = await requireSuperAdmin(supabase);
  if (auth.error) return { error: auth.error };
  return settleMembership({ target_member: null, pending_payment: paymentId, method: null }, supabase);
}

export async function recordPayment(input: {
  userId: string;
  branchId: number;
  method: "CASH" | "GCASH";
  referenceNumber?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const auth = await requireSuperAdmin(supabase);
  if (auth.error) return { error: auth.error };
  return settleMembership({
    target_member: input.userId, collection_branch: input.branchId,
    method: input.method, reference: input.referenceNumber,
  }, supabase);
}

export async function getPaymentDetails(paymentId: number) {
  const supabase = await createClient();
  const auth = await requireSuperAdmin(supabase);
  if (auth.error) return null;

  const { data, error } = await supabase
    .from("payments")
    .select(`
      id,
      amount,
      payment_method,
      status,
      reference_number,
      created_at,
      branches(name),
      profiles!payments_user_id_fkey(first_name, last_name, email, phone),
      memberships(status, start_date, end_date, membership_plans(name, price, duration))
    `)
    .eq("id", paymentId)
    .single();

  if (error) {
    console.error("[getPaymentDetails] Error:", error);
    return null;
  }

  return data;
}
