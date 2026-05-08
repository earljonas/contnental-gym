import { createClient } from "@/lib/supabase/server";

export type DashboardMetric = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "neutral";
};

export type TrendPoint = {
  label: string;
  value: number;
};

export type DistributionPoint = {
  label: string;
  value: number;
};

export type ActivityRow = {
  member: string;
  branch: string;
  activity: string;
  amount?: string;
  timestamp: string;
  status: "success" | "warning" | "danger" | "neutral";
};

export type MemberRow = {
  id: string;
  name: string;
  email: string;
  branch: string;
  plan: string;
  status: "Active" | "Pending" | "At Risk" | "Inactive";
  joined: string;
};

export type PlanRow = {
  name: string;
  tier: string;
  price: string;
  duration: string;
  access: string;
  status: "Active" | "Archived";
};

export type PaymentRow = {
  id: number;
  member: string;
  branch: string;
  amount: string;
  method: string;
  dueDate: string;
  status: "Confirmed" | "Pending" | "Overdue";
};

export type AttendanceRow = {
  member: string;
  branch: string;
  time: string;
  date: string;
};

export type SuperAttendanceMetric = {
  label: string;
  value: string;
  detail: string;
};

export type AttendanceTrendPoint = {
  label: string;
  value: number;
};

export type AttendanceBranchPoint = {
  branch: string;
  value: number;
};

export type SuperAttendanceLogRow = {
  id: number;
  member: string;
  branch: string;
  date: string;
  time: string;
  rawTime: string;
};

export type SuperAdminAttendanceData = {
  metrics: SuperAttendanceMetric[];
  dailyTrend: AttendanceTrendPoint[];
  branchSplit: AttendanceBranchPoint[];
  rows: SuperAttendanceLogRow[];
  branchOptions: string[];
};



export type RetentionRow = {
  member: string;
  lastVisit: string;
  risk: "Low" | "Medium" | "High";
  trigger: string;
  action: string;
};

export type AnnouncementRow = {
  title: string;
  audience: string;
  channel: string;
  status: "Scheduled" | "Sent" | "Draft";
  publishAt: string;
};

type OverviewData = {
  metrics: DashboardMetric[];
  revenueTrend: TrendPoint[];
  checkInTrend: TrendPoint[];
  branchRevenue: DistributionPoint[];
  planDistribution: DistributionPoint[];
  recentActivity: ActivityRow[];
  members: MemberRow[];
  plans: PlanRow[];
  payments: PaymentRow[];
  attendance: AttendanceRow[];
  retention: RetentionRow[];
  announcements: AnnouncementRow[];
};

const emptyOverview: OverviewData = {
  metrics: [
    { label: "Active members", value: "0", delta: "No active members", trend: "neutral" },
    { label: "Monthly revenue", value: "PHP 0", delta: "0 confirmed payments", trend: "neutral" },
    { label: "Daily check-ins", value: "0", delta: "No visits today", trend: "neutral" },
    { label: "Overdue accounts", value: "0", delta: "On track", trend: "neutral" },
  ],
  revenueTrend: [],
  checkInTrend: [],
  branchRevenue: [],
  planDistribution: [],
  recentActivity: [],
  members: [],
  plans: [],
  payments: [],
  attendance: [],
  retention: [],
  announcements: [],
};

function formatCurrency(value: number) {
  return `PHP ${Math.round(value).toLocaleString()}`;
}

function statusFromMembership(status?: string): MemberRow["status"] {
  if (status === "ACTIVE") return "Active";
  if (status === "PENDING") return "Pending";
  if (status === "CANCELLED" || status === "EXPIRED") return "Inactive";
  return "At Risk";
}

const OVERDUE_CUTOFF_MS = 3 * 24 * 60 * 60 * 1000;

function isOverdue(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() > OVERDUE_CUTOFF_MS;
}

function startOfLocalDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfLocalDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" });
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export async function getSuperAdminAttendance(): Promise<SuperAdminAttendanceData> {
  const empty: SuperAdminAttendanceData = {
    metrics: [
      { label: "Today's Check-ins", value: "0", detail: "Across all branches" },
      { label: "Busiest Branch", value: "None", detail: "No visits today" },
      { label: "Peak Hour", value: "None", detail: "No visits today" },
      { label: "This Week", value: "0", detail: "Mon-Sun visits" },
    ],
    dailyTrend: [],
    branchSplit: [],
    rows: [],
    branchOptions: [],
  };

  try {
    const supabase = await createClient();
    const now = new Date();
    const todayStart = startOfLocalDay(now);
    const todayEnd = endOfLocalDay(now);
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = startOfLocalDay(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    const weekEnd = endOfLocalDay(new Date(weekStart));
    weekEnd.setDate(weekStart.getDate() + 6);

    const sevenDaysAgo = startOfLocalDay(now);
    sevenDaysAgo.setDate(now.getDate() - 6);

    const [attendanceResult, branchesResult] = await Promise.all([
      supabase
        .from("attendance")
        .select(`
          id,
          user_id,
          branch_id,
          check_in_time,
          profiles!attendance_user_id_fkey(first_name, last_name),
          branches(name)
        `)
        .gte("check_in_time", sevenDaysAgo.toISOString())
        .lte("check_in_time", todayEnd.toISOString())
        .order("check_in_time", { ascending: false }),
      supabase.from("branches").select("id, name").order("name"),
    ]);

    if (attendanceResult.error || branchesResult.error) {
      if (attendanceResult.error) console.error("[getSuperAdminAttendance] attendance query failed:", attendanceResult.error);
      if (branchesResult.error) console.error("[getSuperAdminAttendance] branches query failed:", branchesResult.error);
      return empty;
    }

    const attendance = attendanceResult.data ?? [];
    const allBranches = branchesResult.data ?? [];
    const todayRows = attendance.filter((row) => {
      const date = new Date(row.check_in_time);
      return date >= todayStart && date <= todayEnd;
    });
    const weekRows = attendance.filter((row) => {
      const date = new Date(row.check_in_time);
      return date >= weekStart && date <= weekEnd;
    });

    const branchCountsToday = new Map<string, number>();
    for (const row of todayRows) {
      const branch = Array.isArray(row.branches) ? row.branches[0] : row.branches;
      const branchName = branch?.name ?? "Unknown";
      branchCountsToday.set(branchName, (branchCountsToday.get(branchName) ?? 0) + 1);
    }

    const busiestBranch = [...branchCountsToday.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

    const hourlyCounts = new Map<number, number>();
    for (const row of todayRows) {
      const hour = new Date(row.check_in_time).getHours();
      hourlyCounts.set(hour, (hourlyCounts.get(hour) ?? 0) + 1);
    }
    const peakHour = [...hourlyCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
    const peakHourLabel = peakHour
      ? new Date(new Date().setHours(peakHour[0], 0, 0, 0)).toLocaleTimeString("en-US", {
          hour: "numeric",
        })
      : "None";

    const dailyTrend = Array.from({ length: 7 }, (_, index) => {
      const date = startOfLocalDay(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + index);
      const key = formatDateKey(date);
      const value = attendance.filter((row) => formatDateKey(new Date(row.check_in_time)) === key).length;
      return {
        label: formatDayLabel(date),
        value,
      };
    });

    const branchCountsWeek = new Map<string, number>();
    for (const branch of allBranches) {
      branchCountsWeek.set(branch.name, 0);
    }
    for (const row of weekRows) {
      const branch = Array.isArray(row.branches) ? row.branches[0] : row.branches;
      const branchName = branch?.name ?? "Unknown";
      branchCountsWeek.set(branchName, (branchCountsWeek.get(branchName) ?? 0) + 1);
    }

    const branchSplit = [...branchCountsWeek.entries()]
      .map(([branch, value]) => ({ branch, value }))
      .sort((a, b) => b.value - a.value);

    const rows = attendance.slice(0, 50).map((row) => {
      const profile = row.profiles as unknown as { first_name?: string | null; last_name?: string | null } | null;
      const branch = Array.isArray(row.branches) ? row.branches[0] : row.branches;
      const date = new Date(row.check_in_time);

      return {
        id: row.id,
        member: profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Member" : "Member",
        branch: branch?.name ?? "Unknown",
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        time: date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        rawTime: row.check_in_time,
      };
    });

    const branchOptions = allBranches.map((branch) => branch.name).sort();

    return {
      metrics: [
        {
          label: "Today's Check-ins",
          value: todayRows.length.toLocaleString(),
          detail: "Across all branches",
        },
        {
          label: "Busiest Branch",
          value: busiestBranch?.[0] ?? "None",
          detail: busiestBranch ? `${busiestBranch[1]} check-ins today` : "No visits today",
        },
        {
          label: "Peak Hour",
          value: peakHourLabel,
          detail: peakHour ? `${peakHour[1]} check-ins today` : "No visits today",
        },
        {
          label: "This Week",
          value: weekRows.length.toLocaleString(),
          detail: "Mon-Sun visits",
        },
      ],
      dailyTrend,
      branchSplit,
      rows,
      branchOptions,
    };
  } catch (error) {
    console.error("[getSuperAdminAttendance] Unexpected error:", error);
    return empty;
  }
}

export async function getSuperAdminOverview(): Promise<OverviewData> {
  try {
    const supabase = await createClient();

    const [
      profilesResult,
      membershipsResult,
      plansResult,
      paymentsResult,
      attendanceResult,
      todayAttendanceCountResult,
      branchesResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, first_name, last_name, role, created_at, branch_id, branches(name)"),
      supabase
        .from("memberships")
        .select("id, user_id, plan_id, status, start_date, end_date, created_at, membership_plans(name, duration)")
        .order("created_at", { ascending: false }),
      supabase
        .from("membership_plans")
        .select("id, name, price, duration, is_active"),
      supabase
        .from("payments")
        .select("id, user_id, branch_id, amount, payment_method, status, created_at, branches(name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("attendance")
        .select("id, user_id, branch_id, check_in_time, branches(name)")
        .order("check_in_time", { ascending: false })
        .limit(500),
      supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .gte("check_in_time", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
        .lte("check_in_time", new Date(new Date().setHours(23, 59, 59, 999)).toISOString()),
      supabase.from("branches").select("id, name"),
    ]);

    if (
      profilesResult.error ||
      membershipsResult.error ||
      plansResult.error ||
      paymentsResult.error ||
      attendanceResult.error ||
      todayAttendanceCountResult.error ||
      branchesResult.error
    ) {
      if (profilesResult.error) console.error("[getSuperAdminOverview] profiles query failed:", profilesResult.error);
      if (membershipsResult.error) console.error("[getSuperAdminOverview] memberships query failed:", membershipsResult.error);
      if (plansResult.error) console.error("[getSuperAdminOverview] plans query failed:", plansResult.error);
      if (paymentsResult.error) console.error("[getSuperAdminOverview] payments query failed:", paymentsResult.error);
      if (attendanceResult.error) console.error("[getSuperAdminOverview] attendance query failed:", attendanceResult.error);
      if (todayAttendanceCountResult.error) console.error("[getSuperAdminOverview] today attendance count query failed:", todayAttendanceCountResult.error);
      if (branchesResult.error) console.error("[getSuperAdminOverview] branches query failed:", branchesResult.error);
      return emptyOverview;
    }

    const profiles = profilesResult.data ?? [];
    const memberships = membershipsResult.data ?? [];
    const plans = plansResult.data ?? [];
    const payments = paymentsResult.data ?? [];
    const attendance = attendanceResult.data ?? [];
    const branches = branchesResult.data ?? [];

    const members = profiles.filter((profile) => profile.role === "MEMBER");
    const activeMemberIds = new Set(memberships.filter((membership) => membership.status === "ACTIVE").map((membership) => membership.user_id));
    const overduePayments = payments.filter(
      (payment) => payment.status === "PENDING" && isOverdue(payment.created_at)
    );
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthlyRevenue = payments
      .filter((payment) => payment.status === "CONFIRMED" && new Date(payment.created_at) >= monthStart)
      .reduce((total, payment) => total + Number(payment.amount ?? 0), 0);

    const branchNameById = new Map<number, string>(branches.map((branch) => [branch.id, branch.name]));
    const latestMembershipByUser = new Map<string, (typeof memberships)[number]>();

    for (const membership of memberships) {
      if (!latestMembershipByUser.has(membership.user_id)) {
        latestMembershipByUser.set(membership.user_id, membership);
      }
    }

    const sortedMembers = [...members].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const liveMembers: MemberRow[] = sortedMembers.map((member) => {
      const latestMembership = latestMembershipByUser.get(member.id);
      const relatedBranch = Array.isArray(member.branches) ? member.branches[0] : member.branches;

      return {
        id: member.id,
        name: `${member.first_name} ${member.last_name}`.trim(),
        email: member.email,
        branch: relatedBranch?.name ?? branchNameById.get(member.branch_id ?? -1) ?? "Unassigned",
        plan: (latestMembership?.membership_plans as { name?: string } | null)?.name ?? "No plan",
        status: statusFromMembership(latestMembership?.status),
        joined: new Date(member.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
    });

    const planCounts = new Map<string, number>();
    for (const membership of memberships) {
      const planName = (membership.membership_plans as { name?: string } | null)?.name ?? "Other";
      planCounts.set(planName, (planCounts.get(planName) ?? 0) + 1);
    }

    const livePlanDistribution = Array.from(planCounts.entries()).map(([label, value]) => ({
      label,
      value,
    }));

    const liveAttendance = attendance.map((item) => {
      const member = profiles.find((profile) => profile.id === item.user_id);
      const branch = Array.isArray(item.branches) ? item.branches[0] : item.branches;
      const date = new Date(item.check_in_time);

      return {
        member: member ? `${member.first_name} ${member.last_name}` : "Member",
        branch: branch?.name ?? "Branch",
        time: date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
    });

    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

    const livePayments: PaymentRow[] = payments.map((payment) => {
      const member = profileById.get(payment.user_id);
      const collectionBranch = Array.isArray(payment.branches) ? payment.branches[0] : payment.branches;
      return {
        id: payment.id,
        member: member ? `${member.first_name} ${member.last_name}` : "Member",
        branch: collectionBranch?.name ?? branchNameById.get(payment.branch_id ?? -1) ?? "Unassigned",
        amount: formatCurrency(Number(payment.amount ?? 0)),
        method: payment.payment_method ?? "Unknown",
        dueDate: new Date(payment.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status:
          payment.status === "CONFIRMED"
            ? "Confirmed"
            : isOverdue(payment.created_at)
              ? "Overdue"
              : "Pending",
      };
    });

    const revenueTrend = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const value = payments
        .filter((payment) => {
          const paymentDate = new Date(payment.created_at);
          const paymentKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, "0")}`;
          return payment.status === "CONFIRMED" && paymentKey === key;
        })
        .reduce((total, payment) => total + Number(payment.amount ?? 0), 0);

      return {
        label: formatMonthLabel(date),
        value,
      };
    });

    const sevenDaysAgo = startOfLocalDay(new Date());
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const checkInTrend = Array.from({ length: 7 }, (_, index) => {
      const date = startOfLocalDay(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + index);
      const key = formatDateKey(date);
      return {
        label: formatDayLabel(date),
        value: attendance.filter((item) => formatDateKey(new Date(item.check_in_time)) === key).length,
      };
    });

    const branchRevenueMap = new Map<string, number>();
    for (const branch of branches) {
      branchRevenueMap.set(branch.name, 0);
    }
    for (const payment of payments) {
      if (payment.status !== "CONFIRMED") continue;
      const collectionBranch = Array.isArray(payment.branches) ? payment.branches[0] : payment.branches;
      const branchName = collectionBranch?.name ?? branchNameById.get(payment.branch_id ?? -1) ?? "Unassigned";
      branchRevenueMap.set(branchName, (branchRevenueMap.get(branchName) ?? 0) + Number(payment.amount ?? 0));
    }
    const branchRevenue = [...branchRevenueMap.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const activityItems = [
      ...payments.slice(0, 10).map((payment) => {
        const member = profileById.get(payment.user_id);
        const collectionBranch = Array.isArray(payment.branches) ? payment.branches[0] : payment.branches;
        return {
          sortDate: payment.created_at,
          row: {
            member: member ? `${member.first_name} ${member.last_name}`.trim() : "Member",
            branch: collectionBranch?.name ?? branchNameById.get(payment.branch_id ?? -1) ?? "Unassigned",
            activity: payment.status === "CONFIRMED" ? "Payment confirmed" : "Payment pending",
            amount: formatCurrency(Number(payment.amount ?? 0)),
            timestamp: formatShortDate(new Date(payment.created_at)),
            status: payment.status === "CONFIRMED" ? "success" : "warning",
          } satisfies ActivityRow,
        };
      }),
      ...attendance.slice(0, 10).map((item) => {
        const member = profileById.get(item.user_id);
        const branch = Array.isArray(item.branches) ? item.branches[0] : item.branches;
        return {
          sortDate: item.check_in_time,
          row: {
            member: member ? `${member.first_name} ${member.last_name}`.trim() : "Member",
            branch: branch?.name ?? "Branch",
            activity: "Checked in",
            timestamp: formatShortDate(new Date(item.check_in_time)),
            status: "neutral",
          } satisfies ActivityRow,
        };
      }),
    ];
    const liveRecentActivity = activityItems
      .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
      .slice(0, 5)
      .map((item) => item.row);

    const latestAttendanceByUser = new Map<string, Date>();
    for (const item of attendance) {
      if (!latestAttendanceByUser.has(item.user_id)) {
        latestAttendanceByUser.set(item.user_id, new Date(item.check_in_time));
      }
    }
    const today = startOfLocalDay(new Date());
    const soon = startOfLocalDay(new Date());
    soon.setDate(soon.getDate() + 14);
    const inactiveCutoff = startOfLocalDay(new Date());
    inactiveCutoff.setDate(inactiveCutoff.getDate() - 14);

    const liveRetention: RetentionRow[] = [];
    for (const member of liveMembers) {
      const membership = latestMembershipByUser.get(member.id);
      const lastVisit = latestAttendanceByUser.get(member.id);

      if (membership?.status === "PENDING") {
        liveRetention.push({
          member: member.name,
          lastVisit: lastVisit ? formatShortDate(lastVisit) : "No visits",
          risk: "High",
          trigger: "Pending membership payment",
          action: "Follow up payment",
        });
        continue;
      }

      if (membership?.status === "ACTIVE" && membership.end_date) {
        const endDate = startOfLocalDay(new Date(membership.end_date));
        if (endDate >= today && endDate <= soon) {
          liveRetention.push({
            member: member.name,
            lastVisit: lastVisit ? formatShortDate(lastVisit) : "No visits",
            risk: "Medium",
            trigger: `Membership ends ${formatShortDate(endDate)}`,
            action: "Send renewal reminder",
          });
          continue;
        }
      }

      if (membership?.status === "ACTIVE" && (!lastVisit || lastVisit < inactiveCutoff)) {
        liveRetention.push({
          member: member.name,
          lastVisit: lastVisit ? formatShortDate(lastVisit) : "No visits",
          risk: "Medium",
          trigger: "No check-in in 14 days",
          action: "Check in with member",
        });
      }
    }

    return {
      ...emptyOverview,
      metrics: [
        {
          label: "Active members",
          value: activeMemberIds.size.toLocaleString(),
          delta: `${members.length ? Math.round((activeMemberIds.size / members.length) * 100) : 0}% active`,
          trend: activeMemberIds.size ? "up" : "neutral",
        },
        {
          label: "Monthly revenue",
          value: formatCurrency(monthlyRevenue || 0),
          delta: `${payments.filter((payment) => payment.status === "CONFIRMED").length} confirmed payments`,
          trend: monthlyRevenue > 0 ? "up" : "neutral",
        },
        {
          label: "Daily check-ins",
          value: (todayAttendanceCountResult.count ?? 0).toLocaleString(),
          delta: `${branches.length || 1} branches reporting`,
          trend: (todayAttendanceCountResult.count ?? 0) > 0 ? "up" : "neutral",
        },
        {
          label: "Overdue accounts",
          value: overduePayments.length.toLocaleString(),
          delta: overduePayments.length ? "Needs follow-up" : "On track",
          trend: overduePayments.length ? "down" : "neutral",
        },
      ],
      revenueTrend,
      checkInTrend,
      branchRevenue,
      planDistribution: livePlanDistribution,
      recentActivity: liveRecentActivity,
      members: liveMembers,
      plans:
        plans.length > 0
          ? plans.map((plan) => ({
              name: plan.name,
              tier: "Access",
              price: formatCurrency(Number(plan.price)),
              duration: `${plan.duration} days`,
              access: "All branch access",
              status: plan.is_active ? "Active" : "Archived",
            }))
          : [],
      payments: livePayments,
      attendance: liveAttendance,
      retention: liveRetention,
      announcements: [],
    };
  } catch (error) {
    console.error("[getSuperAdminOverview] Unexpected error:", error);
    return emptyOverview;
  }
}
