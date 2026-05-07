"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";

export async function sendAnnouncement(data: {
  title: string;
  body: string;
  branchIds: number[];
  allBranches: boolean;
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

    const title = data.title.trim();
    const body = data.body.trim();
    const uniqueBranchIds = [...new Set(data.branchIds)].sort((a, b) => a - b);

    if (!title) {
      return { error: "Title is required" };
    }
    if (!body) {
      return { error: "Message is required" };
    }
    if (!data.allBranches && uniqueBranchIds.length === 0) {
      return { error: "Select at least one branch" };
    }

    const { error } = await supabase.from("announcements").insert({
      title,
      body,
      all_branches: data.allBranches,
      audience_branch_ids: data.allBranches ? [] : uniqueBranchIds,
      status: "SENT",
      publish_at: new Date().toISOString(),
      created_by: user.id,
    });

    if (error) {
      console.error("[sendAnnouncement] Error:", error);
      return { error: "Failed to send announcement" };
    }

    revalidatePath("/admin/announcements");
    revalidatePath("/branch/announcements");
    return { success: true };
  } catch (error) {
    console.error("[sendAnnouncement] Unexpected error:", error);
    return { error: "Unexpected error occurred" };
  }
}
