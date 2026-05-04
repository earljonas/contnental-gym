"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Megaphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPageTransition } from "@/components/admin/page-transition";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Announcement = {
  id: number;
  title: string;
  body: string;
  audience: string;
  date: string;
  seen: boolean;
};

// Mock data — will be replaced with DB once announcements table exists
const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 1,
    title: "Holiday schedule advisory",
    body: "All branches will operate on reduced hours from Dec 24-26. Morning classes are cancelled. The gym will be open from 10AM to 4PM only. Regular schedule resumes on Dec 27.",
    audience: "All branches",
    date: "Apr 15, 2026",
    seen: true,
  },
  {
    id: 2,
    title: "Equipment maintenance notice",
    body: "The cable machines and smith machine will be under maintenance on April 22-23. Members should use alternative equipment during this period. We apologize for the inconvenience.",
    audience: "Torres, Lanang",
    date: "Apr 22, 2026",
    seen: true,
  },
  {
    id: 3,
    title: "New recovery area opening",
    body: "We're excited to announce that the new recovery and stretching area will be available starting May 1. This includes foam rollers, massage guns, and a dedicated cool-down zone. All members are welcome to use the facility.",
    audience: "Ecoland",
    date: "Apr 28, 2026",
    seen: false,
  },
  {
    id: 4,
    title: "Membership promo — refer a friend",
    body: "For the month of May, members who refer a friend will receive a 15% discount on their next renewal. The referred friend also gets 10% off their first month. Promo runs May 1-31. Terms and conditions apply.",
    audience: "All branches",
    date: "May 1, 2026",
    seen: false,
  },
];

function AnnouncementCard({
  announcement,
  isExpanded,
  onToggle,
}: {
  announcement: Announcement;
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
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary">
              <Megaphone className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2.5">
                <CardTitle className="text-[15px] truncate">
                  {announcement.title}
                </CardTitle>
                {!announcement.seen && (
                  <span className="inline-block size-2 shrink-0 rounded-full bg-sky-500" />
                )}
              </div>
              <CardDescription className="text-xs">
                {announcement.date}
              </CardDescription>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
              {announcement.audience}
            </Badge>
            {announcement.seen ? (
              <Badge variant="secondary" className="text-[10px] badge-active">
                Seen
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] badge-pending">
                New
              </Badge>
            )}
            {isExpanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <CardContent className="border-t border-border/50 px-6 pb-6 pt-5">
              <div className="flex items-center gap-2 mb-3 sm:hidden">
                <Badge variant="outline" className="text-[10px]">
                  {announcement.audience}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {announcement.body}
              </p>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function BranchAnnouncementsPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const unseenCount = ANNOUNCEMENTS.filter((a) => !a.seen).length;

  return (
    <AdminPageTransition>
      <div className="space-y-8">
        <AdminPageHeader title="Announcements" />

        {/* Summary strip */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/30 px-5 py-3">
            <Megaphone className="size-4 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {ANNOUNCEMENTS.length} announcements
            </span>
          </div>
          {unseenCount > 0 && (
            <div className="flex items-center gap-2 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-5 py-3">
              <span className="inline-block size-2 rounded-full bg-sky-500" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-600">
                {unseenCount} new
              </span>
            </div>
          )}
        </div>

        {/* Announcement cards */}
        <div className="space-y-4">
          {ANNOUNCEMENTS.map((announcement) => (
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

        {ANNOUNCEMENTS.length === 0 && (
          <Card className="rounded-[30px]">
            <CardContent className="py-16 text-center">
              <Megaphone className="mx-auto mb-4 size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No announcements yet
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminPageTransition>
  );
}
