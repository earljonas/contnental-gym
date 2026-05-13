import { BranchAnnouncementsFeed } from "@/components/admin/branch-announcements-feed";
import { getBranchAnnouncements } from "@/lib/announcements";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";

export default async function BranchAnnouncementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const roleInfo = user ? await getUserRole(supabase, user.id) : null;
  const announcements = await getBranchAnnouncements(roleInfo?.branch_id ?? null);

  return <BranchAnnouncementsFeed announcements={announcements} />;
}
