"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";

export async function manualCheckInFromMembers(memberId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const roleInfo = await getUserRole(supabase, user.id);
    if (roleInfo.role !== "BRANCH_ADMIN" || !roleInfo.branch_id) {
      return { error: "Unauthorized" };
    }

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("branch_id")
      .eq("id", memberId)
      .single();

    if (!targetProfile || targetProfile.branch_id !== roleInfo.branch_id) {
      return { error: "Member does not belong to your branch" };
    }

    // Verify member has active membership
    const { data: memberships } = await supabase
      .from("memberships")
      .select("status")
      .eq("user_id", memberId)
      .eq("status", "ACTIVE")
      .limit(1);

    if (!memberships || memberships.length === 0) {
      return { error: "Member does not have an active membership" };
    }

    const { error: insertError } = await supabase.from("attendance").insert({
      user_id: memberId,
      branch_id: roleInfo.branch_id,
      checked_in_by: user.id,
      check_in_time: new Date().toISOString(),
    });

    if (insertError) {
      console.error("[manualCheckInFromMembers] insert failed:", insertError);
      return { error: "Failed to record check-in" };
    }

    revalidatePath("/branch/members");
    revalidatePath("/branch/attendance");
    return { success: true };
  } catch (err) {
    console.error("[manualCheckInFromMembers] Unexpected error:", err);
    return { error: "Unexpected error occurred" };
  }
}
