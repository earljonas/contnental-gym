"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("body_metrics").insert({
    user_id: user.id,
    ...data,
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
