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
import { getSuperAdminOverview } from "@/lib/super-admin/data";

export default async function AnnouncementsPage() {
  const overview = await getSuperAdminOverview();

  return (
    <AdminPageTransition>
      <div className="space-y-8">
        <AdminPageHeader title="Announcements" />

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Compose</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="announcement-title">Title</Label>
                <Input id="announcement-title" placeholder="Title" className="h-11 rounded-2xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="announcement-audience">Audience</Label>
                <Input id="announcement-audience" placeholder="Audience" className="h-11 rounded-2xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="announcement-message">Message</Label>
                <Textarea id="announcement-message" placeholder="Message" className="min-h-40 rounded-2xl" />
              </div>
              {/* TODO: Wire to server action — broadcast for Send, persist draft for Save */}
              <div className="flex flex-wrap gap-3">
                <Button disabled title="Not yet implemented" className="h-11 rounded-2xl px-5 text-xs font-semibold uppercase tracking-[0.16em]">
                  <SendHorizonal className="size-4" />
                  Send update
                </Button>
                <Button disabled title="Not yet implemented" variant="outline" className="h-11 rounded-2xl px-5 text-xs font-semibold uppercase tracking-[0.16em]">
                  Save draft
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Queue</CardTitle>
              <Badge variant="secondary">Portal + email</Badge>
            </CardHeader>
            <CardContent>
              <ResourceTable
                columns={[
                  { header: "Title", key: "title" },
                  { header: "Audience", key: "audience" },
                  { header: "Channel", key: "channel" },
                  { header: "Status", key: "status" },
                  { header: "Publish At", key: "publishAt" },
                ]}
                rows={overview.announcements}
                searchPlaceholder="Search title"
                searchKeys={["title", "audience", "channel"]}
                filters={[
                  { key: "status", label: "Status", options: ["Scheduled", "Sent", "Draft"] },
                  { key: "channel", label: "Channel", options: [...new Set(overview.announcements.map((item) => item.channel))] },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPageTransition>
  );
}
