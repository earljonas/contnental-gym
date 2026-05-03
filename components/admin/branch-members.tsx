"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  UserCheck,
  UserPlus,
  Users,
  Shield,
  Clock,
  XCircle,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPageTransition } from "@/components/admin/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  BranchMembersData,
  MemberDetails,
  MemberRow,
  PendingMember,
} from "@/lib/branch-admin/data";
import { manualCheckInFromMembers } from "@/app/(branch)/branch/members/actions";
import { ActivateModal } from "@/app/(branch)/branch/activate-modal";

// ── Status helpers ──

function statusBadgeClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "badge-active";
    case "PENDING":
      return "badge-pending";
    case "EXPIRED":
    case "CANCELLED":
      return "badge-expired";
    default:
      return "";
  }
}

// ── Member Detail Sheet ──

function BranchMemberSheet({
  details,
  onClose,
}: {
  details: MemberDetails;
  onClose: () => void;
}) {
  const currentStatus = details.memberships[0]?.status ?? "NONE";

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[420px] sm:w-[560px] overflow-y-auto bg-background/95 backdrop-blur-xl border-border">
        <SheetHeader className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="text-2xl font-bold uppercase tracking-tight">
                {details.profile.first_name} {details.profile.last_name}
              </SheetTitle>
              <SheetDescription className="text-muted-foreground mt-1 text-sm">
                {details.profile.email}
                {details.profile.phone ? ` · ${details.profile.phone}` : ""}
              </SheetDescription>
            </div>
            <Badge
              variant="secondary"
              className={statusBadgeClass(currentStatus)}
            >
              {currentStatus}
            </Badge>
          </div>
          {details.profile.avatar_url && (
            <img
              src={details.profile.avatar_url}
              alt=""
              className="mt-3 size-16 rounded-full border-2 border-border object-cover"
            />
          )}
        </SheetHeader>

        <div className="space-y-6">
          {/* Profile Info */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 border-b border-border pb-2">
              Profile
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary/20 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Joined
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {new Date(details.profile.created_at).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" }
                  )}
                </p>
              </div>
              <div className="rounded-lg bg-secondary/20 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Total Check-ins
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {details.attendance.length}
                </p>
              </div>
            </div>
          </div>

          {/* Membership History */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 border-b border-border pb-2">
              Membership History
            </h4>
            <div className="space-y-2">
              {details.memberships.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/20"
                >
                  <div>
                    <span className="text-sm font-semibold text-foreground">
                      {m.plan_name}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {m.start_date
                        ? new Date(m.start_date).toLocaleDateString()
                        : new Date(m.created_at).toLocaleDateString()}{" "}
                      —{" "}
                      {m.end_date
                        ? new Date(m.end_date).toLocaleDateString()
                        : "Ongoing"}
                    </p>
                  </div>
                  <Badge variant="outline" className={statusBadgeClass(m.status)}>
                    {m.status}
                  </Badge>
                </div>
              ))}
              {details.memberships.length === 0 && (
                <p className="text-sm text-muted-foreground">No records found.</p>
              )}
            </div>
          </div>

          {/* Payment History */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 border-b border-border pb-2">
              Recent Payments
            </h4>
            <div className="space-y-2">
              {details.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/20"
                >
                  <div>
                    <span className="text-sm font-semibold text-foreground">
                      PHP {p.amount.toLocaleString()}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      via {p.payment_method} ·{" "}
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={p.status === "CONFIRMED" ? "secondary" : "outline"}
                  >
                    {p.status}
                  </Badge>
                </div>
              ))}
              {details.payments.length === 0 && (
                <p className="text-sm text-muted-foreground">No records found.</p>
              )}
            </div>
          </div>

          {/* Attendance Log */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 border-b border-border pb-2">
              Attendance Log (This Branch)
            </h4>
            <div className="space-y-2">
              {details.attendance.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/20"
                >
                  <span className="text-sm text-foreground">
                    {new Date(a.check_in_time).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(a.check_in_time).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
              {details.attendance.length === 0 && (
                <p className="text-sm text-muted-foreground">No records found.</p>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main Members Page ──

type Tab = "members" | "walkups";

export function BranchMembersPage({
  data,
  pendingWalkups,
  memberDetails,
}: {
  data: BranchMembersData;
  pendingWalkups: PendingMember[];
  memberDetails: MemberDetails | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [checkInFeedback, setCheckInFeedback] = useState<{
    id: string;
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [activatingMember, setActivatingMember] = useState<PendingMember | null>(null);

  // Filtering
  const filteredMembers = data.members.filter((m) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !m.name.toLowerCase().includes(q) &&
        !m.email.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (statusFilter !== "All" && m.status !== statusFilter) return false;
    if (planFilter !== "All" && m.plan !== planFilter) return false;
    return true;
  });

  function handleView(memberId: string) {
    router.push(`/branch/members?memberId=${memberId}`);
  }

  function handleCheckIn(memberId: string) {
    startTransition(async () => {
      const result = await manualCheckInFromMembers(memberId);
      if (result.success) {
        setCheckInFeedback({
          id: memberId,
          type: "success",
          message: "Checked in",
        });
        router.refresh();
      } else {
        setCheckInFeedback({
          id: memberId,
          type: "error",
          message: result.error ?? "Failed",
        });
      }
      setTimeout(() => setCheckInFeedback(null), 3000);
    });
  }

  const metrics = [
    {
      label: "Total Members",
      value: data.totalMembers,
      icon: Users,
    },
    {
      label: "Active",
      value: data.activeCount,
      icon: Shield,
    },
    {
      label: "Pending",
      value: data.pendingCount,
      icon: Clock,
    },
    {
      label: "Expired / Cancelled",
      value: data.expiredCount,
      icon: XCircle,
    },
  ];

  return (
    <AdminPageTransition>
      <div className="space-y-8">
        <AdminPageHeader title="Members" />

        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="overflow-hidden rounded-[28px]">
              <CardHeader className="gap-5 p-6">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                    {metric.label}
                  </CardDescription>
                  <metric.icon className="size-5 text-muted-foreground" />
                </div>
                <CardTitle className="font-display text-[clamp(2.5rem,3vw,3.4rem)] font-black uppercase leading-none tracking-tight">
                  {metric.value.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 rounded-2xl border border-border bg-secondary/30 p-1 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`rounded-xl px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
              activeTab === "members"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Branch Members
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("walkups")}
            className={`rounded-xl px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
              activeTab === "walkups"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending Walkups
            {pendingWalkups.length > 0 && (
              <span className="ml-2 inline-flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {pendingWalkups.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Branch Members Tab ── */}
        {activeTab === "members" && (
          <Card className="rounded-[30px]">
            <CardHeader className="border-b border-border/70 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <CardTitle>Directory</CardTitle>

                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative min-w-[200px]">
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name or email..."
                      className="h-10 rounded-xl border-border bg-background pl-4 text-sm"
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 w-full sm:w-[140px] rounded-xl border-border bg-background text-sm"
                  >
                    <option value="All">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Select>
                  {data.plans.length > 0 && (
                    <Select
                      value={planFilter}
                      onChange={(e) => setPlanFilter(e.target.value)}
                      className="h-10 w-full sm:w-[140px] rounded-xl border-border bg-background text-sm"
                    >
                      <option value="All">All Plans</option>
                      {data.plans.map((plan) => (
                        <option key={plan} value={plan}>
                          {plan}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {filteredMembers.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  No members found
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Name</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Last Check-in</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div>
                              <p className="text-[15px] font-medium">
                                {member.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-[15px]">
                            {member.plan}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={statusBadgeClass(member.status)}
                            >
                              {member.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[15px] text-muted-foreground">
                            {member.joined}
                          </TableCell>
                          <TableCell className="text-[15px] text-muted-foreground">
                            {member.lastCheckIn}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 rounded-full px-3 text-[10px] font-semibold uppercase tracking-[0.14em]"
                                onClick={() => handleView(member.id)}
                              >
                                <Eye className="mr-1 size-3" />
                                View
                              </Button>
                              {member.status === "ACTIVE" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`h-8 rounded-full px-3 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                    checkInFeedback?.id === member.id
                                      ? checkInFeedback.type === "success"
                                        ? "border-emerald-500 text-emerald-600"
                                        : "border-rose-500 text-rose-600"
                                      : ""
                                  }`}
                                  onClick={() => handleCheckIn(member.id)}
                                  disabled={isPending}
                                >
                                  <UserCheck className="mr-1 size-3" />
                                  {checkInFeedback?.id === member.id
                                    ? checkInFeedback.message
                                    : "Check In"}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Pending Walkups Tab ── */}
        {activeTab === "walkups" && (
          <Card className="rounded-[30px]">
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/70 p-6">
              <div>
                <CardTitle>Pending Walkups</CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Members who registered online but haven&apos;t been activated
                  at any branch yet
                </CardDescription>
              </div>
              <Badge variant="secondary" className="badge-pending">
                {pendingWalkups.length} pending
              </Badge>
            </CardHeader>
            <CardContent className="p-6">
              {pendingWalkups.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  No pending walkups
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[640px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingWalkups.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="text-[15px] font-medium">
                            {member.name}
                          </TableCell>
                          <TableCell className="text-[15px] text-muted-foreground">
                            {member.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {member.plan}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[15px] text-muted-foreground">
                            {member.registeredDate}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              className="h-8 rounded-full px-4 text-[10px] font-semibold uppercase tracking-[0.14em]"
                              onClick={() => setActivatingMember(member)}
                            >
                              <UserPlus className="mr-1 size-3" />
                              Activate
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Member detail sheet */}
      {memberDetails && (
        <BranchMemberSheet
          details={memberDetails}
          onClose={() => router.push("/branch/members")}
        />
      )}

      {/* Activate modal for walkups */}
      {activatingMember && (
        <ActivateModal
          member={activatingMember}
          onClose={() => setActivatingMember(null)}
        />
      )}
    </AdminPageTransition>
  );
}
