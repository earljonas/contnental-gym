"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pickCurrentMembership } from "@/lib/member-membership";
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

async function activateMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  membershipId: number
) {
  const { data: membership } = await supabase
    .from("memberships")
    .select("id, status, start_date, end_date, membership_plans(duration)")
    .eq("id", membershipId)
    .single();

  if (!membership) {
    return { error: "Membership not found" };
  }

  if (membership.status !== "PENDING") {
    return { success: true };
  }

  const today = new Date();
  const startDate = membership.start_date ?? today.toISOString().split("T")[0];
  const duration = Number(
    ((Array.isArray(membership.membership_plans)
      ? membership.membership_plans[0]
      : membership.membership_plans) as { duration?: number } | null)?.duration ?? 30
  );
  const end = new Date(startDate);
  end.setDate(end.getDate() + duration);

  const { error } = await supabase
    .from("memberships")
    .update({
      status: "ACTIVE",
      start_date: startDate,
      end_date: membership.end_date ?? end.toISOString().split("T")[0],
    })
    .eq("id", membershipId);

  if (error) {
    console.error("[activateMembership] Error:", error);
    return { error: "Failed to activate membership" };
  }

  return { success: true };
}

export async function confirmPayment(paymentId: number): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const auth = await requireSuperAdmin(supabase);
    if (auth.error) return { error: auth.error };

    const { data: payment } = await supabase
      .from("payments")
      .select("id, membership_id, status")
      .eq("id", paymentId)
      .single();

    if (!payment || payment.status !== "PENDING") {
      return { error: "Payment not found or already confirmed" };
    }

    const { error } = await supabase
      .from("payments")
      .update({
        status: "CONFIRMED",
        confirmed_by: auth.user.id,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (error) {
      console.error("[confirmPayment] Error:", error);
      return { error: "Failed to confirm payment" };
    }

    if (payment.membership_id) {
      const activation = await activateMembership(supabase, payment.membership_id);
      if (activation.error) return activation;
    }

    revalidatePath("/admin/billing");
    revalidatePath("/admin");
    revalidatePath("/admin/members");
    return { success: true };
  } catch (err) {
    console.error("[confirmPayment] Unexpected error:", err);
    return { error: "Unexpected error occurred" };
  }
}

export async function recordPayment(formData: {
  userId: string;
  branchId: number;
  amount: number;
  method: "CASH" | "GCASH";
  referenceNumber?: string;
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const auth = await requireSuperAdmin(supabase);
    if (auth.error) return { error: auth.error };

    const { data: memberships } = await supabase
      .from("memberships")
      .select("id, status, created_at, end_date")
      .eq("user_id", formData.userId)
      .order("created_at", { ascending: false });

    const membership = pickCurrentMembership(memberships ?? []);
    if (!membership) {
      return { error: "Member has no membership to pay for" };
    }

    if (membership.status !== "PENDING") {
      return { error: "Member already has an active or settled membership" };
    }

    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id")
      .eq("membership_id", membership.id)
      .eq("status", "CONFIRMED")
      .limit(1)
      .maybeSingle();

    if (existingPayment) {
      return { error: "Current membership is already paid" };
    }

    const { error } = await supabase.from("payments").insert({
      user_id: formData.userId,
      membership_id: membership.id,
      branch_id: formData.branchId,
      amount: formData.amount,
      payment_method: formData.method,
      status: "CONFIRMED",
      reference_number: formData.referenceNumber || null,
      confirmed_by: auth.user.id,
      confirmed_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[recordPayment] Error:", error);
      return { error: "Failed to record payment" };
    }

    const activation = await activateMembership(supabase, membership.id);
    if (activation.error) return activation;

    revalidatePath("/admin/billing");
    revalidatePath("/admin");
    revalidatePath("/admin/members");
    return { success: true };
  } catch (err) {
    console.error("[recordPayment] Unexpected error:", err);
    return { error: "Unexpected error occurred" };
  }
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
