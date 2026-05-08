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
import type { AnnouncementItem } from "@/lib/announcements";
import { sendAnnouncement } from "@/app/(admin)/admin/announcements/actions";

export function SuperAnnouncementsPage({
  announcements,
}: {
  announcements: AnnouncementItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  function resetForm() {
    setTitle("");
    setBody("");
    setError("");
  }

  function handleSubmit() {
    startTransition(async () => {
      setError("");
      const result = await sendAnnouncement({
        title,
        body,
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

              <div className="rounded-2xl border border-border bg-secondary/30 px-4 py-3">
                <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Audience
                </Label>
                <p className="mt-1 text-sm font-semibold text-foreground">Everyone</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sent to all members and branch admins.
                </p>
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
