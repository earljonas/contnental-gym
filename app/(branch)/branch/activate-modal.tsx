"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { addGymDays, gymDate } from "@/lib/gym/business-date";
import { formatPlanPrice } from "@/lib/gym/plans";
import type { PendingMember } from "@/lib/branch-admin/data";
import { activateMember } from "./actions";

export function ActivateModal({ member, branchName, onClose, onComplete, restoreFocus }: {
  member: PendingMember;
  branchName: string;
  onClose: () => void;
  onComplete: (receiptId: number) => void;
  restoreFocus: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [method, setMethod] = useState<"CASH" | "GCASH">("CASH");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const start = gymDate();
  const end = member.planDuration > 0 ? addGymDays(start, member.planDuration - 1) : "—";

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      setError("");
      try {
        const result = await activateMember({ memberId: member.id, membershipId: member.membershipId,
          paymentMethod: method, referenceNumber: method === "GCASH" ? reference : undefined });
        if (result.success) onComplete(result.receiptId);
        else setError(result.error);
      } catch {
        setError("Could not confirm the receipt. Retry before collecting again.");
      }
    });
  }

  return (
    <Sheet open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <SheetContent showCloseButton={false} className="w-full overflow-y-auto sm:max-w-lg"
        onCloseAutoFocus={(event) => { event.preventDefault(); restoreFocus(); }}>
        <SheetHeader className="border-b px-5 py-5 sm:px-6">
          <SheetTitle className="text-xl font-semibold">Activate membership</SheetTitle>
          <SheetDescription>Review the plan and record the payment collected at the desk.</SheetDescription>
        </SheetHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="space-y-4 px-5 sm:px-6">
            <dl className="space-y-3 rounded-xl border bg-muted/30 p-4">
              <div><dt className="text-xs text-muted-foreground">Member</dt><dd className="break-words font-medium">{member.name}</dd><dd className="break-all text-xs">{member.email}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Plan</dt><dd>{member.plan}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Access dates in Davao</dt><dd className="tabular-nums">{start} through {end}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Collection branch</dt><dd>{branchName}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Amount due</dt><dd className="text-xl font-semibold tabular-nums">{formatPlanPrice(member.planPrice)}</dd></div>
            </dl>
            <Label htmlFor="activate-method">Payment method</Label>
            <Select autoFocus id="activate-method" value={method} className="h-11" disabled={pending}
              onChange={(event) => setMethod(event.target.value as "CASH" | "GCASH")}>
              <option value="CASH">Cash</option><option value="GCASH">GCash</option>
            </Select>
            {method === "GCASH" && <div className="space-y-2">
              <Label htmlFor="activate-ref">GCash reference</Label>
              <Input id="activate-ref" className="h-11" required maxLength={80} disabled={pending} value={reference}
                onChange={(event) => setReference(event.target.value)} />
            </div>}
            {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          </div>
          <SheetFooter className="sticky bottom-0 grid gap-2 border-t bg-popover sm:grid-cols-[1fr_2fr]">
            <Button type="button" variant="outline" onClick={onClose} disabled={pending} className="min-h-11">Cancel</Button>
            <Button type="submit" disabled={pending || member.planDuration < 1 || (method === "GCASH" && !reference.trim())} className="min-h-11">
              {pending ? "Recording payment…" : "Record payment and activate"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
