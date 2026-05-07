import { SuperAnnouncementsPage } from "@/components/admin/super-announcements-page";
import {
  getAnnouncementBranchOptions,
  getSuperAdminAnnouncements,
} from "@/lib/announcements";

export default async function AnnouncementsPage() {
  const [branches, announcements] = await Promise.all([
    getAnnouncementBranchOptions(),
    getSuperAdminAnnouncements(),
  ]);

  return (
    <SuperAnnouncementsPage
      branches={branches}
      announcements={announcements}
    />
  );
}
