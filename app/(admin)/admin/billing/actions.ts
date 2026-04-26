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
  amount: number;
  method: "CASH" | "GCASH";
  referenceNumber?: string;
}) {
  try {
    const supabase = await createClient();

    // Get current user for confirmed_by
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("payments").insert({
      user_id: formData.userId,
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

