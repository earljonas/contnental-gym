import { createClient } from "@/lib/supabase/server";

export type AnnouncementItem = {
  id: number;
  title: string;
  body: string;
  audience: string;
  status: "Draft" | "Sent";
  publishAt: string;
  createdAt: string;
};

export type AnnouncementBranchOption = {
  id: number;
  name: string;
};

type RawAnnouncement = {
  id: number;
  title: string;
  body: string;
  all_branches: boolean;
  audience_branch_ids: number[];
  status: "DRAFT" | "SENT";
  publish_at: string | null;
  created_at: string;
};

function formatAudience(
  announcement: RawAnnouncement,
  branchesById: Map<number, string>
) {
  if (announcement.all_branches) {
    return "All branches";
  }

  const names = (announcement.audience_branch_ids ?? [])
    .map((branchId) => branchesById.get(branchId))
    .filter((name): name is string => Boolean(name));

  return names.length ? names.join(", ") : "No branches";
}

function formatAnnouncement(
  announcement: RawAnnouncement,
  branchesById: Map<number, string>
): AnnouncementItem {
  const publishAt = announcement.publish_at ?? announcement.created_at;

  return {
    id: announcement.id,
    title: announcement.title,
    body: announcement.body,
    audience: formatAudience(announcement, branchesById),
    status: announcement.status === "SENT" ? "Sent" : "Draft",
    publishAt: new Date(publishAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    createdAt: announcement.created_at,
  };
}

export async function getAnnouncementBranchOptions(): Promise<AnnouncementBranchOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("branches").select("id, name").order("name");

  return (data ?? []).map((branch) => ({
    id: branch.id,
    name: branch.name,
  }));
}

export async function getSuperAdminAnnouncements(): Promise<AnnouncementItem[]> {
  const supabase = await createClient();
  const [announcementsResult, branches] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, body, all_branches, audience_branch_ids, status, publish_at, created_at")
      .order("created_at", { ascending: false }),
    getAnnouncementBranchOptions(),
  ]);

  if (announcementsResult.error) {
    console.error("[getSuperAdminAnnouncements] Error:", announcementsResult.error);
    return [];
  }

  const branchesById = new Map(branches.map((branch) => [branch.id, branch.name]));
  return (announcementsResult.data ?? []).map((announcement) =>
    formatAnnouncement(announcement as RawAnnouncement, branchesById)
  );
}

export async function getBranchAnnouncements(): Promise<AnnouncementItem[]> {
  const supabase = await createClient();
  const [announcementsResult, branches] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, body, all_branches, audience_branch_ids, status, publish_at, created_at")
      .eq("status", "SENT")
      .order("publish_at", { ascending: false }),
    getAnnouncementBranchOptions(),
  ]);

  if (announcementsResult.error) {
    console.error("[getBranchAnnouncements] Error:", announcementsResult.error);
    return [];
  }

  const branchesById = new Map(branches.map((branch) => [branch.id, branch.name]));
  return (announcementsResult.data ?? []).map((announcement) =>
    formatAnnouncement(announcement as RawAnnouncement, branchesById)
  );
}
