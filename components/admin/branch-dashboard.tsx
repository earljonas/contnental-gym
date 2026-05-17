"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, UserCheck, UserPlus } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPageTransition } from "@/components/admin/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BranchDashboardData, BranchDashboardMetric, PendingMember } from "@/lib/branch-admin/data";
import { ActivateModal } from "@/app/(branch)/branch/activate-modal";
import { cn } from "@/lib/utils";

function metricTone(trend: BranchDashboardMetric["trend"]) {
  if (trend === "up") return "text-emerald-600";
  if (trend === "down") return "text-amber-600";
  return "text-slate-500";
}

export function BranchDashboardPage({ data }: { data: BranchDashboardData }) {
  const [activatingMember, setActivatingMember] = useState<PendingMember | null>(null);

  return (
    <AdminPageTransition>
      <div className="space-y-8">
        <AdminPageHeader title="Dashboard" />

        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.metrics.map((metric) => {
            const isAnchor = metric.href.startsWith("#");

            const cardContent = (
              <Card
                className={cn(
                  "overflow-hidden rounded-[28px] transition-colors",
                  !isAnchor && "hover:bg-secondary/30",
                )}
              >
                <CardHeader className="gap-5 p-6">
                  <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                    {metric.label}
                  </CardDescription>
                  <div className="flex min-h-20 flex-col justify-between gap-4">
                    <CardTitle className="font-display text-[clamp(2.5rem,3vw,3.4rem)] font-black uppercase leading-none tracking-tight">
                      {metric.value}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className={cn("flex items-center gap-1 text-sm font-semibold", metricTone(metric.trend))}>
                        {metric.trend === "down" ? (
                          <ArrowDownRight className="size-4" />
                        ) : metric.trend === "up" ? (
                          <ArrowUpRight className="size-4" />
                        ) : (
                          <ArrowRight className="size-4" />
                        )}
                        {metric.delta}
                      </span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );

            if (isAnchor) {
              return (
                <a key={metric.label} href={metric.href} className="block">
                  {cardContent}
                </a>
              );
            }

            return (
              <Link key={metric.label} href={metric.href} className="block">
                {cardContent}
              </Link>
            );
          })}
        </div>

        {/* Two-column layout for check-ins and pending queue */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Today's Check-ins */}
          <Card className="rounded-[30px]">
            <CardHeader className="border-b border-border/70 p-6">
              <CardTitle>Today&apos;s Check-ins</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {data.recentCheckIns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center md:p-12">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-secondary">
                    <UserCheck className="size-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    No check-ins today
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Members will appear here as they scan their QR codes.
                  </p>
                  <Link
                    href="/branch/attendance"
                    className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#C9973E] px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-black"
                  >
                    Go to Attendance
                  </Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Member Name</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentCheckIns.map((row, i) => (
                      <TableRow key={`${row.memberName}-${row.time}-${i}`}>
                        <TableCell className="text-[15px] font-medium">{row.memberName}</TableCell>
                        <TableCell className="text-[15px] text-muted-foreground">{row.time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pending Activation Queue */}
          <Card className="rounded-[30px]" id="pending">
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/70 p-6">
              <CardTitle>Pending Activation</CardTitle>
              <Badge variant="secondary" className="badge-pending">
                {data.pendingActivations} Walkups
              </Badge>
            </CardHeader>
            <CardContent className="p-6">
              {data.pendingMembers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center md:p-12">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                    <UserPlus className="size-7 text-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    All caught up!
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    New walk-in registrations will appear here.
                  </p>
                  <Link
                    href="/branch/members"
                    className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#C9973E] px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-black"
                  >
                    Register Walk-in
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.pendingMembers.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-2xl border border-border bg-secondary/30 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-[15px] font-semibold text-foreground truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-[10px]">{member.plan}</Badge>
                            <span className="text-[11px] text-muted-foreground">{member.registeredDate}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="h-9 shrink-0 rounded-full px-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
                          onClick={() => setActivatingMember(member)}
                        >
                          <UserPlus className="mr-1.5 size-3.5" />
                          Activate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {activatingMember ? (
        <ActivateModal
          member={activatingMember}
          onClose={() => setActivatingMember(null)}
        />
      ) : null}
    </AdminPageTransition>
  );
}
