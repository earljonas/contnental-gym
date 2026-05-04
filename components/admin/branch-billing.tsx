"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CreditCard,
  DollarSign,
  AlertTriangle,
  Clock,
  Plus,
  X,
} from "lucide-react";
import { motion } from "motion/react";

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
import type { BranchBillingData, BillingMemberOption } from "@/lib/branch-admin/data";
import {
  confirmBranchPayment,
  recordBranchPayment,
} from "@/app/(branch)/branch/billing/actions";

// ── Confirm Payment Modal ──

function ConfirmModal({
  paymentId,
  memberName,
  amount,
  onClose,
}: {
  paymentId: number;
  memberName: string;
  amount: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [method, setMethod] = useState<"CASH" | "GCASH">("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");

  function handleSubmit() {
    startTransition(async () => {
      setError("");
      const result = await confirmBranchPayment({
        paymentId,
        method,
        referenceNumber: method === "GCASH" ? referenceNumber.trim() || undefined : undefined,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg overflow-hidden rounded-[32px] border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/50 bg-secondary/30 px-8 py-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Payment Confirmation
            </p>
            <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-foreground">
              Confirm Payment
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex size-8 items-center justify-center rounded-full bg-background/50 text-muted-foreground hover:bg-foreground hover:text-background transition-colors"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="rounded-2xl border border-border bg-secondary/20 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{memberName}</span>
              <span className="text-sm font-bold text-foreground">{amount}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="confirm-method" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Payment Method
            </Label>
            <Select
              id="confirm-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as "CASH" | "GCASH")}
              className="h-12 rounded-2xl bg-secondary/20"
              disabled={isPending}
            >
              <option value="CASH">Cash</option>
              <option value="GCASH">GCash</option>
            </Select>
          </div>

          {method === "GCASH" && (
            <div className="space-y-2.5">
              <Label htmlFor="confirm-ref" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Reference Number
              </Label>
              <Input
                id="confirm-ref"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. 1234567890"
                className="h-12 rounded-2xl bg-secondary/20"
                disabled={isPending}
              />
            </div>
          )}

          {error && (
            <p className="text-sm font-medium text-destructive bg-destructive/10 px-4 py-3 rounded-xl">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              className="h-12 rounded-2xl px-6 text-xs font-bold uppercase tracking-[0.16em] hover:bg-secondary/50"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-12 rounded-2xl px-8 text-xs font-bold uppercase tracking-[0.16em]"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? "Confirming..." : "Confirm Payment"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Record Payment Modal ──

function RecordPaymentModal({
  members,
  onClose,
}: {
  members: BillingMemberOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<BillingMemberOption | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "GCASH">("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredMembers = search.trim().length > 0
    ? members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelectMember(m: BillingMemberOption) {
    setSelectedMember(m);
    setSearch(m.name);
    setIsDropdownOpen(false);
    if (m.planPrice > 0) {
      setAmount(m.planPrice.toString());
    }
  }

  function handleSubmit() {
    if (!selectedMember) {
      setError("Please select a member.");
      return;
    }
    const numAmount = Number.parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    startTransition(async () => {
      setError("");
      const result = await recordBranchPayment({
        userId: selectedMember.id,
        amount: numAmount,
        method,
        referenceNumber: method === "GCASH" ? referenceNumber.trim() || undefined : undefined,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg overflow-hidden rounded-[32px] border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/50 bg-secondary/30 px-8 py-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              New Transaction
            </p>
            <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-foreground">
              Record Payment
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex size-8 items-center justify-center rounded-full bg-background/50 text-muted-foreground hover:bg-foreground hover:text-background transition-colors"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Member search */}
          <div className="space-y-2.5" ref={dropdownRef}>
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Member
            </Label>
            <div className="relative">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedMember(null);
                  setAmount("");
                  setIsDropdownOpen(e.target.value.trim().length > 0);
                }}
                onFocus={() => {
                  if (search.trim().length > 0) setIsDropdownOpen(true);
                }}
                placeholder="Search member name..."
                className="h-12 rounded-2xl bg-secondary/20"
                disabled={isPending}
              />
              {isDropdownOpen && filteredMembers.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-border bg-card shadow-xl">
                  {filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary/50 first:rounded-t-2xl last:rounded-b-2xl"
                      onClick={() => handleSelectMember(m)}
                    >
                      <span>{m.name}</span>
                      {m.planPrice > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          PHP {m.planPrice.toLocaleString()}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2.5">
            <Label htmlFor="record-amount" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Amount (PHP)
            </Label>
            <Input
              id="record-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-12 rounded-2xl bg-secondary/20"
              disabled={isPending}
            />
          </div>

          {/* Method */}
          <div className="space-y-2.5">
            <Label htmlFor="record-method" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Method
            </Label>
            <Select
              id="record-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as "CASH" | "GCASH")}
              className="h-12 rounded-2xl bg-secondary/20"
              disabled={isPending}
            >
              <option value="CASH">Cash</option>
              <option value="GCASH">GCash</option>
            </Select>
          </div>

          {/* Reference number */}
          {method === "GCASH" && (
            <div className="space-y-2.5">
              <Label htmlFor="record-ref" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Reference Number
              </Label>
              <Input
                id="record-ref"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. GCash ref #"
                className="h-12 rounded-2xl bg-secondary/20"
                disabled={isPending}
              />
            </div>
          )}

          {error && (
            <p className="text-sm font-medium text-destructive bg-destructive/10 px-4 py-3 rounded-xl">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              className="h-12 rounded-2xl px-6 text-xs font-bold uppercase tracking-[0.16em] hover:bg-secondary/50"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-12 rounded-2xl px-8 text-xs font-bold uppercase tracking-[0.16em]"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Record Payment"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Status helpers ──

function statusBadgeClass(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "badge-active";
    case "PENDING":
      return "badge-pending";
    default:
      return "";
  }
}

// ── Main Billing Page ──

export function BranchBillingPage({
  data,
  members,
}: {
  data: BranchBillingData;
  members: BillingMemberOption[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [confirmingPayment, setConfirmingPayment] = useState<{
    id: number;
    member: string;
    amount: string;
  } | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);

  const filteredRows = data.rows.filter((row) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !row.member.toLowerCase().includes(q) &&
        !row.amount.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (statusFilter !== "All" && row.status !== statusFilter) return false;
    if (methodFilter !== "All" && row.method !== methodFilter) return false;
    return true;
  });

  const metrics = [
    {
      label: "Confirmed this month",
      value: data.confirmedThisMonth.toLocaleString(),
      icon: Check,
    },
    {
      label: "Pending collection",
      value: data.pendingCollection.toLocaleString(),
      icon: Clock,
    },
    {
      label: "Overdue",
      value: data.overdue.toLocaleString(),
      icon: AlertTriangle,
    },
    {
      label: "Total collected",
      value: `PHP ${data.totalCollected.toLocaleString()}`,
      icon: DollarSign,
    },
  ];

  return (
    <AdminPageTransition>
      <div className="space-y-8">
        <AdminPageHeader
          title="Billing"
          actionLabel="Record payment"
          onAction={() => setShowRecordModal(true)}
        />

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
                <CardTitle className="font-display text-[clamp(2rem,3vw,3.4rem)] font-black uppercase leading-none tracking-tight">
                  {metric.value}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Transactions Table */}
        <Card className="rounded-[30px]">
          <CardHeader className="border-b border-border/70 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle>Transactions</CardTitle>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search member or amount..."
                  className="h-10 w-full sm:w-[200px] rounded-xl border-border bg-background pl-4 text-sm"
                />
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 w-full sm:w-[140px] rounded-xl border-border bg-background text-sm"
                >
                  <option value="All">All Status</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending</option>
                </Select>
                {data.methods.length > 1 && (
                  <Select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="h-10 w-full sm:w-[140px] rounded-xl border-border bg-background text-sm"
                  >
                    <option value="All">All Methods</option>
                    {data.methods.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {filteredRows.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No transactions found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-[15px] font-medium">
                          {row.member}
                        </TableCell>
                        <TableCell className="text-[15px] font-semibold">
                          {row.amount}
                        </TableCell>
                        <TableCell className="text-[15px] text-muted-foreground">
                          {row.plan}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              row.method === "GCASH"
                                ? "bg-sky-500/10 text-sky-600 border-sky-500/20"
                                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            }
                          >
                            {row.method}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[15px] text-muted-foreground">
                          {row.date}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={statusBadgeClass(row.status)}
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {row.status === "PENDING" ? (
                            <Button
                              size="sm"
                              className="h-8 rounded-full px-4 text-[10px] font-semibold uppercase tracking-[0.14em]"
                              onClick={() =>
                                setConfirmingPayment({
                                  id: row.id,
                                  member: row.member,
                                  amount: row.amount,
                                })
                              }
                            >
                              <Check className="mr-1 size-3" />
                              Confirm
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm payment modal */}
      {confirmingPayment && (
        <ConfirmModal
          paymentId={confirmingPayment.id}
          memberName={confirmingPayment.member}
          amount={confirmingPayment.amount}
          onClose={() => setConfirmingPayment(null)}
        />
      )}

      {/* Record payment modal */}
      {showRecordModal && (
        <RecordPaymentModal
          members={members}
          onClose={() => setShowRecordModal(false)}
        />
      )}
    </AdminPageTransition>
  );
}
