"use client";

import { useState, useTransition } from "react";
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
};

export function RecordPaymentButton({ members }: { members: MemberOption[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "GCASH">("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");

  function resetForm() {
    setUserId("");
    setAmount("");
    setMethod("CASH");
    setReferenceNumber("");
    setError("");
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
    const numAmount = Number.parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    startTransition(async () => {
      setError("");
      const result = await recordPayment({
        userId,
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
            className="w-full max-w-lg overflow-hidden rounded-[32px] border border-border bg-card shadow-2xl"
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
              <div className="space-y-2.5">
                <Label htmlFor="payment-member" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Member
                </Label>
                <Select
                  id="payment-member"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="h-12 rounded-2xl bg-secondary/20"
                  disabled={isPending}
                >
                  <option value="">Select member</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
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
                  className="h-12 rounded-2xl bg-secondary/20"
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
                  className="h-12 rounded-2xl bg-secondary/20"
                  disabled={isPending}
                >
                  <option value="CASH">Cash</option>
                  <option value="GCASH">GCash</option>
                </Select>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="payment-ref" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Reference Number <span className="text-muted-foreground/50">(optional)</span>
                </Label>
                <Input
                  id="payment-ref"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. GCash ref #"
                  className="h-12 rounded-2xl bg-secondary/20"
                  disabled={isPending}
                />
              </div>

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
                  className="h-12 rounded-2xl px-8 text-xs font-bold uppercase tracking-[0.16em]"
                  onClick={handleSubmit}
                  disabled={isPending}
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
