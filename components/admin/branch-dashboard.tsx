"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

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
import type { BranchDashboardData, PendingMember } from "@/lib/branch-admin/data";
import { ActivateModal } from "@/app/(branch)/branch/activate-modal";

export function BranchDashboardPage({ data }: { data: BranchDashboardData }) {
  const [activatingMember, setActivatingMember] = useState<PendingMember | null>(null);

  const metrics = [
    { label: "Network Members", value: data.totalMembers.toLocaleString() },
    { label: "Active Memberships", value: data.activeMembers.toLocaleString() },
    { label: "Check-ins Here Today", value: data.todayCheckIns.toLocaleString() },
    { label: "Pending Activation", value: data.pendingActivations.toLocaleString() },
  ];

  return (
    <AdminPageTransition>
      <div className="space-y-8">
        <AdminPageHeader title="Dashboard" />

        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="overflow-hidden rounded-[28px]">
              <CardHeader className="gap-5 p-6">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                  {metric.label}
                </CardDescription>
                <CardTitle className="font-display text-[clamp(2.5rem,3vw,3.4rem)] font-black uppercase leading-none tracking-tight">
                  {metric.value}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
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
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No check-ins today yet
                </p>
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
          <Card className="rounded-[30px]">
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/70 p-6">
              <CardTitle>Pending Activation</CardTitle>
              <Badge variant="secondary" className="badge-pending">
                {data.pendingActivations} Walkups
              </Badge>
            </CardHeader>
            <CardContent className="p-6">
              {data.pendingMembers.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No pending activations
                </p>
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
