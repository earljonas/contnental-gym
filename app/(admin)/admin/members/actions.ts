"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";

async function requireSuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" as const };
  }

  const roleInfo = await getUserRole(supabase, user.id);
  if (roleInfo.role !== "SUPER_ADMIN") {
    return { error: "Unauthorized" as const };
  }

  return { error: null };
}

export async function toggleMemberStatus(memberId: string, currentStatus: string) {
  try {
    const supabase = await createClient();
    const auth = await requireSuperAdmin(supabase);
    if (auth.error) return { error: auth.error };

    const targetStatus = currentStatus === "Active" || currentStatus === "ACTIVE" ? "CANCELLED" : "ACTIVE";

    const { data: membership } = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", memberId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return { error: "Membership not found" };
    }

    const { error } = await supabase
      .from("memberships")
      .update({ status: targetStatus })
      .eq("id", membership.id);

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
  const auth = await requireSuperAdmin(supabase);
  if (auth.error) return null;

  // Basic profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, phone, avatar_url, role, created_at, branch_id, branches(name)")
    .eq("id", memberId)
    .single();

  // Memberships
  const { data: memberships } = await supabase
    .from("memberships")
    .select(`
      id, status, start_date, created_at, end_date,
      membership_plans ( name, price, duration, features )
    `)
    .eq("user_id", memberId)
    .order("created_at", { ascending: false });

  // Payments
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, status, payment_method, reference_number, created_at, branches(name), memberships(membership_plans(name))")
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
