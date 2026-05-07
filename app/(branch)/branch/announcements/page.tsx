import { BranchAnnouncementsFeed } from "@/components/admin/branch-announcements-feed";
import { getBranchAnnouncements } from "@/lib/announcements";

export default async function BranchAnnouncementsPage() {
  const announcements = await getBranchAnnouncements();

  return <BranchAnnouncementsFeed announcements={announcements} />;
}
