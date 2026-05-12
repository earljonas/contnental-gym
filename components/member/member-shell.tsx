"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Dumbbell,
  TrendingUp,
  UserRound,
  Plus,
  LogOut,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MemberShellProps {
  children: React.ReactNode;
  userName: string;
  membershipStatus: string | null;
}

const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Workouts", href: "/dashboard/workouts", icon: Dumbbell },
  { label: "Progress", href: "/dashboard/progress", icon: TrendingUp },
  { label: "Profile", href: "/dashboard/profile", icon: UserRound },
] as const;

export function MemberShell({
  children,
  userName,
  membershipStatus,
}: MemberShellProps) {
  const pathname = usePathname();
  const isSessionPage = pathname.startsWith("/dashboard/session");

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  // Hide shell during active session for distraction-free workout
  if (isSessionPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-background">
        {/* Sidebar header */}
        <div className="flex flex-col px-6 pt-8 pb-6">
          <Link href="/dashboard" className="flex flex-col leading-none">
            <span className="font-display text-lg font-black uppercase tracking-tight text-foreground">
              CONTNENTAL
            </span>
            <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              FITNESS GYM
            </span>
          </Link>
        </div>

        {/* Sidebar nav */}
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("size-5", active ? "text-foreground" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}

          {/* Sidebar action */}
          <Link
            href="/dashboard/session"
            className="mt-4 flex items-center gap-3 rounded-lg bg-[#C9973E] px-3 py-2.5 text-sm font-medium text-black transition-colors hover:bg-[#B8882F]"
          >
            <Plus className="size-5" />
            Quick Add
          </Link>
        </nav>

        {/* User info */}
        <div className="border-t border-border px-6 py-4">
          <p className="text-sm font-medium text-foreground">{userName}</p>
          <p className="text-[11px] text-muted-foreground">Member</p>
          <form action="/auth/signout" method="post" className="mt-3">
            <button
              type="submit"
              className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="min-h-screen pb-20 md:ml-64 md:pb-0">
        <div className="mx-auto max-w-2xl px-4 py-6 md:max-w-4xl md:px-8 md:py-8">
          {/* Membership status banners removed from shell - now handled in page content */}


          {children}
        </div>
      </main>

      {/* ── Bottom Nav (mobile) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
        {/* Home */}
        <Link href="/dashboard" className="flex flex-col items-center gap-1">
          <Home
            className={cn(
              "size-5",
              isActive("/dashboard") ? "text-foreground" : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "text-[10px] font-medium",
              isActive("/dashboard") ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Home
          </span>
        </Link>

        {/* Workouts */}
        <Link href="/dashboard/workouts" className="flex flex-col items-center gap-1">
          <Dumbbell
            className={cn(
              "size-5",
              isActive("/dashboard/workouts") ? "text-foreground" : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "text-[10px] font-medium",
              isActive("/dashboard/workouts") ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Workouts
          </span>
        </Link>

        {/* Center quick-log button */}
        <Link href="/dashboard/session" className="flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full bg-[#C9973E] text-black shadow-lg shadow-[#C9973E]/30 transition-transform active:scale-95">
          <Plus className="size-6" />
        </Link>

        {/* Progress */}
        <Link href="/dashboard/progress" className="flex flex-col items-center gap-1">
          <TrendingUp
            className={cn(
              "size-5",
              isActive("/dashboard/progress") ? "text-foreground" : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "text-[10px] font-medium",
              isActive("/dashboard/progress") ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Progress
          </span>
        </Link>

        {/* Profile */}
        <Link href="/dashboard/profile" className="flex flex-col items-center gap-1">
          <UserRound
            className={cn(
              "size-5",
              isActive("/dashboard/profile") ? "text-foreground" : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "text-[10px] font-medium",
              isActive("/dashboard/profile") ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Profile
          </span>
        </Link>
      </nav>
    </div>
  );
}
