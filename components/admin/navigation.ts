import {
  Activity,
  BellRing,
  Building2,
  CreditCard,
  LayoutDashboard,
  LineChart,
  ShieldCheck,
  Users,
  WalletCards,
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
  { href: "/admin/plans", label: "Plans", icon: WalletCards },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
  { href: "/admin/attendance", label: "Attendance", icon: Activity },
  { href: "/admin/staff", label: "Staff & Roles", icon: ShieldCheck },
  { href: "/super-admin/branches", label: "Branches", icon: Building2, roles: ["SUPER_ADMIN"] },
  { href: "/admin/retention", label: "Retention", icon: LineChart },
  { href: "/admin/announcements", label: "Announcements", icon: BellRing },
] as const;

export function getAdminNav(role: AppRole) {
  return adminNav.filter((item) => !("roles" in item) || item.roles.includes(role));
}
