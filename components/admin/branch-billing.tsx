"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  DollarSign,
  AlertTriangle,
  Clock,
  Printer,
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
import { recordBranchPayment } from "@/app/(branch)/branch/billing/actions";

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
    ? members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())).slice(0, 10)
    : members.slice(0, 10);
  const selectedMemberCanPay = selectedMember?.paymentState === "PAYABLE";

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
    setError(m.paymentState === "PAYABLE" ? "" : m.note);
  }

  function handleSubmit() {
    if (!selectedMember) {
      setError("Please select a member.");
      return;
    }
    if (selectedMember.paymentState !== "PAYABLE") {
      setError(selectedMember.note);
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
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card"
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
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Search member name..."
                className="h-11 rounded-xl bg-secondary/20 focus:border-[#C9973E] focus:ring-[#C9973E]/20"
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
                      <span className="block">{m.name}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {m.planName} {m.planPrice > 0 ? `- PHP ${m.planPrice.toLocaleString()}` : ""} · {m.note}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {isDropdownOpen && search.trim().length > 0 && filteredMembers.length === 0 && (
                <div className="absolute top-full left-0 right-0 z-20 mt-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-xl">
                  No member found for this name.
                </div>
              )}
            </div>
            {selectedMember && !selectedMemberCanPay ? (
              <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-500">
                {selectedMember.note}
              </p>
            ) : null}
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
              className="h-11 rounded-xl bg-secondary/20 focus:border-[#C9973E] focus:ring-[#C9973E]/20"
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
              className="h-11 rounded-xl bg-secondary/20 focus:border-[#C9973E] focus:ring-[#C9973E]/20"
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
                className="h-11 rounded-xl bg-secondary/20 focus:border-[#C9973E] focus:ring-[#C9973E]/20"
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
              className="h-11 rounded-xl bg-[#C9973E] px-8 text-xs font-bold uppercase tracking-[0.16em] text-black"
              onClick={handleSubmit}
              disabled={isPending || !selectedMemberCanPay}
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function printReceipt(row: BranchBillingData["rows"][number]) {
  const win = window.open("", "_blank", "width=420,height=640");
  if (!win) return;

  win.document.write(`
    <html>
      <head>
        <title>Receipt #${row.id}</title>
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
        <div class="muted">Payment Receipt #${row.id}</div>
        <div class="line"></div>
        <div class="row"><span class="label">Member</span><strong>${escapeHtml(row.member)}</strong></div>
        <div class="row"><span class="label">Plan</span><span>${escapeHtml(row.plan)}</span></div>
        <div class="row"><span class="label">Date</span><span>${escapeHtml(row.date)}</span></div>
        <div class="row"><span class="label">Method</span><span>${escapeHtml(row.method)}</span></div>
        <div class="row"><span class="label">Status</span><span>${escapeHtml(row.status)}</span></div>
        <div class="line"></div>
        <div class="row"><span class="label">Amount paid</span><span class="amount">${escapeHtml(row.amount)}</span></div>
        <script>window.print();</script>
      </body>
    </html>
  `);
  win.document.close();
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
      label: "Collected this month",
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
      label: "Total collected here",
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
                      <TableHead className="text-center">Receipt</TableHead>
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
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            className="rounded-xl"
                            onClick={() => printReceipt(row)}
                            aria-label={`Print receipt for ${row.member}`}
                          >
                            <Printer className="size-4" />
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
      </div>

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
