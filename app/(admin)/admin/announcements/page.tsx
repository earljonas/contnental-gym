import { SuperAnnouncementsPage } from "@/components/admin/super-announcements-page";
import { getAnnouncementBranchOptions, getSuperAdminAnnouncements } from "@/lib/announcements";

export default async function AnnouncementsPage() {
  const [announcements, branches] = await Promise.all([
    getSuperAdminAnnouncements(),
    getAnnouncementBranchOptions(),
  ]);

  return (
    <SuperAnnouncementsPage
      announcements={announcements}
      branches={branches}
    />
  );
}
