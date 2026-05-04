import { createClient } from "@/lib/supabase/server";
import { ActiveSession } from "@/components/member/active-session";

export default async function SessionPage({
  searchParams,
}: {
  searchParams: Promise<{ routineId?: string; exerciseId?: string; exerciseName?: string; muscle?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let routineName: string | null = null;
  let routineId: number | null = null;
  let exercises: {
    exercise_id: string;
    exercise_name: string;
    target_muscle: string;
    default_sets: number;
    default_reps: number;
    default_weight: number;
  }[] = [];

  if (params.routineId) {
    routineId = parseInt(params.routineId);
    const { data: routine } = await supabase
      .from("routines")
      .select(
        "name, routine_exercises(exercise_id, exercise_name, target_muscle, default_sets, default_reps, default_weight, sort_order)",
      )
      .eq("id", routineId)
      .eq("user_id", user!.id)
      .single();

    if (routine) {
      routineName = routine.name;
      exercises = (routine.routine_exercises ?? [])
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((e: { exercise_id: string; exercise_name: string; target_muscle: string; default_sets: number; default_reps: number; default_weight: number }) => ({
          exercise_id: e.exercise_id,
          exercise_name: e.exercise_name,
          target_muscle: e.target_muscle ?? "",
          default_sets: e.default_sets,
          default_reps: e.default_reps,
          default_weight: e.default_weight,
        }));
    }
  } else if (params.exerciseId && params.exerciseName) {
    exercises = [
      {
        exercise_id: params.exerciseId,
        exercise_name: params.exerciseName,
        target_muscle: params.muscle ?? "",
        default_sets: 3,
        default_reps: 10,
        default_weight: 0,
      },
    ];
  }

  return (
    <ActiveSession
      routineId={routineId}
      routineName={routineName}
      initialExercises={exercises}
    />
  );
}
