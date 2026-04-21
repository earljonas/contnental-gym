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
