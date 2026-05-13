"use client";

import { useState, useTransition } from "react";
import { SendHorizonal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPageTransition } from "@/components/admin/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AnnouncementBranchOption, AnnouncementItem } from "@/lib/announcements";
import { cn } from "@/lib/utils";
import { deleteAnnouncement, sendAnnouncement } from "@/app/(admin)/admin/announcements/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function SuperAnnouncementsPage({
  announcements,
  branches,
}: {
  announcements: AnnouncementItem[];
  branches: AnnouncementBranchOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [allBranches, setAllBranches] = useState(true);
  const [branchIds, setBranchIds] = useState<number[]>([]);
  const [publishAt, setPublishAt] = useState("");
  const [error, setError] = useState("");

  function audienceButtonClass(selected: boolean) {
    return cn(
      "h-9 rounded-xl px-3 text-[11px] font-bold uppercase tracking-[0.16em]",
      selected && "border-primary bg-primary text-primary-foreground shadow-sm"
    );
  }

  function resetForm() {
    setTitle("");
    setBody("");
    setAllBranches(true);
    setBranchIds([]);
    setPublishAt("");
    setError("");
  }

  function handleSubmit() {
    startTransition(async () => {
      setError("");
      const result = await sendAnnouncement({
        title,
        body,
        allBranches,
        branchIds,
        publishAt: publishAt || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      resetForm();
      router.refresh();
    });
  }

  function toggleBranch(branchId: number) {
    const nextBranchIds = branchIds.includes(branchId)
      ? branchIds.filter((id) => id !== branchId)
      : [...branchIds, branchId];

    setBranchIds(nextBranchIds);
    setAllBranches(nextBranchIds.length === 0);
  }

  function handleDelete(announcementId: number) {
    startTransition(async () => {
      setError("");
      const result = await deleteAnnouncement(announcementId);
      if (result.error) {
        setError(result.error);
        return;
      }
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

              <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-3">
                <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Audience
                </Label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={allBranches ? "default" : "outline"}
                    className={audienceButtonClass(allBranches)}
                    aria-pressed={allBranches}
                    onClick={() => {
                      setAllBranches(true);
                      setBranchIds([]);
                    }}
                    disabled={isPending}
                  >
                    All Branches
                  </Button>
                  {branches.map((branch) => {
                    const selected = !allBranches && branchIds.includes(branch.id);
                    return (
                      <Button
                        key={branch.id}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        className={audienceButtonClass(selected)}
                        aria-pressed={selected}
                        onClick={() => toggleBranch(branch.id)}
                        disabled={isPending}
                      >
                        {branch.name}
                      </Button>
                    );
                  })}
                </div>
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="announcement-publish-at">Publish at</Label>
                <Input
                  id="announcement-publish-at"
                  type="datetime-local"
                  value={publishAt}
                  onChange={(event) => setPublishAt(event.target.value)}
                  className="h-11 rounded-2xl"
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to publish immediately.
                </p>
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
              <CardTitle>Announcement History</CardTitle>
              <Badge variant="secondary">Live</Badge>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center md:p-12">
                  <p className="text-sm font-semibold text-foreground">No announcements yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Published and scheduled updates will appear here.</p>
                </div>
              ) : (
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Title</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Publish At</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {announcements.map((announcement) => (
                      <TableRow key={announcement.id}>
                        <TableCell className="text-[15px] font-semibold">{announcement.title}</TableCell>
                        <TableCell className="text-[15px] text-muted-foreground">{announcement.audience}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              announcement.status === "Sent"
                                ? "badge-active"
                                : announcement.status === "Scheduled"
                                  ? "badge-pending"
                                  : ""
                            }
                          >
                            {announcement.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[15px] text-muted-foreground">{announcement.publishAt}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            className="rounded-xl text-red-500 hover:text-red-500"
                            onClick={() => handleDelete(announcement.id)}
                            disabled={isPending}
                            aria-label={`Delete ${announcement.title}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPageTransition>
  );
}
