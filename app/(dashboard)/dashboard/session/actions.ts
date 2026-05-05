"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveSession(data: {
  routine_id: number | null;
  routine_name: string | null;
  started_at: string;
  ended_at: string;
  total_volume: number;
  exercises: { name: string; sets: { weight: number; reps: number }[] }[];
  notes: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("workout_sessions").insert({
    user_id: user.id,
    routine_id: data.routine_id,
    routine_name: data.routine_name,
    started_at: data.started_at,
    ended_at: data.ended_at,
    total_volume: data.total_volume,
    exercises: data.exercises,
    notes: data.notes,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/workouts");
}

export async function getPersonalRecords(exerciseNames: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("exercises")
    .eq("user_id", user.id);

  const prs: Record<string, number> = {};

  (sessions ?? []).forEach((s) => {
    const exercises = s.exercises as { name: string; sets: { weight: number; reps: number }[] }[];
    exercises?.forEach((ex) => {
      if (exerciseNames.includes(ex.name)) {
        ex.sets?.forEach((set) => {
          const vol = set.weight * set.reps;
          if (!prs[ex.name] || vol > prs[ex.name]) {
            prs[ex.name] = vol;
          }
        });
      }
    });
  });

  return prs;
}
