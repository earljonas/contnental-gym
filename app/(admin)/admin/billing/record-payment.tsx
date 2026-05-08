"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { recordPayment } from "./actions";

type MemberOption = {
  id: string;
  name: string;
  planPrice: number;
  planName: string;
  paymentState: "PAYABLE" | "ALREADY_PAID" | "NO_MEMBERSHIP" | "NO_PENDING_MEMBERSHIP";
  note: string;
};

type BranchOption = {
  id: number;
  name: string;
};

export function RecordPaymentButton({
  members,
  branches,
}: {
  members: MemberOption[];
  branches: BranchOption[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "GCASH">("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filteredMembers = search.trim().length > 0
    ? members.filter((member) => member.name.toLowerCase().includes(search.toLowerCase())).slice(0, 10)
    : members.slice(0, 10);
  const selectedMemberCanPay = selectedMember?.paymentState === "PAYABLE";

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function resetForm() {
    setUserId("");
    setSearch("");
    setSelectedMember(null);
    setIsDropdownOpen(false);
    setBranchId("");
    setAmount("");
    setMethod("CASH");
    setReferenceNumber("");
    setError("");
  }

  function handleSelectMember(member: MemberOption) {
    setUserId(member.id);
    setSelectedMember(member);
    setSearch(member.name);
    setIsDropdownOpen(false);
    if (member.planPrice > 0) {
      setAmount(member.planPrice.toString());
    }
    setError(member.paymentState === "PAYABLE" ? "" : member.note);
  }

  function handleClose() {
    if (isPending) return;
    setIsOpen(false);
    resetForm();
  }

  function handleSubmit() {
    if (!userId) {
      setError("Please select a member.");
      return;
    }
    if (!selectedMember || selectedMember.paymentState !== "PAYABLE") {
      setError(selectedMember?.note ?? "Please select a member with a pending unpaid membership.");
      return;
    }
    if (!branchId) {
      setError("Please select the collection branch.");
      return;
    }
    const numAmount = Number.parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    startTransition(async () => {
      setError("");
      const result = await recordPayment({
        userId,
        branchId: Number(branchId),
        amount: numAmount,
        method,
        referenceNumber: referenceNumber.trim() || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setIsOpen(false);
      resetForm();
      router.refresh();
    });
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="h-11 rounded-2xl px-5 text-xs font-semibold uppercase tracking-[0.16em]"
      >
        <Plus className="size-4" />
        Record payment
      </Button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="record-payment-title"
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
                <h2
                  id="record-payment-title"
                  className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-foreground"
                >
                  Record Payment
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="flex size-8 items-center justify-center rounded-full bg-background/50 text-muted-foreground hover:bg-foreground hover:text-background transition-colors"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2.5" ref={dropdownRef}>
                <Label htmlFor="payment-member" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Member
                </Label>
                <div className="relative">
                <Input
                  id="payment-member"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setUserId("");
                    setSelectedMember(null);
                    setAmount("");
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Search member name..."
                  className="h-11 rounded-xl bg-secondary/20 focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                  disabled={isPending}
                />
                {isDropdownOpen && filteredMembers.length > 0 ? (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-border bg-card">
                    {filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        className="w-full px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary/50 first:rounded-t-2xl last:rounded-b-2xl"
                        onClick={() => handleSelectMember(member)}
                      >
                        <span className="block">{member.name}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {member.planName} {member.planPrice > 0 ? `- PHP ${member.planPrice.toLocaleString()}` : ""} · {member.note}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
                {isDropdownOpen && search.trim().length > 0 && filteredMembers.length === 0 ? (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                    No member found for this name.
                  </div>
                ) : null}
                </div>
                {selectedMember && !selectedMemberCanPay ? (
                  <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-500">
                    {selectedMember.note}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="payment-branch" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Collected At
                </Label>
                <Select
                  id="payment-branch"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="h-11 rounded-xl bg-secondary/20 focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                  disabled={isPending}
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="payment-amount" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Amount (PHP)
                </Label>
                <Input
                  id="payment-amount"
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

              <div className="space-y-2.5">
                <Label htmlFor="payment-method" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Method
                </Label>
                <Select
                  id="payment-method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as "CASH" | "GCASH")}
                  className="h-11 rounded-xl bg-secondary/20 focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                  disabled={isPending}
                >
                  <option value="CASH">Cash</option>
                  <option value="GCASH">GCash</option>
                </Select>
              </div>

              {method === "GCASH" ? (
                <div className="space-y-2.5">
                  <Label htmlFor="payment-ref" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Reference Number
                  </Label>
                  <Input
                    id="payment-ref"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. GCash ref #"
                    className="h-11 rounded-xl bg-secondary/20 focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                    disabled={isPending}
                  />
                </div>
              ) : null}

              {error ? (
                <p className="text-sm font-medium text-destructive bg-destructive/10 px-4 py-3 rounded-xl">
                  {error}
                </p>
              ) : null}

              <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 rounded-2xl px-6 text-xs font-bold uppercase tracking-[0.16em] hover:bg-secondary/50"
                  onClick={handleClose}
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
                  {isPending ? "Saving..." : "Confirm payment"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </>
  );
}
