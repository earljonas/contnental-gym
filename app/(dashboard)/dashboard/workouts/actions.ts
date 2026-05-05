"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/* ─── Create Routine ─── */
export async function createRoutine(data: {
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
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: routine, error: routineError } = await supabase
    .from("routines")
    .insert({ user_id: user.id, name: data.name, days: data.days })
    .select("id")
    .single();

  if (routineError) throw new Error(routineError.message);

  if (data.exercises.length > 0) {
    const exercises = data.exercises.map((ex, i) => ({
      routine_id: routine.id,
      exercise_id: ex.exercise_id,
      exercise_name: ex.exercise_name,
      target_muscle: ex.target_muscle,
      default_sets: ex.default_sets,
      default_reps: ex.default_reps,
      default_weight: ex.default_weight,
      sort_order: i,
    }));

    const { error: exError } = await supabase
      .from("routine_exercises")
      .insert(exercises);

    if (exError) throw new Error(exError.message);
  }

  revalidatePath("/dashboard/workouts");
  return { id: routine.id };
}

/* ─── Update Routine ─── */
export async function updateRoutine(
  routineId: number,
  data: {
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
  },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error: updateError } = await supabase
    .from("routines")
    .update({ name: data.name, days: data.days, updated_at: new Date().toISOString() })
    .eq("id", routineId)
    .eq("user_id", user.id);

  if (updateError) throw new Error(updateError.message);

  // Delete old exercises and re-insert
  await supabase
    .from("routine_exercises")
    .delete()
    .eq("routine_id", routineId);

  if (data.exercises.length > 0) {
    const exercises = data.exercises.map((ex, i) => ({
      routine_id: routineId,
      exercise_id: ex.exercise_id,
      exercise_name: ex.exercise_name,
      target_muscle: ex.target_muscle,
      default_sets: ex.default_sets,
      default_reps: ex.default_reps,
      default_weight: ex.default_weight,
      sort_order: i,
    }));

    await supabase.from("routine_exercises").insert(exercises);
  }

  revalidatePath("/dashboard/workouts");
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
