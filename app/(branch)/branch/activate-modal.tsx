"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { activateMember } from "./actions";
import type { PendingMember } from "@/lib/branch-admin/data";

export function ActivateModal({
  member,
  onClose,
}: {
  member: PendingMember;
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
      const result = await activateMember({
        memberId: member.id,
        membershipId: member.membershipId,
        planId: member.planId,
        amount: member.planPrice,
        paymentMethod: method,
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
      aria-labelledby="activate-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg overflow-hidden rounded-[32px] border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/50 bg-secondary/30 px-8 py-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Walkup Activation
            </p>
            <h2
              id="activate-modal-title"
              className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-foreground"
            >
              Activate Member
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
          {/* Member info summary */}
          <div className="rounded-2xl border border-border bg-secondary/20 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{member.name}</span>
              <span className="text-xs text-muted-foreground">{member.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {member.plan}
              </span>
              <span className="text-sm font-bold text-foreground">
                PHP {member.planPrice.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="activate-method" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Payment Method
            </Label>
            <Select
              id="activate-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as "CASH" | "GCASH")}
              className="h-12 rounded-2xl bg-secondary/20"
              disabled={isPending}
            >
              <option value="CASH">Cash</option>
              <option value="GCASH">GCash</option>
            </Select>
          </div>

          {method === "GCASH" ? (
            <div className="space-y-2.5">
              <Label htmlFor="activate-ref" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Reference Number
              </Label>
              <Input
                id="activate-ref"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. 1234567890"
                className="h-12 rounded-2xl bg-secondary/20"
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
              {isPending ? "Activating..." : "Confirm & Activate"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
