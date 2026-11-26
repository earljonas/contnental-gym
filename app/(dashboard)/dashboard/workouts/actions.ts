"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type RoutineInput = {
  name: string;
  days: string[];
  exercises: {
    exercise_id: string;
    exercise_name: string;
    target_muscle: string;
    default_sets: number;
    default_reps: number;
    default_weight: number;
  }[];
};

async function saveRoutine(routineId: number | null, input: RoutineInput) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_gym_routine", {
    routine_key: routineId, routine_name: input.name,
    routine_days: input.days, exercise_rows: input.exercises,
  });
  if (error || typeof data !== "number") throw new Error("Could not save the routine. Check the exercise details and try again.");
  revalidatePath("/dashboard/workouts");
  revalidatePath("/dashboard");
  return { id: data };
}

export async function createRoutine(data: RoutineInput) {
  return saveRoutine(null, data);
}

export async function updateRoutine(routineId: number, data: RoutineInput) {
  await saveRoutine(routineId, data);
}

/* ─── Delete Routine ─── */
export async function deleteRoutine(routineId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("routines")
    .delete()
    .eq("id", routineId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/workouts");
}
