import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MemberHome } from "@/components/member/member-home";
import { addGymDays, gymDate, gymDayStart, gymTimeZone } from "@/lib/gym/business-date";
import { effectiveMembershipStatus, pickCurrentMembership } from "@/lib/member-membership";
import { coachEnabledFor } from "@/lib/coach/config";
import { getMemberAnnouncements } from "@/lib/announcements";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  type MembershipWithPlan = {
    status: string;
    start_date: string | null;
    end_date: string | null;
    created_at: string | null;
    plan_id: number;
    membership_plans: { name: string; price: number } | null;
  };

  // Latest membership
  const { data: membershipData } = await supabase
    .from("memberships")
    .select("status, start_date, end_date, created_at, plan_id, membership_plans(name, price)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const membership = pickCurrentMembership((membershipData ?? []) as unknown as MembershipWithPlan[]);

  const today = gymDate();
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  const weekStart = addGymDays(today, weekday === 0 ? -6 : 1 - weekday);
  const { data: weekWorkouts } = await supabase
    .from("workout_sessions")
    .select("started_at")
    .eq("user_id", user.id)
    .gte("started_at", gymDayStart(weekStart))
    .lt("started_at", gymDayStart(addGymDays(weekStart, 7)));

  // Streak calculation
  const { data: recentAttendance } = await supabase
    .from("attendance")
    .select("check_in_time")
    .eq("user_id", user.id)
    .order("check_in_time", { ascending: false })
    .limit(90);

  const attendanceDates = new Set((recentAttendance ?? []).map((visit) => gymDate(new Date(visit.check_in_time))));
  let streak = 0;
  let cursor = attendanceDates.has(today) ? today : addGymDays(today, -1);
  while (attendanceDates.has(cursor)) {
    streak++;
    cursor = addGymDays(cursor, -1);
  }

  const workoutDates = new Set((weekWorkouts ?? []).map((session) => gymDate(new Date(session.started_at))));
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = addGymDays(weekStart, index);
    const dayLabel = new Date(gymDayStart(date)).toLocaleDateString("en-PH", { weekday: "short", timeZone: gymTimeZone });
    return { date, dayLabel, hasWorkout: workoutDates.has(date) };
  });
  const sessionsThisWeek = weekWorkouts?.length ?? 0;
  const announcements = await getMemberAnnouncements(user.id);

  const todayRoutineLabel = new Date().toLocaleDateString("en-US", { weekday: "short", timeZone: gymTimeZone });
  const { data: routinesRaw } = await supabase
    .from("routines")
    .select("id, name, days, routine_exercises(id)")
    .eq("user_id", user.id)
    .contains("days", [todayRoutineLabel])
    .order("created_at", { ascending: false });

  const todaysRoutines = (routinesRaw ?? []).map((routine) => ({
    id: routine.id,
    name: routine.name,
    days: Array.isArray(routine.days) ? routine.days : [],
    exerciseCount: Array.isArray(routine.routine_exercises)
      ? routine.routine_exercises.length
      : 0,
  }));

  // Recent completed workouts
  const { data: recentSessionsRaw } = await supabase
    .from("workout_sessions")
    .select("started_at, ended_at, routine_name, total_volume, exercises")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(10);

  const recentSessions = (recentSessionsRaw ?? []).map((s) => {
    const start = new Date(s.started_at);
    const end = new Date(s.ended_at);
    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
    const exercises = Array.isArray(s.exercises) ? s.exercises : [];
    return {
      date: start.toLocaleDateString("en-US", {
        timeZone: gymTimeZone, weekday: "short",
        month: "short",
        day: "numeric",
      }),
      routineName: s.routine_name as string | null,
      totalVolume: Math.round(s.total_volume ?? 0),
      durationMin,
      exercises: exercises.map((ex: { name: string; sets: { weight: number; reps: number }[] }) => ({
        name: ex.name,
        sets: (ex.sets ?? []).map((set: { weight: number; reps: number }) => ({
          weight: set.weight,
          reps: set.reps,
        })),
      })),
    };
  });

  const plan = membership?.membership_plans;

  const daysLeft = membership?.end_date
    ? Math.round((Date.parse(gymDayStart(membership.end_date)) - Date.parse(gymDayStart(today))) / 86_400_000)
    : null;

  return (
    <MemberHome
      firstName={profile?.first_name ?? "Member"}
      membershipStatus={effectiveMembershipStatus(membership)}
      planName={plan?.name ?? null}
      daysLeft={daysLeft}
      sessionsThisWeek={sessionsThisWeek}
      weeklyGoal={5}
      weekDays={weekDays}
      streak={streak}
      announcements={announcements.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        body: announcement.body,
        publishAt: announcement.publishAt,
      }))}
      recentSessions={recentSessions}
      coachEnabled={coachEnabledFor(user.id)}
      todaysRoutines={todaysRoutines}
    />
  );
}
