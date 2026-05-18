"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Mail, Phone, ReceiptText, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PaymentDetails = {
  id: number;
  amount: number | string;
  payment_method: string;
  status: string;
  reference_number?: string | null;
  created_at: string;
  branches?: { name?: string | null } | { name?: string | null }[] | null;
  profiles?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
  }[] | null;
  memberships?: {
    status?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    membership_plans?: { name?: string | null; price?: number | string | null; duration?: number | null } | { name?: string | null; price?: number | string | null; duration?: number | null }[] | null;
  } | {
    status?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    membership_plans?: { name?: string | null; price?: number | string | null; duration?: number | null } | { name?: string | null; price?: number | string | null; duration?: number | null }[] | null;
  }[] | null;
};

function formatDate(date: string | null | undefined) {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function one<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function statusBadgeClass(status: string) {
  if (status === "CONFIRMED" || status === "Confirmed") return "badge-active";
  if (status === "PENDING" || status === "Pending") return "badge-pending";
  return "";
}

export function PaymentSheet({ details }: { details: PaymentDetails }) {
  const router = useRouter();
  const profile = one(details.profiles);
  const branch = one(details.branches);
  const membership = one(details.memberships);
  const plan = one(membership?.membership_plans);
  const memberName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Member";

  function closeModal() {
    router.push("/admin/billing");
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeModal();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={closeModal}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-detail-title"
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-background"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border bg-card p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Payment Details
            </p>
            <h2
              id="payment-detail-title"
              className="mt-2 font-display text-3xl font-black uppercase leading-none tracking-tight text-foreground"
            >
              Receipt #{details.id}
            </h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-xl"
            onClick={closeModal}
            aria-label="Close payment details"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <CreditCard className="mb-3 size-4 text-muted-foreground" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Amount
            </p>
            <p className="mt-1 text-xl font-bold text-foreground">
              PHP {Number(details.amount).toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <ReceiptText className="mb-3 size-4 text-muted-foreground" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Payment Branch
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">{branch?.name ?? "Unassigned"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Status
            </p>
            <Badge variant="secondary" className={statusBadgeClass(details.status)}>
              {details.status}
            </Badge>
          </div>
        </div>

        <div className="space-y-4 px-6 pb-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-xl font-black uppercase tracking-tight text-foreground">
              Member
            </h3>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <p><span className="text-muted-foreground">Name:</span> {memberName}</p>
              <p className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" />{profile?.email ?? "No email"}</p>
              <p className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{profile?.phone ?? "No phone"}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-xl font-black uppercase tracking-tight text-foreground">
              Membership Linked to Payment
            </h3>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <p><span className="text-muted-foreground">Plan:</span> {plan?.name ?? "No linked plan"}</p>
              <p><span className="text-muted-foreground">Status:</span> {membership?.status ?? "Not set"}</p>
              <p><span className="text-muted-foreground">Duration:</span> {plan?.duration ?? "?"} days</p>
              <p><span className="text-muted-foreground">Start:</span> {formatDate(membership?.start_date)}</p>
              <p><span className="text-muted-foreground">Expiry:</span> {formatDate(membership?.end_date)}</p>
              <p><span className="text-muted-foreground">Plan Price:</span> PHP {Number(plan?.price ?? 0).toLocaleString()}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-xl font-black uppercase tracking-tight text-foreground">
              Receipt
            </h3>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <p><span className="text-muted-foreground">Method:</span> {details.payment_method}</p>
              <p><span className="text-muted-foreground">Reference:</span> {details.reference_number || "-"}</p>
              <p><span className="text-muted-foreground">Created:</span> {formatDate(details.created_at)}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
