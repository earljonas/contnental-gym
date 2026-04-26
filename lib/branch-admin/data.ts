import { createClient } from "@/lib/supabase/server";

export type BranchCheckIn = {
  memberName: string;
  time: string;
};

export type PendingMember = {
  id: string;
  name: string;
  email: string;
  plan: string;
  planPrice: number;
  membershipId: number;
  planId: number;
  registeredDate: string;
};

export type BranchDashboardData = {
  totalMembers: number;
  activeMembers: number;
  todayCheckIns: number;
  pendingActivations: number;
  recentCheckIns: BranchCheckIn[];
  pendingMembers: PendingMember[];
};

export async function getBranchDashboard(branchId: number): Promise<BranchDashboardData> {
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    allMembersResult,
    activeMembershipsResult,
    todayAttendanceResult,
    pendingResult,
  ] = await Promise.all([
    // Total registered members — all members across all branches
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "MEMBER"),

    // Active members at this branch
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("status", "ACTIVE"),

    // Today's check-ins for this branch
    supabase
      .from("attendance")
      .select("id, user_id, check_in_time, profiles!attendance_user_id_fkey(first_name, last_name)")
      .eq("branch_id", branchId)
      .gte("check_in_time", todayStart.toISOString())
      .order("check_in_time", { ascending: false })
      .limit(10),

    // Pending activation queue — members with PENDING membership and no branch assignment
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email, created_at, memberships(id, status, plan_id, membership_plans(name, price))")
      .eq("role", "MEMBER")
      .is("branch_id", null)
      .order("created_at", { ascending: false }),
  ]);

  // Process today's check-ins
  const checkInRows: BranchCheckIn[] = (todayAttendanceResult.data ?? []).map((row) => {
    const profile = row.profiles as unknown as { first_name: string; last_name: string } | null;
    const time = new Date(row.check_in_time).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return {
      memberName: profile ? `${profile.first_name} ${profile.last_name}`.trim() : "Member",
      time,
    };
  });

  // Process pending members — only those with at least one PENDING membership
  const pendingMembers: PendingMember[] = (pendingResult.data ?? [])
    .filter((profile) => {
      const memberships = Array.isArray(profile.memberships) ? profile.memberships : [];
      return memberships.some((m) => m.status === "PENDING");
    })
    .map((profile) => {
      const memberships = Array.isArray(profile.memberships) ? profile.memberships : [];
      const pendingMembership = memberships.find((m) => m.status === "PENDING");
      const plan = pendingMembership?.membership_plans as unknown as { name: string; price: number } | null;

      return {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        email: profile.email,
        plan: plan?.name ?? "No plan",
        planPrice: plan?.price ?? 0,
        membershipId: pendingMembership?.id ?? 0,
        planId: pendingMembership?.plan_id ?? 0,
        registeredDate: new Date(profile.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
    });

  return {
    totalMembers: allMembersResult.count ?? 0,
    activeMembers: activeMembershipsResult.count ?? 0,
    todayCheckIns: todayAttendanceResult.data?.length ?? 0,
    pendingActivations: pendingMembers.length,
    recentCheckIns: checkInRows,
    pendingMembers,
  };
}
