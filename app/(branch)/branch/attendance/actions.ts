"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";
import { lookupMemberForCheckIn, type MemberLookup } from "@/lib/branch-admin/data";

export async function checkInMember(
  memberId: string,
  method: "QR" | "Manual"
): Promise<{ success?: boolean; error?: string; member?: MemberLookup }> {
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

    // Look up the member
    const member = await lookupMemberForCheckIn(memberId);
    if (!member) return { error: "Member not found" };

    // Only allow check-in for active members
    if (member.membershipStatus !== "ACTIVE") {
      return { member, error: `Membership is ${member.membershipStatus}` };
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
      console.error("[checkInMember] duplicate check failed:", existingCheckInError);
      return { error: "Failed to verify today's check-in" };
    }

    if (existingCheckIn) {
      return { member, error: "Already checked in today" };
    }

    // Insert attendance record
    const { error: insertError } = await supabase.from("attendance").insert({
      user_id: memberId,
      branch_id: roleInfo.branch_id,
      checked_in_by: method === "Manual" ? user.id : null,
      check_in_time: new Date().toISOString(),
    });

    if (insertError) {
      console.error("[checkInMember] insert failed:", insertError);
      return { error: "Failed to record check-in" };
    }

    revalidatePath("/branch/attendance");
    return { success: true, member };
  } catch (err) {
    console.error("[checkInMember] Unexpected error:", err);
    return { error: "Unexpected error occurred" };
  }
}

export async function lookupMemberAction(
  memberId: string
): Promise<{ member?: MemberLookup; error?: string }> {
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

    const member = await lookupMemberForCheckIn(memberId);
    if (!member) return { error: "Member not found" };

    return { member };
  } catch {
    return { error: "Lookup failed" };
  }
}
