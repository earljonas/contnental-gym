"use client";

import { useState } from "react";
import { SendHorizonal } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPageTransition } from "@/components/admin/page-transition";
import { ResourceTable } from "@/components/admin/resource-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const BRANCHES = ["Ecoland", "Torres", "Lanang"] as const;
type Branch = (typeof BRANCHES)[number];

const MOCK_ANNOUNCEMENTS = [
  {
    title: "Holiday schedule advisory",
    audience: "All branches",
    status: "Sent",
    publishAt: "Apr 15, 2026",
  },
  {
    title: "Equipment maintenance notice",
    audience: "Torres, Lanang",
    status: "Scheduled",
    publishAt: "Apr 22, 2026",
  },
  {
    title: "New recovery area opening",
    audience: "Ecoland",
    status: "Draft",
    publishAt: "TBD",
  },
];

function BranchSelector({
  selected,
  onChange,
}: {
  selected: Set<Branch>;
  onChange: (updated: Set<Branch>) => void;
}) {
  const allSelected = selected.size === BRANCHES.length;

  function toggleAll() {
    if (allSelected) {
      onChange(new Set());
    } else {
      onChange(new Set(BRANCHES));
    }
  }

  function toggleBranch(branch: Branch) {
    const next = new Set(selected);
    if (next.has(branch)) {
      next.delete(branch);
    } else {
      next.add(branch);
    }
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <Label>Audience</Label>
      <div className="flex flex-wrap gap-2">
        {/* All Branches toggle */}
        <button
          type="button"
          onClick={toggleAll}
          className={cn(
            "h-9 rounded-xl border px-3 text-xs font-semibold uppercase tracking-[0.14em] transition-colors",
            allSelected
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground"
          )}
        >
          All branches
        </button>

        {BRANCHES.map((branch) => {
          const active = selected.has(branch);
          return (
            <button
              key={branch}
              type="button"
              onClick={() => toggleBranch(branch)}
              className={cn(
                "h-9 rounded-xl border px-3 text-xs font-semibold uppercase tracking-[0.14em] transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              )}
            >
              {branch}
            </button>
          );
        })}
      </div>

      {selected.size === 0 && (
        <p className="text-[11px] text-muted-foreground">
          Select at least one branch.
        </p>
      )}
      {selected.size > 0 && !allSelected && (
        <p className="text-[11px] text-muted-foreground">
          Targeting:{" "}
          <span className="text-foreground">
            {[...selected].join(", ")}
          </span>
        </p>
      )}
    </div>
  );
}

export default function AnnouncementsPage() {
  const [selectedBranches, setSelectedBranches] = useState<Set<Branch>>(
    new Set(BRANCHES)
  );

  return (
    <AdminPageTransition>
      <div className="space-y-8">
        <AdminPageHeader title="Announcements" />

        <div className="grid gap-6 lg:grid-cols-[1fr_1.7fr]">
          <Card>
            <CardHeader>
              <CardTitle>Compose</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="announcement-title">Title</Label>
                <Input
                  id="announcement-title"
                  placeholder="Title"
                  className="h-11 rounded-2xl"
                />
              </div>

              <BranchSelector
                selected={selectedBranches}
                onChange={setSelectedBranches}
              />

              <div className="space-y-2">
                <Label htmlFor="announcement-message">Message</Label>
                <Textarea
                  id="announcement-message"
                  placeholder="Message"
                  className="min-h-40 rounded-2xl"
                />
              </div>

              {/* TODO: Wire to server action — broadcast for Send, persist draft for Save */}
              <div className="flex flex-wrap gap-3">
                <Button
                  disabled
                  title="Not yet implemented"
                  className="h-11 rounded-2xl px-5 text-xs font-semibold uppercase tracking-[0.16em]"
                >
                  <SendHorizonal className="size-4" />
                  Send update
                </Button>
                <Button
                  disabled
                  title="Not yet implemented"
                  variant="outline"
                  className="h-11 rounded-2xl px-5 text-xs font-semibold uppercase tracking-[0.16em]"
                >
                  Save draft
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Queue</CardTitle>
              <Badge variant="secondary">Portal only</Badge>
            </CardHeader>
            <CardContent>
              <ResourceTable
                columns={[
                  { header: "Title", key: "title" },
                  { header: "Audience", key: "audience" },
                  { header: "Status", key: "status" },
                  { header: "Publish At", key: "publishAt" },
                ]}
                rows={MOCK_ANNOUNCEMENTS}
                searchPlaceholder="Search title"
                searchKeys={["title", "audience"]}
                filters={[
                  {
                    key: "status",
                    label: "Status",
                    options: ["Scheduled", "Sent", "Draft"],
                  },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPageTransition>
  );
}
