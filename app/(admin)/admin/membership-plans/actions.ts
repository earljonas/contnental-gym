"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";

type PlanPayload = {
  id?: number;
  name: string;
  price: number;
  duration: number;
  features: string[];
};

async function requireSuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" as const };

  const roleInfo = await getUserRole(supabase, user.id);
  if (roleInfo.role !== "SUPER_ADMIN") return { error: "Unauthorized" as const };

  return { error: null };
}

function validatePlan(payload: PlanPayload) {
  if (!payload.name.trim()) return "Plan name is required.";
  if (!Number.isFinite(payload.price) || payload.price < 0) return "Price must be zero or more.";
  if (!Number.isInteger(payload.duration) || payload.duration <= 0) return "Duration must be a positive whole number.";
  return null;
}

export async function saveMembershipPlan(payload: PlanPayload) {
  const supabase = await createClient();
  const auth = await requireSuperAdmin(supabase);
  if (auth.error) return { error: auth.error };

  const validationError = validatePlan(payload);
  if (validationError) return { error: validationError };

  const body = {
    name: payload.name.trim(),
    price: payload.price,
    duration: payload.duration,
    features: payload.features.map((feature) => feature.trim()).filter(Boolean),
  };

  const query = payload.id
    ? supabase.from("membership_plans").update(body).eq("id", payload.id)
    : supabase.from("membership_plans").insert(body);

  const { error } = await query;

  if (error) {
    console.error("[saveMembershipPlan] Error:", error);
    return { error: "Unable to save membership plan." };
  }

  revalidatePath("/admin/membership-plans");
  revalidatePath("/admin");
  return { success: true };
}

export async function setMembershipPlanActive(planId: number, isActive: boolean) {
  const supabase = await createClient();
  const auth = await requireSuperAdmin(supabase);
  if (auth.error) return { error: auth.error };

  const { error } = await supabase
    .from("membership_plans")
    .update({ is_active: isActive })
    .eq("id", planId);

  if (error) {
    console.error("[setMembershipPlanActive] Error:", error);
    return { error: "Unable to update membership plan." };
  }

  revalidatePath("/admin/membership-plans");
  revalidatePath("/admin");
  return { success: true };
}
