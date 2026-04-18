"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, UserRound, X } from "lucide-react";
import { motion } from "framer-motion";

import { getAdminNav } from "@/components/admin/navigation";
import { Button } from "@/components/ui/button";
import type { AppRole } from "@/lib/supabase/roles";
import { cn } from "@/lib/utils";

export function AdminSidebar({
  userName,
  role,
  isCollapsed,
  isOpen,
  onToggleCollapse,
  onToggleMobile,
  onCloseMobile,
}: {
  userName: string;
  role: AppRole;
  isCollapsed: boolean;
  isOpen: boolean;
  onToggleCollapse: () => void;
  onToggleMobile: () => void;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const navItems = getAdminNav(role);

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-white/10 bg-[var(--sidebar)] transition-[width] duration-300 ease-out lg:flex lg:flex-col",
          isCollapsed ? "w-24" : "w-72"
        )}
      >
        <div
          className={cn(
            "border-b border-white/10",
            isCollapsed ? "px-4 py-6" : "px-6 py-6"
          )}
        >
          <div className={cn("flex items-start", isCollapsed ? "justify-center" : "justify-between gap-3")}>
            <Link
              href="/admin"
              className={cn("flex flex-col leading-none", isCollapsed && "items-center text-center")}
            >
              <span className="font-display text-[24px] font-black uppercase tracking-tight text-[var(--sidebar-foreground-active)]">
                CONTNENTAL
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--sidebar-foreground)]",
                  isCollapsed && "mt-2 max-w-[64px] leading-tight"
                )}
              >
                FITNESS GYM
              </span>
            </Link>
            {!isCollapsed ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-0.5 shrink-0 rounded-xl text-[var(--sidebar-foreground)] hover:text-[var(--sidebar-foreground-active)]"
                aria-label="Collapse sidebar"
                onClick={onToggleCollapse}
              >
                <PanelLeftClose className="size-4" />
              </Button>
            ) : null}
          </div>
          {isCollapsed ? (
            <div className="mt-5 flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-xl text-[var(--sidebar-foreground)] hover:text-[var(--sidebar-foreground-active)]"
                aria-label="Expand sidebar"
                onClick={onToggleCollapse}
              >
                <PanelLeftOpen className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>

        <nav className={cn("flex-1 space-y-2 overflow-y-auto py-6", isCollapsed ? "px-3" : "px-4")}>
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center rounded-2xl transition-colors",
                  isCollapsed ? "justify-center px-3 py-3.5" : "gap-3 px-4 py-3.5 text-base font-medium",
                  active
                    ? "text-[var(--sidebar-foreground-active)] shadow-sm"
                    : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground-active)]"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                {active ? (
                  <motion.span
                    layoutId="super-admin-nav"
                    className="absolute inset-0 rounded-2xl border border-white/10 bg-white/5"
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  />
                ) : null}
                <span className="relative z-10">
                  <Icon className={cn("shrink-0", isCollapsed ? "size-5" : "size-[18px]")} />
                </span>
                {!isCollapsed ? <span className="relative z-10">{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            "border-t border-white/10 py-5",
            isCollapsed ? "px-3" : "px-6"
          )}
        >
          <div
            className={cn(
              "rounded-2xl border border-white/10 bg-white/[0.04]",
              isCollapsed ? "px-3 py-3 text-center" : "px-4 py-3"
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--sidebar-foreground)]">
              Account
            </p>
            {!isCollapsed ? (
              <p className="mt-2 text-sm font-medium text-[var(--sidebar-foreground-active)]">{userName}</p>
            ) : (
              <div className="mt-2 flex justify-center">
                <UserRound className="size-4 text-[var(--sidebar-foreground)]" />
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="border-b border-border bg-background px-4 py-4 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <Link href="/admin" className="flex flex-col leading-none">
            <span className="font-display text-[22px] font-black uppercase tracking-tight text-foreground">
              CONTNENTAL
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              FITNESS GYM
            </span>
          </Link>
          <Button variant="outline" size="icon-sm" aria-label="Navigation" onClick={onToggleMobile}>
            <PanelLeftOpen className="size-4" />
          </Button>
        </div>
      </div>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-[88vw] max-w-sm border-r border-white/10 bg-[var(--sidebar)] p-4 shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <Link href="/admin" className="flex flex-col leading-none" onClick={onCloseMobile}>
            <span className="font-display text-[22px] font-black uppercase tracking-tight text-[var(--sidebar-foreground-active)]">
              CONTNENTAL
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--sidebar-foreground)]">
              FITNESS GYM
            </span>
          </Link>
          <Button variant="ghost" size="icon-sm" aria-label="Close navigation" onClick={onCloseMobile}>
            <X className="size-4 text-[var(--sidebar-foreground-active)]" />
          </Button>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "rounded-2xl px-4 py-3 text-base font-medium",
                  active
                    ? "bg-white/[0.08] text-[var(--sidebar-foreground-active)]"
                    : "text-[var(--sidebar-foreground)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--sidebar-foreground)]">
            Account
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--sidebar-foreground-active)]">{userName}</p>
        </div>
      </aside>
    </>
  );
}
