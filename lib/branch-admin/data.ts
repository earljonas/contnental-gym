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

// ── Attendance page types & data ──

export type AttendanceLogRow = {
  id: number;
  memberName: string;
  time: string;
  method: "QR" | "Manual";
};

export type AttendanceSummary = {
  todayCount: number;
  weekCount: number;
  busiestDay: string;
  busiestDayCount: number;
};

export type BranchAttendanceData = {
  summary: AttendanceSummary;
  log: AttendanceLogRow[];
};

export type MemberLookup = {
  id: string;
  name: string;
  avatarUrl: string | null;
  membershipStatus: "ACTIVE" | "EXPIRED" | "PENDING" | "CANCELLED" | "NONE";
};

export type SearchableMember = {
  id: string;
  name: string;
};

export async function getBranchAttendance(
  branchId: number,
  dateFilter?: string
): Promise<BranchAttendanceData> {
  const supabase = await createClient();

  // Target date (defaults to today)
  const targetDate = dateFilter ? new Date(dateFilter) : new Date();
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  // Week boundaries (Monday–Sunday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Today boundaries
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [dayLogResult, todayCountResult, weekResult] = await Promise.all([
    // Log for the selected date
    supabase
      .from("attendance")
      .select("id, user_id, check_in_time, checked_in_by, profiles!attendance_user_id_fkey(first_name, last_name)")
      .eq("branch_id", branchId)
      .gte("check_in_time", dayStart.toISOString())
      .lte("check_in_time", dayEnd.toISOString())
      .order("check_in_time", { ascending: false }),

    // Today's count
    supabase
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("branch_id", branchId)
      .gte("check_in_time", todayStart.toISOString())
      .lte("check_in_time", todayEnd.toISOString()),

    // This week's attendance for summary
    supabase
      .from("attendance")
      .select("check_in_time")
      .eq("branch_id", branchId)
      .gte("check_in_time", weekStart.toISOString())
      .lte("check_in_time", weekEnd.toISOString()),
  ]);

  // Process log rows
  const log: AttendanceLogRow[] = (dayLogResult.data ?? []).map((row) => {
    const profile = row.profiles as unknown as { first_name: string; last_name: string } | null;
    const time = new Date(row.check_in_time).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    // If checked_in_by is set and differs from user_id, it was a manual check-in
    const method: "QR" | "Manual" = row.checked_in_by ? "Manual" : "QR";

    return {
      id: row.id,
      memberName: profile ? `${profile.first_name} ${profile.last_name}`.trim() : "Member",
      time,
      method,
    };
  });

  // Week stats
  const weekData = weekResult.data ?? [];
  const weekCount = weekData.length;

  // Busiest day calculation
  const dayCounts: Record<string, number> = {};
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (const row of weekData) {
    const d = new Date(row.check_in_time);
    const dayName = dayNames[d.getDay()];
    dayCounts[dayName] = (dayCounts[dayName] ?? 0) + 1;
  }

  let busiestDay = "—";
  let busiestDayCount = 0;
  for (const [day, count] of Object.entries(dayCounts)) {
    if (count > busiestDayCount) {
      busiestDay = day;
      busiestDayCount = count;
    }
  }

  return {
    summary: {
      todayCount: todayCountResult.count ?? 0,
      weekCount,
      busiestDay,
      busiestDayCount,
    },
    log,
  };
}

export async function lookupMemberForCheckIn(memberId: string): Promise<MemberLookup | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, memberships(status)")
    .eq("id", memberId)
    .eq("role", "MEMBER")
    .single();

  if (!profile) return null;

  const memberships = Array.isArray(profile.memberships) ? profile.memberships : [];
  let status: MemberLookup["membershipStatus"] = "NONE";

  if (memberships.some((m) => m.status === "ACTIVE")) {
    status = "ACTIVE";
  } else if (memberships.some((m) => m.status === "PENDING")) {
    status = "PENDING";
  } else if (memberships.some((m) => m.status === "EXPIRED")) {
    status = "EXPIRED";
  } else if (memberships.some((m) => m.status === "CANCELLED")) {
    status = "CANCELLED";
  }

  return {
    id: profile.id,
    name: `${profile.first_name} ${profile.last_name}`.trim(),
    avatarUrl: profile.avatar_url ?? null,
    membershipStatus: status,
  };
}

export async function getSearchableMembers(): Promise<SearchableMember[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("role", "MEMBER")
    .order("first_name");

  return (data ?? []).map((p) => ({
    id: p.id,
    name: `${p.first_name} ${p.last_name}`.trim(),
  }));
}

// ── Members page types & data ──

export type MemberRow = {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  joined: string;
  lastCheckIn: string;
};

export type BranchMembersData = {
  members: MemberRow[];
  totalMembers: number;
  activeCount: number;
  pendingCount: number;
  expiredCount: number;
  plans: string[];
};

export type MemberDetails = {
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    created_at: string;
  };
  memberships: {
    id: number;
    status: string;
    plan_name: string;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
  }[];
  payments: {
    id: number;
    amount: number;
    status: string;
    payment_method: string;
    created_at: string;
  }[];
  attendance: {
    id: number;
    check_in_time: string;
  }[];
};

export async function getBranchMembers(branchId: number): Promise<BranchMembersData> {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select(`
      id, first_name, last_name, email, created_at,
      memberships(id, status, plan_id, membership_plans(name)),
      attendance(check_in_time)
    `)
    .eq("role", "MEMBER")
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false });

  const members: MemberRow[] = (profiles ?? []).map((p) => {
    const memberships = Array.isArray(p.memberships) ? p.memberships : [];
    const latestMembership = memberships[0];
    const plan = latestMembership?.membership_plans as unknown as { name: string } | null;

    const attendanceList = Array.isArray(p.attendance) ? p.attendance : [];
    const latestCheckIn = attendanceList
      .map((a) => new Date(a.check_in_time))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    return {
      id: p.id,
      name: `${p.first_name} ${p.last_name}`.trim(),
      email: p.email,
      plan: plan?.name ?? "No plan",
      status: latestMembership?.status ?? "NONE",
      joined: new Date(p.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      lastCheckIn: latestCheckIn
        ? latestCheckIn.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "Never",
    };
  });

  const activeCount = members.filter((m) => m.status === "ACTIVE").length;
  const pendingCount = members.filter((m) => m.status === "PENDING").length;
  const expiredCount = members.filter(
    (m) => m.status === "EXPIRED" || m.status === "CANCELLED"
  ).length;

  const plans = [...new Set(members.map((m) => m.plan).filter((p) => p !== "No plan"))];

  return {
    members,
    totalMembers: members.length,
    activeCount,
    pendingCount,
    expiredCount,
    plans,
  };
}

export async function getBranchMemberDetails(
  memberId: string,
  branchId: number
): Promise<MemberDetails | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, phone, avatar_url, created_at")
    .eq("id", memberId)
    .single();

  if (!profile) return null;

  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, status, start_date, end_date, created_at, membership_plans(name)")
    .eq("user_id", memberId)
    .order("created_at", { ascending: false });

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, status, payment_method, created_at")
    .eq("user_id", memberId)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: attendance } = await supabase
    .from("attendance")
    .select("id, check_in_time")
    .eq("user_id", memberId)
    .eq("branch_id", branchId)
    .order("check_in_time", { ascending: false })
    .limit(20);

  return {
    profile,
    memberships: (memberships ?? []).map((m) => ({
      id: m.id,
      status: m.status,
      plan_name:
        (m.membership_plans as unknown as { name: string } | null)?.name ?? "Unknown",
      start_date: m.start_date,
      end_date: m.end_date,
      created_at: m.created_at,
    })),
    payments: payments ?? [],
    attendance: attendance ?? [],
  };
}

// ── Billing page types & data ──

export type BillingRow = {
  id: number;
  userId: string;
  member: string;
  amount: string;
  rawAmount: number;
  plan: string;
  method: string;
  date: string;
  rawDate: string;
  status: string;
};

export type BranchBillingData = {
  rows: BillingRow[];
  confirmedThisMonth: number;
  pendingCollection: number;
  overdue: number;
  totalCollected: number;
  methods: string[];
};

export type BillingMemberOption = {
  id: string;
  name: string;
  planPrice: number;
};

export async function getBranchBilling(branchId: number): Promise<BranchBillingData> {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select(`
      id, user_id, amount, payment_method, status, created_at, reference_number,
      profiles!payments_user_id_fkey(first_name, last_name, branch_id),
      memberships(membership_plans(name))
    `)
    .order("created_at", { ascending: false });

  const branchPayments = (payments ?? []).filter((p) => {
    const profile = p.profiles as unknown as { branch_id: number | null } | null;
    return profile?.branch_id === branchId;
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  let confirmedThisMonth = 0;
  let pendingCollection = 0;
  let overdue = 0;
  let totalCollected = 0;

  const rows: BillingRow[] = branchPayments.map((p) => {
    const profile = p.profiles as unknown as {
      first_name: string;
      last_name: string;
    } | null;
    const membership = Array.isArray(p.memberships) ? p.memberships[0] : p.memberships;
    const plan = (membership as any)?.membership_plans as unknown as { name: string } | null;

    const createdAt = new Date(p.created_at);
    const isThisMonth = createdAt >= monthStart;
    const isPending = p.status === "PENDING";

    if (p.status === "CONFIRMED" && isThisMonth) {
      confirmedThisMonth++;
      totalCollected += Number(p.amount);
    }
    if (isPending) {
      pendingCollection++;
      if (createdAt < threeDaysAgo) {
        overdue++;
      }
    }

    return {
      id: p.id,
      userId: p.user_id,
      member: profile
        ? `${profile.first_name} ${profile.last_name}`.trim()
        : "Member",
      amount: `PHP ${Number(p.amount).toLocaleString()}`,
      rawAmount: Number(p.amount),
      plan: plan?.name ?? "—",
      method: p.payment_method,
      date: createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      rawDate: p.created_at,
      status: p.status,
    };
  });

  const methods = [...new Set(rows.map((r) => r.method).filter(Boolean))];

  return {
    rows,
    confirmedThisMonth,
    pendingCollection,
    overdue,
    totalCollected,
    methods,
  };
}

export async function getBillingMemberOptions(
  branchId: number
): Promise<BillingMemberOption[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, memberships(membership_plans(price))")
    .eq("role", "MEMBER")
    .eq("branch_id", branchId)
    .order("first_name");

  return (data ?? []).map((p) => {
    const memberships = Array.isArray(p.memberships) ? p.memberships : [];
    const latestPlan = memberships[0]?.membership_plans as unknown as { price: number } | null;

    return {
      id: p.id,
      name: `${p.first_name} ${p.last_name}`.trim(),
      planPrice: latestPlan?.price ?? 0,
    };
  });
}


