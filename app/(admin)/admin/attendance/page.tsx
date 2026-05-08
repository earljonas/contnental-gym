import { SuperAttendancePage } from "@/components/admin/super-attendance-page";
import { getSuperAdminAttendance } from "@/lib/super-admin/data";

export default async function AttendancePage() {
  const data = await getSuperAdminAttendance();

  return <SuperAttendancePage data={data} />;
}
