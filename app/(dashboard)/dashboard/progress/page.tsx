import { createClient } from "@/lib/supabase/server";
import { ProgressPage } from "@/components/member/progress-page";

export default async function ProgressRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Workout sessions for charts + PRs
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, routine_name, started_at, ended_at, total_volume, exercises, created_at")
    .eq("user_id", user!.id)
    .order("started_at", { ascending: true });

  // Body metrics
  const { data: metrics } = await supabase
    .from("body_metrics")
    .select("*")
    .eq("user_id", user!.id)
    .order("logged_at", { ascending: true });

  // Attendance for achievements
  const { data: attendance } = await supabase
    .from("attendance")
    .select("id, check_in_time")
    .eq("user_id", user!.id)
    .order("check_in_time", { ascending: false });

  const personalRecordsByExercise = new Map<
    string,
    {
      name: string;
      weight: number;
      reps: number;
      date: string;
      history: { weight: number; reps: number; date: string }[];
    }
  >();

  for (const session of sessions ?? []) {
    const exercises = Array.isArray(session.exercises) ? session.exercises : [];
    for (const exercise of exercises as { name: string; sets?: { weight: number; reps: number }[] }[]) {
      for (const set of exercise.sets ?? []) {
        const current = personalRecordsByExercise.get(exercise.name);
        const setVolume = set.weight * set.reps;
        const currentVolume = current ? current.weight * current.reps : -1;
        const next = current ?? {
          name: exercise.name,
          weight: set.weight,
          reps: set.reps,
          date: session.started_at,
          history: [] as { weight: number; reps: number; date: string }[],
        };

        next.history.push({
          weight: set.weight,
          reps: set.reps,
          date: session.started_at,
        });

        if (setVolume > currentVolume) {
          next.weight = set.weight;
          next.reps = set.reps;
          next.date = session.started_at;
        }

        personalRecordsByExercise.set(exercise.name, next);
      }
    }
  }

  const personalRecords = [...personalRecordsByExercise.values()].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <ProgressPage
      sessions={sessions ?? []}
      bodyMetrics={metrics ?? []}
      totalAttendance={attendance?.length ?? 0}
      initialPersonalRecords={personalRecords}
    />
  );
}
