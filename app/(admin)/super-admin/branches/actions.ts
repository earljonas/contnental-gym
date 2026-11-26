"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";

export async function updateBranch(data: {
  id: number | null;
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

    if (!name || !location || name.length > 100 || location.length > 250) {
      return { error: "Enter a branch name (up to 100 characters) and address (up to 250 characters)." };
    }

    const branches = supabase.from("branches");
    const write = data.id === null ? branches.insert({ name, location }) : branches.update({ name, location }).eq("id", data.id);
    const { data: branch, error } = await write.select("id, name, location").single();

    if (error || !branch) {
      console.error("[updateBranch] Error:", error);
      return { error: error?.code === "23505" ? "A branch with this name already exists." : "Unable to save branch changes." };
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
