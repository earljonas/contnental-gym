import { SuperAnnouncementsPage } from "@/components/admin/super-announcements-page";
import { getSuperAdminAnnouncements } from "@/lib/announcements";

export default async function AnnouncementsPage() {
  const announcements = await getSuperAdminAnnouncements();

  return (
    <SuperAnnouncementsPage
      announcements={announcements}
    />
  );
}
