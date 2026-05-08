"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";

export async function updateBranch(data: {
  id: number;
  name: string;
  location: string;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const roleInfo = await getUserRole(supabase, user.id);
    if (roleInfo.role !== "SUPER_ADMIN") {
      return { error: "Unauthorized" };
    }

    const name = data.name.trim();
    const location = data.location.trim();

    if (!name || !location) {
      return { error: "Branch name and location are required." };
    }

    const { data: branch, error } = await supabase
      .from("branches")
      .update({ name, location })
      .eq("id", data.id)
      .select("id, name, location")
      .single();

    if (error || !branch) {
      console.error("[updateBranch] Error:", error);
      return { error: "Unable to save branch changes." };
    }

    revalidatePath("/super-admin/branches");
    revalidatePath("/admin");

    return {
      branch: {
        id: branch.id,
        name: branch.name,
        location: branch.location ?? location,
      },
    };
  } catch (error) {
    console.error("[updateBranch] Unexpected error:", error);
    return { error: "Unexpected error occurred." };
  }
}
