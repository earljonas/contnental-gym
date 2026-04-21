"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleMemberStatus(memberId: string, currentStatus: string) {
  try {
    const supabase = await createClient();

    const targetStatus = currentStatus === "Active" ? "CANCELLED" : "ACTIVE";

    // Update the latest membership for this user to toggle their status
    const { error } = await supabase
      .from("memberships")
      .update({ status: targetStatus })
      .eq("user_id", memberId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("[toggleMemberStatus] Error:", error);
      return { error: "Failed to toggle status" };
    }

    revalidatePath("/admin/members");
    return { success: true };
  } catch (err) {
    console.error("[toggleMemberStatus] Unexpected error:", err);
    return { error: "Unexpected error occurred" };
  }
}

export async function getMemberDetails(memberId: string) {
  const supabase = await createClient();

  // Basic profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, role")
    .eq("id", memberId)
    .single();

  // Memberships
  const { data: memberships } = await supabase
    .from("memberships")
    .select(`
      id, status, created_at, end_date,
      membership_plans ( name, tier )
    `)
    .eq("user_id", memberId)
    .order("created_at", { ascending: false });

  // Payments
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, status, payment_method, created_at")
    .eq("user_id", memberId)
    .order("created_at", { ascending: false })
    .limit(10);

  // Attendance
  const { data: attendance } = await supabase
    .from("attendance")
    .select(`
      id, check_in_time,
      branches ( name )
    `)
    .eq("user_id", memberId)
    .order("check_in_time", { ascending: false })
    .limit(10);

  return {
    profile,
    memberships: memberships || [],
    payments: payments || [],
    attendance: attendance || [],
  };
}
