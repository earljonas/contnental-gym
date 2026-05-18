"use client";

import { useState, useTransition } from "react";
import { Edit3, Power, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { saveMembershipPlan, setMembershipPlanActive } from "@/app/(admin)/admin/membership-plans/actions";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPageTransition } from "@/components/admin/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type MembershipPlanRow = {
  id: number;
  name: string;
  price: number;
  duration: number;
  features: string[];
  isActive: boolean;
};

type EditState = {
  id?: number;
  name: string;
  price: string;
  duration: string;
  features: string;
} | null;

function planToEditState(plan?: MembershipPlanRow): EditState {
  return {
    id: plan?.id,
    name: plan?.name ?? "",
    price: plan ? String(plan.price) : "",
    duration: plan ? String(plan.duration) : "30",
    features: plan?.features.join("\n") ?? "",
  };
}

export function MembershipPlansPage({ plans }: { plans: MembershipPlanRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingPlan, setEditingPlan] = useState<EditState>(null);
  const [error, setError] = useState("");

  function closeEditor() {
    if (isPending) return;
    setEditingPlan(null);
    setError("");
  }

  function savePlan() {
    if (!editingPlan) return;

    startTransition(async () => {
      setError("");
      const result = await saveMembershipPlan({
        id: editingPlan.id,
        name: editingPlan.name,
        price: Number(editingPlan.price),
        duration: Number(editingPlan.duration),
        features: editingPlan.features.split(/\r?\n|,/),
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setEditingPlan(null);
      router.refresh();
    });
  }

  function togglePlan(plan: MembershipPlanRow) {
    startTransition(async () => {
      setError("");
      const result = await setMembershipPlanActive(plan.id, !plan.isActive);
      if (result.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <AdminPageTransition>
      <div className="space-y-8">
        <AdminPageHeader
          title="Membership Plans"
          actionLabel="Create Plan"
          onAction={() => setEditingPlan(planToEditState())}
        />

        {error ? (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
            {error}
          </p>
        ) : null}

        <Card className="rounded-3xl">
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border p-6">
            <CardTitle>Plans</CardTitle>
            <Badge variant="secondary">{plans.length} total</Badge>
          </CardHeader>
          <CardContent className="p-6">
            {plans.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center md:p-12">
                <p className="text-sm font-semibold text-foreground">No membership plans yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Create a simple plan to use during registration.</p>
              </div>
            ) : (
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="text-[15px] font-semibold">{plan.name}</TableCell>
                      <TableCell className="text-[15px]">PHP {plan.price.toLocaleString()}</TableCell>
                      <TableCell className="text-[15px] text-muted-foreground">{plan.duration} days</TableCell>
                      <TableCell className="max-w-xs truncate text-[15px] text-muted-foreground">
                        {plan.features.length ? plan.features.join(", ") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={plan.isActive ? "badge-active" : "badge-expired"}>
                          {plan.isActive ? "Active" : "Archived"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            className="rounded-xl"
                            onClick={() => setEditingPlan(planToEditState(plan))}
                            aria-label={`Edit ${plan.name}`}
                          >
                            <Edit3 className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            className="rounded-xl"
                            onClick={() => togglePlan(plan)}
                            disabled={isPending}
                            aria-label={plan.isActive ? `Archive ${plan.name}` : `Activate ${plan.name}`}
                          >
                            <Power className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {editingPlan ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={closeEditor}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-editor-title"
            className="w-full max-w-lg rounded-3xl border border-border bg-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border p-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {editingPlan.id ? "Edit Plan" : "Create Plan"}
                </p>
                <h2 id="plan-editor-title" className="mt-2 font-display text-3xl font-black uppercase tracking-tight">
                  {editingPlan.name || "Membership Plan"}
                </h2>
              </div>
              <Button type="button" variant="outline" size="icon-sm" className="rounded-xl" onClick={closeEditor}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="space-y-5 p-6">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Name</Label>
                <Input
                  id="plan-name"
                  value={editingPlan.name}
                  onChange={(event) => setEditingPlan({ ...editingPlan, name: event.target.value })}
                  className="h-10 rounded-xl focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                  disabled={isPending}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="plan-price">Price</Label>
                  <Input
                    id="plan-price"
                    type="number"
                    min="0"
                    value={editingPlan.price}
                    onChange={(event) => setEditingPlan({ ...editingPlan, price: event.target.value })}
                    className="h-10 rounded-xl focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-duration">Duration days</Label>
                  <Input
                    id="plan-duration"
                    type="number"
                    min="1"
                    value={editingPlan.duration}
                    onChange={(event) => setEditingPlan({ ...editingPlan, duration: event.target.value })}
                    className="h-10 rounded-xl focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-features">Features</Label>
                <Textarea
                  id="plan-features"
                  value={editingPlan.features}
                  onChange={(event) => setEditingPlan({ ...editingPlan, features: event.target.value })}
                  className="min-h-28 rounded-2xl focus:border-[#C9973E] focus:ring-[#C9973E]/20"
                  disabled={isPending}
                />
              </div>
              <div className="flex justify-end gap-3 border-t border-border pt-5">
                <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={closeEditor} disabled={isPending}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="h-10 rounded-xl bg-[#C9973E] px-5 font-bold uppercase tracking-wider text-black"
                  onClick={savePlan}
                  disabled={isPending}
                >
                  {isPending ? "Saving..." : "Save Plan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AdminPageTransition>
  );
}
