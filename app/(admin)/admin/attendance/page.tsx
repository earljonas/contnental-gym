import { SuperAttendancePage } from "@/components/admin/super-attendance-page";
import { getSuperAdminAttendance } from "@/lib/super-admin/data";
import { ReportUnavailable } from "@/components/admin/report-unavailable";

export default async function AttendancePage() {
  const data = await getSuperAdminAttendance();
  if (data.unavailable) return <ReportUnavailable title="Attendance report unavailable" href="/admin/attendance" />;

  return <SuperAttendancePage data={data} />;
}
