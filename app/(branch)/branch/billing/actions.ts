"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";
import { pickCurrentMembership } from "@/lib/member-membership";

export async function confirmBranchPayment(data: {
  paymentId: number;
  method: "CASH" | "GCASH";
  referenceNumber?: string;
}) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const roleInfo = await getUserRole(supabase, user.id);
    if (roleInfo.role !== "BRANCH_ADMIN") {
      return { error: "Unauthorized" };
    }

    const { data: payment } = await supabase
      .from("payments")
      .select("status, branch_id")
      .eq("id", data.paymentId)
      .single();

    if (!payment || payment.branch_id !== roleInfo.branch_id || payment.status !== "PENDING") {
      return { error: "Payment not found or cannot be confirmed" };
    }

    const { error } = await supabase
      .from("payments")
      .update({
        status: "CONFIRMED",
        payment_method: data.method,
        reference_number: data.referenceNumber || null,
        confirmed_by: user.id,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", data.paymentId);

    if (error) {
      console.error("[confirmBranchPayment] Error:", error);
      return { error: "Failed to confirm payment" };
    }

    revalidatePath("/branch/billing");
    revalidatePath("/branch");
    return { success: true };
  } catch (err) {
    console.error("[confirmBranchPayment] Unexpected error:", err);
    return { error: "Unexpected error occurred" };
  }
}

export async function recordBranchPayment(formData: {
  userId: string;
  amount: number;
  method: "CASH" | "GCASH";
  referenceNumber?: string;
}) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const roleInfo = await getUserRole(supabase, user.id);
    if (roleInfo.role !== "BRANCH_ADMIN") {
      return { error: "Unauthorized" };
    }

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", formData.userId)
      .eq("role", "MEMBER")
      .single();

    if (!targetProfile) {
      return { error: "Member not found" };
    }

    // Only the current pending, unpaid membership can be settled through record payment.
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
      branch_id: roleInfo.branch_id,
      amount: formData.amount,
      payment_method: formData.method,
      status: "CONFIRMED",
      reference_number: formData.referenceNumber || null,
      confirmed_by: user.id,
      confirmed_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[recordBranchPayment] Error:", error);
      return { error: "Failed to record payment" };
    }

    revalidatePath("/branch/billing");
    revalidatePath("/branch");
    return { success: true };
  } catch (err) {
    console.error("[recordBranchPayment] Unexpected error:", err);
    return { error: "Unexpected error occurred" };
  }
}
