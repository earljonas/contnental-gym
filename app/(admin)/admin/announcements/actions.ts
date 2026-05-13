"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";

export async function sendAnnouncement(data: {
  title: string;
  body: string;
  allBranches?: boolean;
  branchIds?: number[];
  publishAt?: string;
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
    const allBranches = data.allBranches ?? true;
    const branchIds = allBranches ? [] : data.branchIds ?? [];
    const publishAt = data.publishAt ? new Date(data.publishAt) : new Date();

    if (!title) {
      return { error: "Title is required" };
    }
    if (!body) {
      return { error: "Message is required" };
    }
    if (!allBranches && branchIds.length === 0) {
      return { error: "Choose at least one branch or send to all branches" };
    }
    if (Number.isNaN(publishAt.getTime())) {
      return { error: "Publish date is invalid" };
    }

    const { error } = await supabase.from("announcements").insert({
      title,
      body,
      all_branches: allBranches,
      audience_branch_ids: branchIds,
      status: "SENT",
      publish_at: publishAt.toISOString(),
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

export async function deleteAnnouncement(announcementId: number) {
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

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcementId);

    if (error) {
      console.error("[deleteAnnouncement] Error:", error);
      return { error: "Failed to delete announcement" };
    }

    revalidatePath("/admin/announcements");
    revalidatePath("/branch/announcements");
    return { success: true };
  } catch (error) {
    console.error("[deleteAnnouncement] Unexpected error:", error);
    return { error: "Unexpected error occurred" };
  }
}
