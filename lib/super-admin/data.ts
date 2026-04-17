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
  name: string;
  email: string;
  branch: string;
  plan: string;
  status: "Active" | "Pending" | "At Risk" | "Inactive";
  joined: string;
};

export type PlanRow = {
  name: string;
  tier: "Basic" | "Prime" | "Extreme";
  price: string;
  duration: string;
  access: string;
  status: "Active" | "Archived";
};

export type PaymentRow = {
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

export type StaffRow = {
  name: string;
  role: "Owner" | "Manager" | "Receptionist";
  branch: string;
  permissions: string;
  status: "Active" | "Invited";
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
  planDistribution: DistributionPoint[];
  recentActivity: ActivityRow[];
  members: MemberRow[];
  plans: PlanRow[];
  payments: PaymentRow[];
  attendance: AttendanceRow[];
  staff: StaffRow[];
  retention: RetentionRow[];
  announcements: AnnouncementRow[];
};

const fallbackData: OverviewData = {
  metrics: [
    { label: "Active members", value: "1,248", delta: "+8.2%", trend: "up" },
    { label: "Monthly revenue", value: "PHP 486K", delta: "+12.4%", trend: "up" },
    { label: "Daily check-ins", value: "312", delta: "+4.1%", trend: "up" },
    { label: "Overdue accounts", value: "27", delta: "-6.5%", trend: "down" },
  ],
  revenueTrend: [
    { label: "Jan", value: 320000 },
    { label: "Feb", value: 356000 },
    { label: "Mar", value: 381000 },
    { label: "Apr", value: 402000 },
    { label: "May", value: 430000 },
    { label: "Jun", value: 486000 },
  ],
  checkInTrend: [
    { label: "Mon", value: 220 },
    { label: "Tue", value: 254 },
    { label: "Wed", value: 287 },
    { label: "Thu", value: 301 },
    { label: "Fri", value: 312 },
    { label: "Sat", value: 276 },
    { label: "Sun", value: 198 },
  ],
  planDistribution: [
    { label: "Basic", value: 432 },
    { label: "Prime", value: 511 },
    { label: "Extreme", value: 305 },
  ],
  recentActivity: [
    {
      member: "Mikaela Santos",
      branch: "Ecoland",
      activity: "Membership upgraded to Extreme",
      amount: "PHP 4,000",
      timestamp: "10 min ago",
      status: "success",
    },
    {
      member: "Jerome Cruz",
      branch: "Lanang",
      activity: "Payment awaiting confirmation",
      amount: "PHP 2,500",
      timestamp: "23 min ago",
      status: "warning",
    },
    {
      member: "Alyssa Tan",
      branch: "Torres",
      activity: "Flagged by churn analyzer",
      timestamp: "45 min ago",
      status: "danger",
    },
    {
      member: "Noah Reyes",
      branch: "Ecoland",
      activity: "Reached 30-day streak",
      timestamp: "1 hr ago",
      status: "success",
    },
  ],
  members: [
    {
      name: "Mikaela Santos",
      email: "mikaela@contnental.fit",
      branch: "Ecoland",
      plan: "Extreme",
      status: "Active",
      joined: "Apr 12, 2026",
    },
    {
      name: "Jerome Cruz",
      email: "jerome@contnental.fit",
      branch: "Lanang",
      plan: "Prime",
      status: "Pending",
      joined: "Apr 10, 2026",
    },
    {
      name: "Alyssa Tan",
      email: "alyssa@contnental.fit",
      branch: "Torres",
      plan: "Basic",
      status: "At Risk",
      joined: "Mar 18, 2026",
    },
    {
      name: "Noah Reyes",
      email: "noah@contnental.fit",
      branch: "Ecoland",
      plan: "Prime",
      status: "Active",
      joined: "Mar 06, 2026",
    },
  ],
  plans: [
    {
      name: "Starter Access",
      tier: "Basic",
      price: "PHP 1,500",
      duration: "30 days",
      access: "Floor access, locker room",
      status: "Active",
    },
    {
      name: "Performance Prime",
      tier: "Prime",
      price: "PHP 2,500",
      duration: "30 days",
      access: "Classes, floor access, guest pass",
      status: "Active",
    },
    {
      name: "Extreme Plus",
      tier: "Extreme",
      price: "PHP 4,000",
      duration: "30 days",
      access: "24/7 access, recovery, coaching",
      status: "Active",
    },
  ],
  payments: [
    {
      member: "Jerome Cruz",
      branch: "Lanang",
      amount: "PHP 2,500",
      method: "GCash",
      dueDate: "Apr 18, 2026",
      status: "Pending",
    },
    {
      member: "Mikaela Santos",
      branch: "Ecoland",
      amount: "PHP 4,000",
      method: "Cash",
      dueDate: "Apr 17, 2026",
      status: "Confirmed",
    },
    {
      member: "Rica Flores",
      branch: "Torres",
      amount: "PHP 1,500",
      method: "GCash",
      dueDate: "Apr 14, 2026",
      status: "Overdue",
    },
  ],
  attendance: [
    { member: "Mikaela Santos", branch: "Ecoland", time: "6:14 AM", date: "Apr 17, 2026" },
    { member: "Noah Reyes", branch: "Ecoland", time: "7:02 AM", date: "Apr 17, 2026" },
    { member: "Alyssa Tan", branch: "Torres", time: "8:16 AM", date: "Apr 17, 2026" },
    { member: "Jerome Cruz", branch: "Lanang", time: "5:48 PM", date: "Apr 16, 2026" },
  ],
  staff: [
    {
      name: "Sophie dela Cruz",
      role: "Owner",
      branch: "All branches",
      permissions: "All modules",
      status: "Active",
    },
    {
      name: "Marco Villar",
      role: "Manager",
      branch: "Lanang",
      permissions: "Billing, members, announcements",
      status: "Active",
    },
    {
      name: "Jessa Lim",
      role: "Receptionist",
      branch: "Torres",
      permissions: "Check-ins, member support",
      status: "Invited",
    },
  ],
  retention: [
    {
      member: "Alyssa Tan",
      lastVisit: "12 days ago",
      risk: "High",
      trigger: "Usage dropped 63% this month",
      action: "Offer a free coaching review",
    },
    {
      member: "Paolo Ramos",
      lastVisit: "7 days ago",
      risk: "Medium",
      trigger: "Upcoming renewal and low attendance",
      action: "Send renewal reminder with add-on bundle",
    },
    {
      member: "Rica Flores",
      lastVisit: "4 days ago",
      risk: "Low",
      trigger: "One missed payment",
      action: "Schedule payment follow-up",
    },
  ],
  announcements: [
    {
      title: "Holiday schedule advisory",
      audience: "All members",
      channel: "Portal + email",
      status: "Sent",
      publishAt: "Apr 15, 2026",
    },
    {
      title: "Prime plan class refresh",
      audience: "Prime members",
      channel: "Email",
      status: "Scheduled",
      publishAt: "Apr 19, 2026",
    },
    {
      title: "New recovery area opening",
      audience: "Extreme members",
      channel: "Draft",
      status: "Draft",
      publishAt: "TBD",
    },
  ],
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

export async function getSuperAdminOverview(): Promise<OverviewData> {
  try {
    const supabase = await createClient();

    const [
      profilesResult,
      membershipsResult,
      plansResult,
      paymentsResult,
      attendanceResult,
      branchesResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, first_name, last_name, role, created_at, branch_id, branches(name)"),
      supabase
        .from("memberships")
        .select("id, user_id, plan_id, status, created_at, membership_plans(name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("membership_plans")
        .select("id, name, price, duration, is_active"),
      supabase
        .from("payments")
        .select("id, user_id, amount, payment_method, status, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("attendance")
        .select("id, user_id, branch_id, check_in_time, branches(name)")
        .order("check_in_time", { ascending: false })
        .limit(20),
      supabase.from("branches").select("id, name"),
    ]);

    if (
      profilesResult.error ||
      membershipsResult.error ||
      plansResult.error ||
      paymentsResult.error ||
      attendanceResult.error ||
      branchesResult.error
    ) {
      return fallbackData;
    }

    const profiles = profilesResult.data ?? [];
    const memberships = membershipsResult.data ?? [];
    const plans = plansResult.data ?? [];
    const payments = paymentsResult.data ?? [];
    const attendance = attendanceResult.data ?? [];
    const branches = branchesResult.data ?? [];

    const members = profiles.filter((profile) => profile.role === "MEMBER");
    const activeMembers = memberships.filter((membership) => membership.status === "ACTIVE");
    const overduePayments = payments.filter((payment) => payment.status === "PENDING");
    const revenue = payments
      .filter((payment) => payment.status === "CONFIRMED")
      .reduce((total, payment) => total + Number(payment.amount ?? 0), 0);

    const branchNameById = new Map<number, string>(branches.map((branch) => [branch.id, branch.name]));
    const latestMembershipByUser = new Map<string, (typeof memberships)[number]>();

    for (const membership of memberships) {
      if (!latestMembershipByUser.has(membership.user_id)) {
        latestMembershipByUser.set(membership.user_id, membership);
      }
    }

    const liveMembers: MemberRow[] = members.slice(0, 6).map((member) => {
      const latestMembership = latestMembershipByUser.get(member.id);
      const relatedBranch = Array.isArray(member.branches) ? member.branches[0] : member.branches;

      return {
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

    const liveAttendance = attendance.slice(0, 6).map((item) => {
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

    const livePayments: PaymentRow[] = payments.slice(0, 6).map((payment) => {
      const member = profiles.find((profile) => profile.id === payment.user_id);
      return {
        member: member ? `${member.first_name} ${member.last_name}` : "Member",
        branch: branchNameById.get(member?.branch_id ?? -1) ?? "Branch",
        amount: formatCurrency(Number(payment.amount ?? 0)),
        method: payment.payment_method,
        dueDate: new Date(payment.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status:
          payment.status === "CONFIRMED"
            ? "Confirmed"
            : payment.created_at < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
              ? "Overdue"
              : "Pending",
      };
    });

    return {
      ...fallbackData,
      metrics: [
        {
          label: "Active members",
          value: activeMembers.length.toLocaleString(),
          delta: `${members.length ? Math.round((activeMembers.length / members.length) * 100) : 0}% active`,
          trend: "up",
        },
        {
          label: "Monthly revenue",
          value: formatCurrency(revenue || 0),
          delta: `${payments.filter((payment) => payment.status === "CONFIRMED").length} confirmed payments`,
          trend: "up",
        },
        {
          label: "Daily check-ins",
          value: attendance.length.toLocaleString(),
          delta: `${branches.length || 1} branches reporting`,
          trend: "up",
        },
        {
          label: "Overdue accounts",
          value: overduePayments.length.toLocaleString(),
          delta: overduePayments.length ? "Needs follow-up" : "On track",
          trend: overduePayments.length ? "down" : "neutral",
        },
      ],
      planDistribution: livePlanDistribution.length ? livePlanDistribution : fallbackData.planDistribution,
      recentActivity: fallbackData.recentActivity,
      members: liveMembers.length ? liveMembers : fallbackData.members,
      plans:
        plans.length > 0
          ? plans.map((plan) => ({
              name: plan.name,
              tier:
                plan.name.toLowerCase().includes("basic")
                  ? "Basic"
                  : plan.name.toLowerCase().includes("prime")
                    ? "Prime"
                    : "Extreme",
              price: formatCurrency(Number(plan.price)),
              duration: `${plan.duration} days`,
              access: "Managed access controls",
              status: plan.is_active ? "Active" : "Archived",
            }))
          : fallbackData.plans,
      payments: livePayments.length ? livePayments : fallbackData.payments,
      attendance: liveAttendance.length ? liveAttendance : fallbackData.attendance,
      staff: fallbackData.staff,
      retention: fallbackData.retention,
      announcements: fallbackData.announcements,
    };
  } catch {
    return fallbackData;
  }
}
