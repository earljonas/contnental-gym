"use client";

import { useState, useTransition } from "react";
import { SendHorizonal } from "lucide-react";
import { useRouter } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPageTransition } from "@/components/admin/page-transition";
import { ResourceTable } from "@/components/admin/resource-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AnnouncementBranchOption, AnnouncementItem } from "@/lib/announcements";
import { cn } from "@/lib/utils";
import { sendAnnouncement } from "@/app/(admin)/admin/announcements/actions";

function BranchSelector({
  branches,
  selectedIds,
  onChange,
}: {
  branches: AnnouncementBranchOption[];
  selectedIds: Set<number>;
  onChange: (updated: Set<number>) => void;
}) {
  const allSelected = selectedIds.size === branches.length;

  function toggleAll() {
    if (allSelected) {
      onChange(new Set());
      return;
    }

    onChange(new Set(branches.map((branch) => branch.id)));
  }

  function toggleBranch(branchId: number) {
    const next = new Set(selectedIds);
    if (next.has(branchId)) {
      next.delete(branchId);
    } else {
      next.add(branchId);
    }
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <Label>Audience</Label>
      <div className="flex flex-wrap gap-2">
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

        {branches.map((branch) => {
          const active = selectedIds.has(branch.id);
          return (
            <button
              key={branch.id}
              type="button"
              onClick={() => toggleBranch(branch.id)}
              className={cn(
                "h-9 rounded-xl border px-3 text-xs font-semibold uppercase tracking-[0.14em] transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              )}
            >
              {branch.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SuperAnnouncementsPage({
  branches,
  announcements,
}: {
  branches: AnnouncementBranchOption[];
  announcements: AnnouncementItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedBranches, setSelectedBranches] = useState<Set<number>>(
    new Set(branches.map((branch) => branch.id))
  );
  const [error, setError] = useState("");

  function resetForm() {
    setTitle("");
    setBody("");
    setSelectedBranches(new Set(branches.map((branch) => branch.id)));
    setError("");
  }

  function handleSubmit() {
    startTransition(async () => {
      setError("");
      const result = await sendAnnouncement({
        title,
        body,
        branchIds: [...selectedBranches],
        allBranches: selectedBranches.size === branches.length,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      resetForm();
      router.refresh();
    });
  }

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
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Title"
                  className="h-11 rounded-2xl"
                  disabled={isPending}
                />
              </div>

              <BranchSelector
                branches={branches}
                selectedIds={selectedBranches}
                onChange={setSelectedBranches}
              />

              <div className="space-y-2">
                <Label htmlFor="announcement-message">Message</Label>
                <Textarea
                  id="announcement-message"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Message"
                  className="min-h-40 rounded-2xl"
                  disabled={isPending}
                />
              </div>

              {error ? (
                <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="h-11 rounded-2xl px-5 text-xs font-semibold uppercase tracking-[0.16em]"
                >
                  <SendHorizonal className="size-4" />
                  {isPending ? "Sending..." : "Send update"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Queue</CardTitle>
              <Badge variant="secondary">Live</Badge>
            </CardHeader>
            <CardContent>
              <ResourceTable
                columns={[
                  { header: "Title", key: "title" },
                  { header: "Audience", key: "audience" },
                  { header: "Status", key: "status" },
                  { header: "Publish At", key: "publishAt" },
                ]}
                rows={announcements}
                searchPlaceholder="Search title"
                searchKeys={["title", "audience"]}
                filters={[
                  {
                    key: "status",
                    label: "Status",
                    options: ["Sent", "Draft"],
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
