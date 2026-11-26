"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveSession(data: {
  sessionId: string;
  routine_id: number | null;
  routine_name: string | null;
  started_at: string;
  ended_at: string;
  exercises: { name: string; sets: { weight: number; reps: number }[] }[];
  notes: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const start = Date.parse(data.started_at);
  const end = Date.parse(data.ended_at);
  const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
  if (!uuid.test(data.sessionId) || !Number.isFinite(start) || !Number.isFinite(end) || end < start || end - start > 86_400_000
    || !Array.isArray(data.exercises) || data.exercises.length > 40) throw new Error("Invalid workout details");
  const exercises = data.exercises.filter((exercise) => exercise.sets.length > 0);
  if (!exercises.length || exercises.some((exercise) => !exercise.name.trim() || exercise.name.length > 150
    || exercise.sets.length > 30 || exercise.sets.some((set) => !Number.isFinite(set.weight) || set.weight < 0 || set.weight > 2000
      || !Number.isInteger(set.reps) || set.reps < 1 || set.reps > 500))) throw new Error("Log at least one valid set");

  let routineId = data.routine_id;
  if (routineId !== null) {
    const { data: routine, error } = await supabase.from("routines").select("id").eq("id", routineId).eq("user_id", user.id).maybeSingle();
    if (error) throw new Error("Could not verify the workout routine");
    routineId = routine?.id ?? null;
  }
  const volume = exercises.reduce((sum, exercise) => sum + exercise.sets.reduce((subtotal, set) => subtotal + set.weight * set.reps, 0), 0);
  if (volume > 99_999_999) throw new Error("Workout volume exceeds the supported range");
  const { error } = await supabase.from("workout_sessions").upsert({
    client_session_id: data.sessionId,
    user_id: user.id,
    routine_id: routineId,
    routine_name: data.routine_name?.slice(0, 100) ?? null,
    started_at: new Date(start).toISOString(),
    ended_at: new Date(end).toISOString(),
    total_volume: volume,
    exercises,
    notes: data.notes?.slice(0, 1000) ?? null,
  }, { onConflict: "user_id,client_session_id", ignoreDuplicates: true });
  if (error) {
    console.error("gym.workout.save_failed", { code: error.code });
    throw new Error("Could not save the workout");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/workouts");
  revalidatePath("/dashboard/progress");
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
