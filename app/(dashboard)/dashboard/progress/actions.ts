"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { gymDate, isGymDate } from "@/lib/gym/business-date";

/* ─── Add Body Metric ─── */
export async function addBodyMetric(data: {
  logged_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  arm_cm: number | null;
  leg_cm: number | null;
}) {
  const { logged_at, weight_kg, body_fat_pct, chest_cm, waist_cm, arm_cm, leg_cm } = data;
  const values = [weight_kg, body_fat_pct, chest_cm, waist_cm, arm_cm, leg_cm];
  if (!isGymDate(logged_at) || logged_at > gymDate() || values.every((value) => value === null)
    || values.some((value) => value !== null && (!Number.isFinite(value) || value <= 0 || value > 999.9))
    || (body_fat_pct !== null && body_fat_pct > 100)) {
    throw new Error("Enter a valid date and at least one valid measurement.");
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("body_metrics").insert({
    user_id: user.id,
    logged_at, weight_kg, body_fat_pct, chest_cm, waist_cm, arm_cm, leg_cm,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/progress");
}

/* ─── Delete Body Metric ─── */
export async function deleteBodyMetric(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("body_metrics")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/progress");
}
