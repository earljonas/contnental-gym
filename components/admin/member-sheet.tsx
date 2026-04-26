"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleMemberStatus } from "@/app/(admin)/admin/members/actions";

export function MemberSheet({ details }: { details: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.push("/admin/members"); // Close by wiping URL param
    }
  };

  const handleToggle = () => {
    startTransition(async () => {
      // Find current status from memberships array
      const currentStatus = details.memberships[0]?.status || "CANCELLED";
      await toggleMemberStatus(details.profile.id, currentStatus);
    });
  };

  if (!details || !details.profile) return null;

  const currentStatus = details.memberships[0]?.status === "ACTIVE" ? "Active" : "Suspended";

  return (
    <Sheet open={true} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto bg-background/95 backdrop-blur-xl border-border">
        <SheetHeader className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-2xl font-bold uppercase tracking-tight">
                {details.profile.first_name} {details.profile.last_name}
              </SheetTitle>
              <SheetDescription className="text-muted-foreground mt-1 text-sm">
                {details.profile.email} &mdash; {details.profile.role}
              </SheetDescription>
            </div>
            <Badge variant={currentStatus === "Active" ? "secondary" : "danger"}>
              {currentStatus}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Status Toggle Action */}
          <div className="rounded-xl border border-border bg-secondary/30 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold capitalize tracking-wide">Account Status</p>
              <p className="text-xs text-muted-foreground">Suspend or reactivate this member.</p>
            </div>
            <Button
              variant={currentStatus === "Active" ? "destructive" : "default"}
              size="sm"
              disabled={isPending}
              onClick={handleToggle}
              className="text-xs font-semibold uppercase tracking-widest"
            >
              {isPending ? "Syncing..." : currentStatus === "Active" ? "Suspend" : "Activate"}
            </Button>
          </div>

          {/* Memberships */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 border-b border-border pb-2">Membership History</h4>
            <div className="space-y-2">
              {details.memberships.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{m.membership_plans?.name || 'Unknown Plan'}</span>
                    <p className="text-xs text-muted-foreground">Term: {new Date(m.created_at).toLocaleDateString()} - {m.end_date ? new Date(m.end_date).toLocaleDateString() : 'Active'}</p>
                  </div>
                  <Badge variant="outline">{m.status}</Badge>
                </div>
              ))}
              {details.memberships.length === 0 && <p className="text-sm text-muted-foreground">No records found.</p>}
            </div>
          </div>

          {/* Payments */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 border-b border-border pb-2">Recent Payments</h4>
            <div className="space-y-2">
              {details.payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                  <div>
                    <span className="text-sm font-semibold text-foreground">PHP {p.amount}</span>
                    <p className="text-xs text-muted-foreground">via {p.payment_method} &bull; {new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={p.status === "CONFIRMED" ? "secondary" : "outline"}>{p.status}</Badge>
                </div>
              ))}
              {details.payments.length === 0 && <p className="text-sm text-muted-foreground">No records found.</p>}
            </div>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}
