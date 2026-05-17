"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Megaphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPageTransition } from "@/components/admin/page-transition";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnnouncementItem } from "@/lib/announcements";

function AnnouncementCard({
  announcement,
  isExpanded,
  onToggle,
}: {
  announcement: AnnouncementItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="overflow-hidden rounded-[24px] transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 p-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary">
              <Megaphone className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="truncate text-[15px]">
                {announcement.title}
              </CardTitle>
              <CardDescription className="text-xs">
                {announcement.publishAt}
              </CardDescription>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Badge variant="outline" className="hidden text-[10px] sm:inline-flex">
              {announcement.audience}
            </Badge>
            {isExpanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <CardContent className="border-t border-border/50 px-6 pb-6 pt-5">
              <div className="mb-3 flex items-center gap-2 sm:hidden">
                <Badge variant="outline" className="text-[10px]">
                  {announcement.audience}
                </Badge>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {announcement.body}
              </p>
            </CardContent>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}

export function BranchAnnouncementsFeed({
  announcements,
}: {
  announcements: AnnouncementItem[];
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <AdminPageTransition>
      <div className="space-y-8">
        <AdminPageHeader title="Announcements" />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/30 px-5 py-3">
            <Megaphone className="size-4 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {announcements.length} announcements
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              isExpanded={expandedId === announcement.id}
              onToggle={() =>
                setExpandedId((current) =>
                  current === announcement.id ? null : announcement.id
                )
              }
            />
          ))}
        </div>

        {announcements.length === 0 ? (
          <Card className="rounded-[30px]">
            <CardContent className="p-0">
              <div className="rounded-2xl border border-dashed border-border p-8 text-center md:p-12">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-secondary">
                  <Megaphone className="size-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  No announcements yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Announcements from HQ will appear here when published.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AdminPageTransition>
  );
}
