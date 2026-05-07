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
      .select("id, role")
      .eq("id", memberId)
      .eq("role", "MEMBER")
      .single();

    if (!targetProfile) {
      return { error: "Member not found" };
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

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data: existingCheckIn, error: existingCheckInError } = await supabase
      .from("attendance")
      .select("id")
      .eq("user_id", memberId)
      .gte("check_in_time", todayStart.toISOString())
      .lte("check_in_time", todayEnd.toISOString())
      .limit(1)
      .maybeSingle();

    if (existingCheckInError) {
      console.error("[manualCheckInFromMembers] duplicate check failed:", existingCheckInError);
      return { error: "Failed to verify today's check-in" };
    }

    if (existingCheckIn) {
      return { error: "Already checked in today" };
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

export async function updateBranchMemberProfile(data: {
  memberId: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
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

    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const phone = data.phone?.trim() || null;

    if (!firstName || !lastName) {
      return { error: "First name and last name are required" };
    }

    const { data: updated, error } = await supabase.rpc(
      "branch_admin_update_member_profile",
      {
        member_id: data.memberId,
        new_first_name: firstName,
        new_last_name: lastName,
        new_phone: phone,
      }
    );

    if (error || updated !== true) {
      console.error("[updateBranchMemberProfile] update failed:", error);
      return { error: "Failed to update member" };
    }

    revalidatePath("/branch/members");
    return { success: true };
  } catch (err) {
    console.error("[updateBranchMemberProfile] Unexpected error:", err);
    return { error: "Unexpected error occurred" };
  }
}
