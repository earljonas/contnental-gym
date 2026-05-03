"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";

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

    // Find the member's latest membership to link the payment
    const { data: memberships } = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", formData.userId)
      .order("created_at", { ascending: false })
      .limit(1);

    const membershipId = memberships?.[0]?.id ?? null;

    const { error } = await supabase.from("payments").insert({
      user_id: formData.userId,
      membership_id: membershipId,
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
