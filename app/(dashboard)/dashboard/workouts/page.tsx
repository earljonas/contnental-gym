import { createClient } from "@/lib/supabase/server";
import { WorkoutsHub } from "@/components/member/workouts-hub";

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch routines with exercises
  const { data: routines } = await supabase
    .from("routines")
    .select(
      "id, name, days, created_at, routine_exercises(id, exercise_id, exercise_name, target_muscle, default_sets, default_reps, default_weight, sort_order)",
    )
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  // Fetch session history
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", user!.id)
    .order("started_at", { ascending: false })
    .limit(50);

  return (
    <WorkoutsHub
      routines={routines ?? []}
      sessions={sessions ?? []}
    />
  );
}
