import {
  Activity,
  BellRing,
  Building2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { AppRole } from "@/lib/supabase/roles";

type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: AppRole[];
};

const adminNav: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
  { href: "/admin/attendance", label: "Attendance", icon: Activity },
  { href: "/super-admin/branches", label: "Branches", icon: Building2, roles: ["SUPER_ADMIN"] },
  { href: "/admin/membership-plans", label: "Membership Plans", icon: ClipboardList, roles: ["SUPER_ADMIN"] },
  { href: "/admin/announcements", label: "Announcements", icon: BellRing },
] as const;

const branchAdminNav: AdminNavItem[] = [
  { href: "/branch", label: "Dashboard", icon: LayoutDashboard },
  { href: "/branch/members", label: "Members", icon: Users },
  { href: "/branch/attendance", label: "Attendance", icon: Activity },
  { href: "/branch/billing", label: "Billing", icon: CreditCard },
  { href: "/branch/announcements", label: "Announcements", icon: BellRing },
];

export function getAdminNav(role: AppRole) {
  return adminNav.filter((item) => !item.roles || item.roles.includes(role));
}

export function getBranchAdminNav() {
  return branchAdminNav;
}

