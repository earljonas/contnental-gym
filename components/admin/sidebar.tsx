"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";

import { superAdminNav } from "@/components/admin/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminSidebar({
  userName,
}: {
  userName: string;
}) {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border bg-[var(--admin-sidebar)] lg:flex lg:flex-col">
        <div className="border-b border-border px-6 py-6">
          <Link href="/admin" className="flex flex-col leading-none">
            <span className="font-display text-[24px] font-black uppercase tracking-tight text-foreground">
              CONTNENTAL
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              FITNESS GYM
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {superAdminNav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="super-admin-nav"
                    className="absolute inset-0 rounded-2xl border border-border bg-background"
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  />
                ) : null}
                <span className="relative z-10">
                  <Icon className="size-4" />
                </span>
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border px-6 py-5">
          <p className="text-sm font-medium text-foreground">{userName}</p>
        </div>
      </aside>

      <div className="border-b border-border bg-[var(--admin-sidebar)] px-4 py-4 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <Link href="/admin" className="flex flex-col leading-none">
            <span className="font-display text-[22px] font-black uppercase tracking-tight text-foreground">
              CONTNENTAL
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              FITNESS GYM
            </span>
          </Link>
          <Button variant="outline" size="icon-sm" aria-label="Navigation">
            <Menu className="size-4" />
          </Button>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {superAdminNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
