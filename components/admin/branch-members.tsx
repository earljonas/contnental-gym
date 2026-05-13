"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Activity,
  CalendarDays,
  CreditCard,
  Edit3,
  Mail,
  Menu,
  Phone,
  Printer,
  Shield,
  UserCheck,
  UserPlus,
  Users,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  XCircle,
} from "lucide-react";

import { ActivateModal } from "@/app/(branch)/branch/activate-modal";
import {
  manualCheckInFromMembers,
  registerWalkInMember,
  updateBranchMemberProfile,
} from "@/app/(branch)/branch/members/actions";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPageTransition } from "@/components/admin/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  BranchMembersData,
  BranchPlanOption,
  MemberDetails,
  PendingMember,
} from "@/lib/branch-admin/data";

type Tab = "members" | "walkups";
type Feedback = { id: string; type: "success" | "error"; message: string } | null;
type MemberRow = BranchMembersData["members"][number];

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

function formatDate(date: string | null | undefined) {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
        <div class="row"><span class="label">Amount paid</span><span class="amount">PHP ${escapeHtml(payment.amount.toLocaleString())}</span></div>
        <script>window.print();</script>
      </body>
    </html>
  `);
  win.document.close();
}

function MemberActionsMenu({
  member,
  isPending,
  feedback,
  onEdit,
  onCheckIn,
}: {
  member: MemberRow;
  isPending: boolean;
  feedback: Feedback;
  onEdit: () => void;
  onCheckIn: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function getMenuPosition(rect: DOMRect) {
    const viewportPadding = 12;
    const menuWidth = 176;
    const menuHeight = 92;
    const gap = 8;

    const centeredLeft = rect.left + rect.width / 2 - menuWidth / 2;
    const left = Math.min(
      Math.max(viewportPadding, centeredLeft),
      window.innerWidth - menuWidth - viewportPadding
    );

    const below = rect.bottom + gap;
    const top =
      below + menuHeight > window.innerHeight - viewportPadding
        ? Math.max(viewportPadding, rect.top - menuHeight - gap)
        : below;

    return { top, left };
  }

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!open) return;

    function closeMenu() {
      setOpen(false);
    }

    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);
    return () => {
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [open]);

  function toggleMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition(getMenuPosition(rect));
    }
    setOpen((current) => !current);
  }

  return (
    <div
      className="relative flex justify-center"
      onClick={(event) => event.stopPropagation()}
    >
      <Button
        ref={buttonRef}
        type="button"
        variant="outline"
        size="icon-sm"
        className="rounded-xl"
        onClick={toggleMenu}
        aria-label={`Open actions for ${member.name}`}
        aria-expanded={open}
      >
        <Menu className="size-4" />
      </Button>

      {open ? createPortal(
        <div
          ref={menuRef}
          className="fixed z-[80] w-44 rounded-2xl border border-border bg-card p-1"
          style={{ top: position.top, left: position.left }}
        >
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-full justify-start rounded-xl px-3"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <Edit3 className="size-4 text-muted-foreground" />
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-full justify-start rounded-xl px-3"
            onClick={() => {
              setOpen(false);
              onCheckIn();
            }}
            disabled={isPending || member.status !== "ACTIVE"}
          >
            <UserCheck className="size-4 text-muted-foreground" />
            {feedback?.id === member.id ? feedback.message : "Check in"}
          </Button>
        </div>,
        document.body
      ) : null}
    </div>
  );
}

function BranchMemberSheet({
  details,
  editMode,
  onClose,
}: {
  details: MemberDetails;
  editMode: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(editMode);
  const [error, setError] = useState("");
  const [firstName, setFirstName] = useState(details.profile.first_name);
  const [lastName, setLastName] = useState(details.profile.last_name);
  const [phone, setPhone] = useState(details.profile.phone ?? "");
  const currentStatus = details.memberships[0]?.status ?? "NONE";
  const currentMembership = details.memberships[0] ?? null;
  const initials = `${details.profile.first_name[0] ?? ""}${details.profile.last_name[0] ?? ""}`.toUpperCase();

  function handleSave() {
    startTransition(async () => {
      setError("");
      const result = await updateBranchMemberProfile({
        memberId: details.profile.id,
        firstName,
        lastName,
        phone,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setEditing(false);
      router.replace(`/branch/members?memberId=${details.profile.id}`);
      router.refresh();
    });
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-detail-title"
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border bg-background"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border bg-card p-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary text-xl font-black uppercase text-foreground">
              {details.profile.avatar_url ? (
                <span
                  className="size-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${details.profile.avatar_url})` }}
                  aria-hidden="true"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2
                  id="member-detail-title"
                  className="font-display text-3xl font-black uppercase leading-none tracking-tight text-foreground md:text-4xl"
                >
                  {details.profile.first_name} {details.profile.last_name}
                </h2>
                <Badge variant="secondary" className={statusBadgeClass(currentStatus)}>
                  {currentStatus}
                </Badge>
              </div>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4">
                <span className="flex items-center gap-2">
                  <Mail className="size-4" />
                  {details.profile.email}
                </span>
                <span className="flex items-center gap-2">
                  <Phone className="size-4" />
                  {details.profile.phone || "No phone number"}
                </span>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-xl"
            onClick={onClose}
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
                <p className="mt-1 text-sm font-bold text-foreground">{formatDate(details.profile.created_at)}</p>
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
                <p className="mt-1 truncate text-sm font-bold text-foreground">
                  {currentMembership?.plan_name ?? "No plan"}
                </p>
              </div>
            </div>

            {editing ? (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-5">
                  <h3 className="font-display text-xl font-black uppercase tracking-tight text-foreground">
                    Edit Profile
                  </h3>
                  <p className="text-xs text-muted-foreground">Name and contact number only</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="member-first-name" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      First name
                    </Label>
                    <Input
                      id="member-first-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      className="h-10 rounded-xl focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member-last-name" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Last name
                    </Label>
                    <Input
                      id="member-last-name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      className="h-10 rounded-xl focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member-phone" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Phone
                    </Label>
                    <Input
                      id="member-phone"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="h-10 rounded-xl focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                      disabled={isPending}
                    />
                  </div>
                </div>
                {error ? (
                  <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
                    {error}
                  </p>
                ) : null}
                <div className="mt-5 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-xl"
                    onClick={() => setEditing(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="h-10 rounded-xl bg-[#C9973E] font-bold uppercase tracking-wider text-black"
                    onClick={handleSave}
                    disabled={isPending}
                  >
                    {isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full rounded-xl"
                onClick={() => setEditing(true)}
              >
                <Edit3 className="size-4" />
                Edit profile
              </Button>
            )}
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
                      <span className="text-sm font-bold text-foreground">{membership.plan_name}</span>
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
                        PHP {payment.amount.toLocaleString()}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        via {payment.payment_method} on {formatDate(payment.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={payment.status === "CONFIRMED" ? "secondary" : "outline"}>
                        {payment.status}
                      </Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        className="rounded-xl"
                        onClick={() =>
                          printMemberPaymentReceipt({
                            member: `${details.profile.first_name} ${details.profile.last_name}`.trim(),
                            payment,
                          })
                        }
                        aria-label="Print receipt"
                      >
                        <Printer className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {details.payments.length === 0 ? (
                  <p className="p-5 text-sm text-muted-foreground">No records found.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card">
              <h4 className="border-b border-border px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Attendance Log (This Branch)
              </h4>
              <div className="divide-y divide-border">
                {details.attendance.map((attendance) => (
                  <div key={attendance.id} className="flex items-center justify-between gap-4 p-5">
                    <span className="text-sm font-semibold text-foreground">
                      {formatDate(attendance.check_in_time)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(attendance.check_in_time).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
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

function RegisterWalkInMemberModal({
  plans,
  onClose,
}: {
  plans: BranchPlanOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [planId, setPlanId] = useState(plans[0]?.id.toString() ?? "");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "GCASH">("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const selectedPlan = plans.find((plan) => plan.id.toString() === planId) ?? null;

  function generatePassword() {
    const token = Math.random().toString(36).slice(2, 8).toUpperCase();
    setPassword(`CF-${token}-${new Date().getFullYear()}`);
  }

  function handleSubmit() {
    if (!selectedPlan) {
      setError("Select a membership plan");
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError("Name, email, and temporary password are required");
      return;
    }
    if (!reviewing) {
      setError("");
      setReviewing(true);
      return;
    }

    startTransition(async () => {
      setError("");
      const result = await registerWalkInMember({
        firstName,
        lastName,
        email,
        phone,
        password,
        planId: selectedPlan.id,
        paymentMethod,
        referenceNumber: paymentMethod === "GCASH" ? referenceNumber : undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      onClose();
      router.push(`/branch/members?memberId=${result.memberId}`);
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walk-in-register-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border bg-secondary/30 p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Walk-in Registration
            </p>
            <h2
              id="walk-in-register-title"
              className="mt-1 font-display text-3xl font-black uppercase leading-none tracking-tight text-foreground"
            >
              Register Member
            </h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-xl"
            onClick={onClose}
            disabled={isPending}
            aria-label="Close registration"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-6 overflow-y-auto p-6">
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Member Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="walkin-first-name" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  First name
                </Label>
                <Input
                  id="walkin-first-name"
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(event.target.value);
                    setReviewing(false);
                  }}
                  className="h-11 rounded-xl focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                  disabled={isPending || reviewing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="walkin-last-name" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Last name
                </Label>
                <Input
                  id="walkin-last-name"
                  value={lastName}
                  onChange={(event) => {
                    setLastName(event.target.value);
                    setReviewing(false);
                  }}
                  className="h-11 rounded-xl focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                  disabled={isPending || reviewing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="walkin-email" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="walkin-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setReviewing(false);
                  }}
                  className="h-11 rounded-xl focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                  disabled={isPending || reviewing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="walkin-phone" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Phone
                </Label>
                <Input
                  id="walkin-phone"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setReviewing(false);
                  }}
                  className="h-11 rounded-xl focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                  disabled={isPending || reviewing}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Membership and Payment
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="walkin-plan" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Plan
                </Label>
                <Select
                  id="walkin-plan"
                  value={planId}
                  onChange={(event) => {
                    setPlanId(event.target.value);
                    setReviewing(false);
                  }}
                  className="h-11 rounded-xl focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                  disabled={isPending || reviewing || plans.length === 0}
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - PHP {plan.price.toLocaleString()}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="walkin-method" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Payment method
                </Label>
                <Select
                  id="walkin-method"
                  value={paymentMethod}
                  onChange={(event) => {
                    setPaymentMethod(event.target.value as "CASH" | "GCASH");
                    setReviewing(false);
                  }}
                  className="h-11 rounded-xl focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                  disabled={isPending || reviewing}
                >
                  <option value="CASH">Cash</option>
                  <option value="GCASH">GCash</option>
                </Select>
              </div>
              {paymentMethod === "GCASH" ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="walkin-reference" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Reference number
                  </Label>
                  <Input
                    id="walkin-reference"
                    value={referenceNumber}
                    onChange={(event) => {
                      setReferenceNumber(event.target.value);
                      setReviewing(false);
                    }}
                    className="h-11 rounded-xl focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                    disabled={isPending || reviewing}
                  />
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Login Access
            </h3>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor="walkin-password" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Temporary password
                </Label>
                <Input
                  id="walkin-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setReviewing(false);
                  }}
                  className="h-11 rounded-xl focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                  disabled={isPending || reviewing}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 self-end rounded-xl"
                onClick={generatePassword}
                disabled={isPending || reviewing}
              >
                Generate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Give this password to the member after registration. They can change it in their profile.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-secondary/30 p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Summary
            </h3>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Member</p>
                <p className="font-semibold text-foreground">{`${firstName} ${lastName}`.trim() || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="font-semibold text-foreground">{selectedPlan?.name ?? "No plan"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-semibold text-foreground">
                  {selectedPlan ? `PHP ${selectedPlan.price.toLocaleString()}` : "PHP 0"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment</p>
                <p className="font-semibold text-foreground">{paymentMethod}</p>
              </div>
            </div>
            {reviewing ? (
              <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-500">
                Review these details before creating the account and activating the membership.
              </p>
            ) : null}
          </section>

          {error ? (
            <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl px-5"
              onClick={() => (reviewing ? setReviewing(false) : onClose())}
              disabled={isPending}
            >
              {reviewing ? "Back" : "Cancel"}
            </Button>
            <Button
              type="button"
              className="h-11 rounded-xl bg-[#C9973E] px-5 font-bold uppercase tracking-wider text-black"
              onClick={handleSubmit}
              disabled={isPending || plans.length === 0}
            >
              {isPending ? "Creating..." : reviewing ? "Create and Activate" : "Review Registration"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BranchMembersPage({
  data,
  pendingWalkups,
  memberDetails,
  planOptions,
  editMode,
}: {
  data: BranchMembersData;
  pendingWalkups: PendingMember[];
  memberDetails: MemberDetails | null;
  planOptions: BranchPlanOption[];
  editMode: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All");
  const [memberPage, setMemberPage] = useState(1);
  const [checkInFeedback, setCheckInFeedback] = useState<Feedback>(null);
  const [activatingMember, setActivatingMember] = useState<PendingMember | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const filteredMembers = data.members.filter((member) => {
    if (search.trim()) {
      const query = search.toLowerCase();
      if (
        !member.name.toLowerCase().includes(query) &&
        !member.email.toLowerCase().includes(query) &&
        !member.homeBranch.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (statusFilter !== "All" && member.status !== statusFilter) return false;
    if (planFilter !== "All" && member.plan !== planFilter) return false;
    return true;
  });
  const membersPerPage = 10;
  const memberPageCount = Math.max(1, Math.ceil(filteredMembers.length / membersPerPage));
  const safeMemberPage = Math.min(memberPage, memberPageCount);
  const paginatedMembers = filteredMembers.slice(
    (safeMemberPage - 1) * membersPerPage,
    safeMemberPage * membersPerPage
  );

  function openMember(memberId: string, mode: "view" | "edit" = "view") {
    router.push(`/branch/members?memberId=${memberId}${mode === "edit" ? "&edit=1" : ""}`);
  }

  function handleCheckIn(memberId: string) {
    startTransition(async () => {
      const result = await manualCheckInFromMembers(memberId);
      setCheckInFeedback({
        id: memberId,
        type: result.success ? "success" : "error",
        message: result.success ? "Checked in" : result.error ?? "Failed",
      });
      if (result.success) {
        router.refresh();
      }
      setTimeout(() => setCheckInFeedback(null), 3000);
    });
  }

  const metrics = [
    { label: "All Members", value: data.totalMembers, icon: Users },
    { label: "Registered Here", value: data.registeredHereCount, icon: UserCheck },
    { label: "Pending", value: data.pendingCount, icon: Clock },
    { label: "Expired / Cancelled", value: data.expiredCount, icon: XCircle },
  ];

  return (
    <AdminPageTransition>
      <div className="space-y-8">
        <AdminPageHeader
          title="Members"
          actionLabel="Register Member"
          onAction={() => setShowRegisterModal(true)}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="overflow-hidden rounded-3xl">
              <CardHeader className="gap-5 p-6">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-[11px] font-bold uppercase tracking-[0.18em]">
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

        <div role="tablist" className="flex w-fit items-center gap-1 rounded-2xl border border-border bg-secondary/30 p-1">
          <button
            type="button"
            role="tab"
            id="tab-members-tab"
            aria-selected={activeTab === "members"}
            aria-controls="tab-members-panel"
            onClick={() => setActiveTab("members")}
            className={`rounded-xl px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
              activeTab === "members"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Member Directory
          </button>
          <button
            type="button"
            role="tab"
            id="tab-walkups-tab"
            aria-selected={activeTab === "walkups"}
            aria-controls="tab-walkups-panel"
            onClick={() => setActiveTab("walkups")}
            className={`rounded-xl px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
              activeTab === "walkups"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending Walkups
            {pendingWalkups.length > 0 ? (
              <span className="ml-2 inline-flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black">
                {pendingWalkups.length}
              </span>
            ) : null}
          </button>
        </div>

        {activeTab === "members" ? (
          <Card id="tab-members-panel" role="tabpanel" aria-labelledby="tab-members-tab" className="rounded-3xl">
            <CardHeader className="border-b border-border p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <CardTitle>Directory</CardTitle>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setMemberPage(1);
                    }}
                    placeholder="Search name, email, registration branch..."
                    className="h-10 w-full rounded-xl border-border bg-background pl-4 text-sm focus:border-[#C9973E] focus:ring-[#C9973E]/20 sm:w-[240px]"
                  />
                  <Select
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setMemberPage(1);
                    }}
                    className="h-10 w-full rounded-xl border-border bg-background text-sm sm:w-[140px]"
                  >
                    <option value="All">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Select>
                  {data.plans.length > 0 ? (
                    <Select
                      value={planFilter}
                      onChange={(event) => {
                        setPlanFilter(event.target.value);
                        setMemberPage(1);
                      }}
                      className="h-10 w-full rounded-xl border-border bg-background text-sm sm:w-[140px]"
                    >
                      <option value="All">All Plans</option>
                      {data.plans.map((plan) => (
                        <option key={plan} value={plan}>
                          {plan}
                        </option>
                      ))}
                    </Select>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {filteredMembers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center md:p-12">
                  <p className="text-sm font-semibold text-foreground">No members found</p>
                  <p className="mt-1 text-xs text-muted-foreground">Try another search or filter.</p>
                </div>
              ) : (
                <Table className="min-w-[820px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Name</TableHead>
                      <TableHead>Registration Branch</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Check-in</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMembers.map((member) => (
                      <TableRow
                        key={member.id}
                        className="cursor-pointer"
                        tabIndex={0}
                        onClick={() => openMember(member.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openMember(member.id);
                          }
                        }}
                      >
                        <TableCell>
                          <div>
                            <p className="text-[15px] font-semibold">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-[15px] text-muted-foreground">{member.homeBranch}</TableCell>
                        <TableCell className="text-[15px]">{member.plan}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusBadgeClass(member.status)}>
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[15px] text-muted-foreground">{member.joined}</TableCell>
                        <TableCell className="text-[15px] text-muted-foreground">{member.lastCheckIn}</TableCell>
                        <TableCell className="text-center">
                          <MemberActionsMenu
                            member={member}
                            isPending={isPending}
                            feedback={checkInFeedback}
                            onEdit={() => openMember(member.id, "edit")}
                            onCheckIn={() => handleCheckIn(member.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {filteredMembers.length > membersPerPage ? (
                <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Showing {(safeMemberPage - 1) * membersPerPage + 1}-
                    {Math.min(safeMemberPage * membersPerPage, filteredMembers.length)} of{" "}
                    {filteredMembers.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-xl px-3"
                      onClick={() => setMemberPage((page) => Math.max(1, page - 1))}
                      disabled={safeMemberPage === 1}
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </Button>
                    <span className="min-w-16 text-center text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      {safeMemberPage}/{memberPageCount}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-xl px-3"
                      onClick={() => setMemberPage((page) => Math.min(memberPageCount, page + 1))}
                      disabled={safeMemberPage === memberPageCount}
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {activeTab === "walkups" ? (
          <Card id="tab-walkups-panel" role="tabpanel" aria-labelledby="tab-walkups-tab" className="rounded-3xl">
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border p-6">
              <div>
                <CardTitle>Pending Walkups</CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Members who registered online but have not been activated at any branch yet.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="badge-pending">
                {pendingWalkups.length} pending
              </Badge>
            </CardHeader>
            <CardContent className="p-6">
              {pendingWalkups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center md:p-12">
                  <p className="text-sm font-semibold text-foreground">No pending walkups</p>
                  <p className="mt-1 text-xs text-muted-foreground">New online registrations will appear here.</p>
                </div>
              ) : (
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingWalkups.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="text-[15px] font-medium">{member.name}</TableCell>
                        <TableCell className="text-[15px] text-muted-foreground">{member.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {member.plan}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[15px] text-muted-foreground">{member.registeredDate}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            className="h-10 rounded-xl bg-[#C9973E] px-4 text-[10px] font-bold uppercase tracking-wider text-black"
                            onClick={() => setActivatingMember(member)}
                          >
                            <UserPlus className="size-4" />
                            Activate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {memberDetails ? (
        <BranchMemberSheet
          details={memberDetails}
          editMode={editMode}
          onClose={() => router.push("/branch/members")}
        />
      ) : null}

      {activatingMember ? (
        <ActivateModal member={activatingMember} onClose={() => setActivatingMember(null)} />
      ) : null}

      {showRegisterModal ? (
        <RegisterWalkInMemberModal
          plans={planOptions}
          onClose={() => setShowRegisterModal(false)}
        />
      ) : null}
    </AdminPageTransition>
  );
}
