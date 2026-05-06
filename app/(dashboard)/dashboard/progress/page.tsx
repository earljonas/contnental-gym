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

  return (
    <ProgressPage
      sessions={sessions ?? []}
      bodyMetrics={metrics ?? []}
      totalAttendance={attendance?.length ?? 0}
    />
  );
}
