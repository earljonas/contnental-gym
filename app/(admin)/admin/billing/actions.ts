"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function confirmPayment(paymentId: number) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("payments")
      .update({ status: "CONFIRMED" })
      .eq("id", paymentId);

    if (error) {
      console.error("[confirmPayment] Error:", error);
      return { error: "Failed to confirm payment" };
    }

    revalidatePath("/admin/billing");
    revalidatePath("/admin");
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
}) {
  try {
    const supabase = await createClient();

    // Get current user for confirmed_by
    const { data: { user } } = await supabase.auth.getUser();

    const { data: memberships } = await supabase
      .from("memberships")
      .select("id, status")
      .eq("user_id", formData.userId)
      .order("created_at", { ascending: false })
      .limit(1);

    const membership = memberships?.[0] ?? null;
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
      confirmed_by: user?.id ?? null,
      confirmed_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[recordPayment] Error:", error);
      return { error: "Failed to record payment" };
    }

    revalidatePath("/admin/billing");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error("[recordPayment] Unexpected error:", err);
    return { error: "Unexpected error occurred" };
  }
}
