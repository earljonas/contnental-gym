"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";

export async function activateMember(data: {
  memberId: string;
  membershipId: number;
  planId: number;
  amount: number;
  paymentMethod: "CASH" | "GCASH";
  referenceNumber?: string;
}) {
  try {
    const supabase = await createClient();

    // Get current user info
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const roleInfo = await getUserRole(supabase, user.id);
    if (roleInfo.role !== "BRANCH_ADMIN" || !roleInfo.branch_id) {
      return { error: "Unauthorized" };
    }

    const branchId = roleInfo.branch_id;

    // 1. Assign the member to this branch
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ branch_id: branchId })
      .eq("id", data.memberId);

    if (profileError) {
      console.error("[activateMember] profile update failed:", profileError);
      return { error: "Failed to assign branch" };
    }

    // 2. Activate the membership
    const today = new Date();
    // Fetch plan duration to calculate end_date
    const { data: plan } = await supabase
      .from("membership_plans")
      .select("duration")
      .eq("id", data.planId)
      .single();

    const duration = plan?.duration ?? 30;
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + duration);

    const { error: membershipError } = await supabase
      .from("memberships")
      .update({
        status: "ACTIVE",
        start_date: today.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      })
      .eq("id", data.membershipId);

    if (membershipError) {
      console.error("[activateMember] membership update failed:", membershipError);
      return { error: "Failed to activate membership" };
    }

    // 3. Create payment record
    const { error: paymentError } = await supabase.from("payments").insert({
      user_id: data.memberId,
      membership_id: data.membershipId,
      amount: data.amount,
      payment_method: data.paymentMethod,
      status: "CONFIRMED",
      reference_number: data.referenceNumber || null,
      confirmed_by: user.id,
      confirmed_at: new Date().toISOString(),
    });

    if (paymentError) {
      console.error("[activateMember] payment insert failed:", paymentError);
      return { error: "Failed to record payment" };
    }

    revalidatePath("/branch");
    return { success: true };
  } catch (err) {
    console.error("[activateMember] Unexpected error:", err);
    return { error: "Unexpected error occurred" };
  }
}
