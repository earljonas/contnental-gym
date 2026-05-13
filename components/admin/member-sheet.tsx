"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CalendarDays,
  CreditCard,
  Mail,
  Phone,
  Printer,
  Shield,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleMemberStatus } from "@/app/(admin)/admin/members/actions";

type MemberDetails = {
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string | null;
    avatar_url?: string | null;
    role: string;
    created_at?: string | null;
  } | null;
  memberships: {
    id: number;
    status: string;
    start_date?: string | null;
    created_at: string;
    end_date: string | null;
    membership_plans?: { name?: string | null } | { name?: string | null }[] | null;
  }[];
  payments: {
    id: number;
    amount: number | string;
    status: string;
    payment_method: string;
    created_at: string;
  }[];
  attendance: {
    id: number;
    check_in_time: string;
    branches?: { name?: string | null } | { name?: string | null }[] | null;
  }[];
};

function formatDate(date: string | null | undefined) {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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

function planName(
  plan: MemberDetails["memberships"][number]["membership_plans"]
) {
  return (Array.isArray(plan) ? plan[0] : plan)?.name ?? "Unknown Plan";
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function printMemberPaymentReceipt({
  member,
  payment,
}: {
  member: string;
  payment: MemberDetails["payments"][number];
}) {
  const win = window.open("", "_blank", "width=420,height=640");
  if (!win) return;

  win.document.write(`
    <html>
      <head>
        <title>Receipt #${escapeHtml(payment.id)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1 { font-size: 20px; margin: 0 0 4px; }
          .muted { color: #666; font-size: 12px; }
          .line { border-top: 1px solid #ddd; margin: 18px 0; }
          .row { display: flex; justify-content: space-between; margin: 10px 0; gap: 16px; }
          .label { color: #666; }
          .amount { font-size: 24px; font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>CONTNENTAL FITNESS GYM</h1>
        <div class="muted">Payment Receipt #${escapeHtml(payment.id)}</div>
        <div class="line"></div>
        <div class="row"><span class="label">Member</span><strong>${escapeHtml(member)}</strong></div>
        <div class="row"><span class="label">Date</span><span>${escapeHtml(formatDate(payment.created_at))}</span></div>
        <div class="row"><span class="label">Method</span><span>${escapeHtml(payment.payment_method)}</span></div>
        <div class="row"><span class="label">Status</span><span>${escapeHtml(payment.status)}</span></div>
        <div class="line"></div>
        <div class="row"><span class="label">Amount paid</span><span class="amount">PHP ${escapeHtml(Number(payment.amount).toLocaleString())}</span></div>
        <script>window.print();</script>
      </body>
    </html>
  `);
  win.document.close();
}

export function MemberSheet({ details }: { details: MemberDetails }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function closeModal() {
    router.push("/admin/members");
  }

  function handleToggle() {
    if (!details.profile) return;
    const memberId = details.profile.id;

    startTransition(async () => {
      await toggleMemberStatus(memberId, details.memberships[0]?.status ?? "NONE");
      router.refresh();
    });
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  if (!details || !details.profile) return null;

  const profile = details.profile;
  const currentMembership = details.memberships[0] ?? null;
  const currentStatus = currentMembership?.status ?? "NONE";
  const currentPlan = currentMembership ? planName(currentMembership.membership_plans) : "No plan";
  const initials = `${profile.first_name[0] ?? ""}${profile.last_name[0] ?? ""}`.toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={closeModal}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="super-member-detail-title"
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border bg-background"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border bg-card p-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary text-xl font-black uppercase text-foreground">
              {profile.avatar_url ? (
                <span
                  className="size-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${profile.avatar_url})` }}
                  aria-hidden="true"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2
                  id="super-member-detail-title"
                  className="font-display text-3xl font-black uppercase leading-none tracking-tight text-foreground md:text-4xl"
                >
                  {profile.first_name} {profile.last_name}
                </h2>
                <Badge variant="secondary" className={statusBadgeClass(currentStatus)}>
                  {currentStatus}
                </Badge>
              </div>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4">
                <span className="flex items-center gap-2">
                  <Mail className="size-4" />
                  {profile.email}
                </span>
                <span className="flex items-center gap-2">
                  <Phone className="size-4" />
                  {profile.phone || "No phone number"}
                </span>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-xl"
            onClick={closeModal}
            aria-label="Close member details"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4 border-b border-border bg-card/50 p-6 lg:border-b-0 lg:border-r">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-border bg-card p-4">
                <CalendarDays className="mb-3 size-4 text-muted-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Joined
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">{formatDate(profile.created_at)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <Activity className="mb-3 size-4 text-muted-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Check-ins
                </p>
                <p className="mt-1 text-sm font-bold text-foreground">{details.attendance.length}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <Shield className="mb-3 size-4 text-muted-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Current Plan
                </p>
                <p className="mt-1 truncate text-sm font-bold text-foreground">{currentPlan}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-display text-xl font-black uppercase tracking-tight text-foreground">
                Account Status
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Suspend or reactivate this member.
              </p>
              <Button
                type="button"
                variant={currentStatus === "ACTIVE" ? "destructive" : "default"}
                className="mt-5 h-10 w-full rounded-xl text-xs font-bold uppercase tracking-[0.16em]"
                disabled={isPending || currentStatus === "NONE"}
                onClick={handleToggle}
              >
                {isPending ? "Syncing..." : currentStatus === "ACTIVE" ? "Suspend" : "Activate"}
              </Button>
            </div>
          </aside>

          <div className="space-y-6 p-6">
            <section className="rounded-2xl border border-border bg-card">
              <h4 className="border-b border-border px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Membership History
              </h4>
              <div className="divide-y divide-border">
                {details.memberships.map((membership) => (
                  <div key={membership.id} className="flex items-center justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-foreground">
                        {planName(membership.membership_plans)}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(membership.start_date ?? membership.created_at)} to{" "}
                        {membership.end_date ? formatDate(membership.end_date) : "Ongoing"}
                      </p>
                    </div>
                    <Badge variant="outline" className={statusBadgeClass(membership.status)}>
                      {membership.status}
                    </Badge>
                  </div>
                ))}
                {details.memberships.length === 0 ? (
                  <p className="p-5 text-sm text-muted-foreground">No records found.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card">
              <h4 className="border-b border-border px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Recent Payments
              </h4>
              <div className="divide-y divide-border">
                {details.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <CreditCard className="size-4 text-muted-foreground" />
                        PHP {Number(payment.amount).toLocaleString()}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        via {payment.payment_method} on {formatDate(payment.created_at)}
                      </p>
                    </div>
                    <Badge variant="secondary" className={payment.status === "CONFIRMED" ? "badge-active" : "badge-pending"}>
                      {payment.status}
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="rounded-xl"
                      onClick={() =>
                        printMemberPaymentReceipt({
                          member: `${profile.first_name} ${profile.last_name}`.trim(),
                          payment,
                        })
                      }
                      aria-label="Print receipt"
                    >
                      <Printer className="size-4" />
                    </Button>
                  </div>
                ))}
                {details.payments.length === 0 ? (
                  <p className="p-5 text-sm text-muted-foreground">No records found.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card">
              <h4 className="border-b border-border px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Attendance Log
              </h4>
              <div className="divide-y divide-border">
                {details.attendance.map((attendance) => {
                  const branch = Array.isArray(attendance.branches)
                    ? attendance.branches[0]
                    : attendance.branches;

                  return (
                    <div key={attendance.id} className="flex items-center justify-between gap-4 p-5">
                      <div>
                        <span className="text-sm font-semibold text-foreground">
                          {formatDate(attendance.check_in_time)}
                        </span>
                        <p className="text-xs text-muted-foreground">{branch?.name ?? "Branch"}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(attendance.check_in_time).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })}
                {details.attendance.length === 0 ? (
                  <p className="p-5 text-sm text-muted-foreground">No records found.</p>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
