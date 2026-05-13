import { createClient } from "@/lib/supabase/server";
import { MemberHome } from "@/components/member/member-home";
import { pickCurrentMembership } from "@/lib/member-membership";
import { getMemberAnnouncements } from "@/lib/announcements";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user!.id)
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
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const membership = pickCurrentMembership((membershipData ?? []) as unknown as MembershipWithPlan[]);

  // This week's attendance (Mon–Sun)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const { data: weekAttendance } = await supabase
    .from("attendance")
    .select("id, check_in_time")
    .eq("user_id", user!.id)
    .gte("check_in_time", weekStart.toISOString())
    .lte("check_in_time", weekEnd.toISOString())
    .order("check_in_time", { ascending: true });

  // Streak calculation
  const { data: recentAttendance } = await supabase
    .from("attendance")
    .select("check_in_time")
    .eq("user_id", user!.id)
    .order("check_in_time", { ascending: false })
    .limit(90);

  const attendanceDates = new Set(
    (recentAttendance ?? []).map((a) =>
      new Date(a.check_in_time).toISOString().split("T")[0]
    )
  );

  let streak = 0;
  const cursor = new Date();
  const todayStr = cursor.toISOString().split("T")[0];
  if (!attendanceDates.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  for (let i = 0; i < 90; i++) {
    const dateStr = cursor.toISOString().split("T")[0];
    if (attendanceDates.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  // Week days array for UI
  const weekDays: { date: string; dayLabel: string; hasWorkout: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
    const hasWorkout = (weekAttendance ?? []).some(
      (a) => new Date(a.check_in_time).toISOString().split("T")[0] === dateStr
    );
    weekDays.push({ date: dateStr, dayLabel, hasWorkout });
  }

  const sessionsThisWeek = weekDays.filter((d) => d.hasWorkout).length;
  const announcements = await getMemberAnnouncements(user!.id);

  const todayRoutineLabel = new Date().toLocaleDateString("en-US", { weekday: "short" });
  const { data: routinesRaw } = await supabase
    .from("routines")
    .select("id, name, days, routine_exercises(id)")
    .eq("user_id", user!.id)
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

  // Sessions for AI Coach context
  const { data: recentSessionsRaw } = await supabase
    .from("sessions")
    .select("started_at, ended_at, routine_name, total_volume, exercises")
    .eq("user_id", user!.id)
    .order("started_at", { ascending: false })
    .limit(10);

  const recentSessions = (recentSessionsRaw ?? []).map((s) => {
    const start = new Date(s.started_at);
    const end = new Date(s.ended_at);
    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
    const exercises = Array.isArray(s.exercises) ? s.exercises : [];
    return {
      date: start.toLocaleDateString("en-US", {
        weekday: "short",
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

  let daysLeft: number | null = null;
  if (membership?.end_date) {
    const end = new Date(membership.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <MemberHome
      firstName={profile?.first_name ?? "Member"}
      membershipStatus={membership?.status ?? null}
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
      todaysRoutines={todaysRoutines}
    />
  );
}
