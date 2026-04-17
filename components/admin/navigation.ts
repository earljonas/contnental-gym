import {
  Activity,
  BellRing,
  CreditCard,
  LayoutDashboard,
  LineChart,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";

export const superAdminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/plans", label: "Plans", icon: WalletCards },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
  { href: "/admin/attendance", label: "Attendance", icon: Activity },
  { href: "/admin/staff", label: "Staff & Roles", icon: ShieldCheck },
  { href: "/admin/retention", label: "Retention", icon: LineChart },
  { href: "/admin/announcements", label: "Announcements", icon: BellRing },
] as const;
