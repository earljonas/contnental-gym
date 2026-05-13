"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Flame,
  Play,
  QrCode,
  Sparkles,
  ClipboardList,
  ChevronRight,
  ChevronDown,
  Dumbbell,
  CalendarCheck,
  Megaphone,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CoachChat } from "@/components/member/coach-chat";

interface WeekDay {
  date: string;
  dayLabel: string;
  hasWorkout: boolean;
}

interface RecentSession {
  date: string;
  routineName: string | null;
  totalVolume: number;
  durationMin: number;
  exercises: { name: string; sets: { weight: number; reps: number }[] }[];
}

interface ScheduledRoutine {
  id: number;
  name: string;
  days: string[];
  exerciseCount: number;
}

interface MemberHomeProps {
  firstName: string;
  membershipStatus: string | null;
  planName: string | null;
  daysLeft: number | null;
  sessionsThisWeek: number;
  weeklyGoal: number;
  weekDays: WeekDay[];
  streak: number;
  announcements: {
    id: number;
    title: string;
    body: string;
    publishAt: string;
  }[];
  recentSessions: RecentSession[];
  todaysRoutines: ScheduledRoutine[];
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function ActivityRing({
  completed,
  goal,
}: {
  completed: number;
  goal: number;
}) {
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(completed / goal, 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={"0 0 " + size + " " + size}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted-foreground/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C9973E" />
            <stop offset="100%" stopColor="#E8C97A" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-3xl font-black text-foreground">
          {completed}
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          of {goal} sessions
        </span>
      </div>
    </div>
  );
}

export function MemberHome({
  firstName,
  membershipStatus,
  planName,
  daysLeft,
  sessionsThisWeek,
  weeklyGoal,
  weekDays,
  streak,
  announcements,
  recentSessions,
  todaysRoutines,
}: MemberHomeProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [coachOpen, setCoachOpen] = useState(false);
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);

  const selectedDayInfo = weekDays.find((d) => d.date === selectedDay);

  const renderStatusPill = () => {
    if (membershipStatus === "ACTIVE" && daysLeft !== null) {
      const urgent = daysLeft <= 7;
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider",
            urgent
              ? "bg-amber-500/15 text-amber-500"
              : "bg-emerald-500/15 text-emerald-500"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              urgent ? "bg-amber-500" : "bg-emerald-500"
            )}
          />
          {urgent
            ? `Expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
            : `Active · ${daysLeft} days left`}
        </span>
      );
    }
    if (membershipStatus === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-500">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Pending Activation
        </span>
      );
    }
    if (membershipStatus === "EXPIRED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-red-500">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Expired
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        {streak > 0 && (
          <div className="absolute -top-1 right-0 flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1.5">
            <Flame className="size-3.5 text-orange-500" />
            <span className="text-[11px] font-bold text-orange-500">
              {streak} Day Streak
            </span>
          </div>
        )}

        <div>
          <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground md:text-3xl">
            {getGreeting()}, {firstName}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {formatDate()}
          </p>
        </div>

        <div className="mt-3">{renderStatusPill()}</div>
      </div>

      {announcements.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <button
            onClick={() => setAnnouncementsOpen((o) => !o)}
            className="flex w-full items-center justify-between px-5 py-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Megaphone className="size-4 text-[#C9973E]" />
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Announcements
              </span>
              <span className="rounded-full bg-[#C9973E]/10 px-2 py-0.5 text-[10px] font-bold text-[#C9973E]">
                {announcements.length}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform duration-200",
                announcementsOpen && "rotate-180"
              )}
            />
          </button>
          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out",
              announcementsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="overflow-hidden">
              <div className="divide-y divide-border border-t border-border">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-semibold text-foreground">{announcement.title}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {announcement.publishAt}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-muted-foreground">{announcement.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {membershipStatus === "EXPIRED" && (
        <div className="flex items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-red-500">
              Your membership has expired
            </p>
            <p className="mt-0.5 text-[12px] text-red-500/70">
              Visit your branch to renew and get back to training.
            </p>
          </div>
          <Link
            href="/dashboard/profile"
            className="shrink-0 rounded-lg bg-red-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-red-600"
          >
            Renew
          </Link>
        </div>
      )}

      {membershipStatus === "PENDING" && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-amber-600">
              Membership pending activation
            </p>
            <p className="mt-0.5 text-[12px] text-amber-600/70">
              Visit any Continental branch to complete payment.
            </p>
          </div>
          <Link
            href="/dashboard/profile"
            className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-black transition-colors hover:bg-amber-400"
          >
            Details
          </Link>
        </div>
      )}

      {planName && membershipStatus === "ACTIVE" && (
        <Link
          href="/dashboard/profile"
          className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 transition-all hover:bg-muted"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C9973E]/10">
              <CalendarCheck className="size-4 text-[#C9973E]" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground">
                {planName} Plan
              </p>
              <p className="text-[11px] text-muted-foreground">
                {daysLeft !== null
                  ? `${daysLeft} days remaining`
                  : "Active membership"}
              </p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Link href="/dashboard/session" className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-5 transition-all hover:bg-muted active:scale-[0.97]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C9973E]/10">
            <ClipboardList className="size-5 text-[#C9973E]" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
            Log Workout
          </span>
        </Link>

        <Link href="/dashboard/checkin" className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-5 transition-all hover:bg-muted active:scale-[0.97]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C9973E]/10">
            <QrCode className="size-5 text-[#C9973E]" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
            My QR
          </span>
        </Link>

        <button
          onClick={() => setCoachOpen(true)}
          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-5 transition-all hover:bg-muted active:scale-[0.97]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C9973E]/10">
            <Sparkles className="size-5 text-[#C9973E]" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
            AI Coach
          </span>
        </button>
      </div>

      <CoachChat
        open={coachOpen}
        onClose={() => setCoachOpen(false)}
        context={{
          firstName,
          membershipStatus,
          planName,
          daysLeft,
          streak,
          sessionsThisWeek,
          weeklyGoal,
          recentSessions,
        }}
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Today&apos;s Focus
          </span>
        </div>

        <div className="px-5 py-6">
          {todaysRoutines.length > 0 ? (
            <div className="space-y-3">
              {todaysRoutines.map((routine) => (
                <div
                  key={routine.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-display text-lg font-black uppercase tracking-tight text-foreground">
                      {routine.name}
                    </p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {routine.exerciseCount} exercise{routine.exerciseCount !== 1 ? "s" : ""} scheduled today
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/session?routineId=${routine.id}`}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C9973E] px-5 text-[12px] font-semibold uppercase tracking-wider text-black transition-all hover:bg-[#B8882F] active:scale-[0.98]"
                  >
                    <Play className="size-4" />
                    Start
                  </Link>
                </div>
              ))}
            </div>
          ) : (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C9973E]/10">
              <Dumbbell className="size-7 text-[#C9973E]" />
            </div>
            <p className="font-display text-lg font-black uppercase tracking-tight text-foreground">
              No session planned
            </p>
            <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">
              Start a quick workout log or build a routine to see your daily
              plan here.
            </p>
            <div className="mt-5 flex gap-3">
              <Link href="/dashboard/session" className="flex items-center gap-2 rounded-xl bg-[#C9973E] px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-black transition-all hover:bg-[#B8882F] active:scale-[0.98]">
                <Play className="size-4" />
                Start Session
              </Link>
              <Link href="/dashboard/workouts" className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-foreground transition-all hover:bg-muted active:scale-[0.98]">
                <ClipboardList className="size-4" />
                Build Routine
              </Link>
            </div>
          </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Weekly Activity
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              {sessionsThisWeek}/{weeklyGoal} sessions
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center px-5 py-6">
          <ActivityRing completed={sessionsThisWeek} goal={weeklyGoal} />

          <div className="mt-6 flex w-full justify-between">
            {weekDays.map((day) => {
              const now = new Date();
              const localTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
              const isToday = day.date === localTodayStr;
              const isSelected = selectedDay === day.date;

              return (
                <button
                  key={day.date}
                  onClick={() =>
                    setSelectedDay(isSelected ? null : day.date)
                  }
                  className="flex flex-col items-center gap-2"
                >
                  <span
                    className={cn(
                      "text-[10px] font-medium uppercase",
                      isToday
                        ? "text-[#C9973E]"
                        : "text-muted-foreground"
                    )}
                  >
                    {day.dayLabel.charAt(0)}
                  </span>
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                      day.hasWorkout
                        ? "bg-[#C9973E] shadow-md shadow-[#C9973E]/20"
                        : "bg-muted/50",
                      isSelected && "ring-2 ring-[#C9973E] ring-offset-2 ring-offset-card",
                      isToday && !day.hasWorkout && "border border-[#C9973E]/40"
                    )}
                  >
                    {day.hasWorkout ? (
                      <CalendarCheck className="size-3.5 text-black" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedDay && selectedDayInfo && (
            <div className="mt-4 flex w-full items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-3">
                {selectedDayInfo.hasWorkout ? (
                  <CalendarCheck className="size-4 text-[#C9973E]" />
                ) : (
                  <X className="size-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-[13px] font-medium text-foreground">
                    {new Date(selectedDay + "T00:00:00").toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedDayInfo.hasWorkout
                      ? "Workout logged"
                      : "Rest day — no activity"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Recent Sessions
          </span>
        </div>
        <div className="divide-y divide-border">
          {recentSessions.length > 0 ? (
            recentSessions.slice(0, 5).map((session, index) => (
              <div key={`${session.date}-${session.routineName ?? "session"}-${index}`} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-foreground">
                    {session.routineName ?? "Quick Session"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {session.date} · {session.exercises.length} exercises
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[12px] font-semibold text-foreground">
                    {session.totalVolume.toLocaleString()} kg
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {session.durationMin} min
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-[13px] text-muted-foreground">
                No sessions logged yet. Start a workout to build your history.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
