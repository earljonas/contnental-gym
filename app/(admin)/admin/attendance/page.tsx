import { ResourcePage } from "@/components/admin/resource-page";
import { getSuperAdminOverview } from "@/lib/super-admin/data";

export default async function AttendancePage() {
  const overview = await getSuperAdminOverview();

  return (
    <ResourcePage
      title="Attendance"
      summary={[
        { label: "Recent logs", value: overview.attendance.length.toString() },
        { label: "View mode", value: "Read only" },
        { label: "Branches visible", value: "All" },
        { label: "Alerts", value: "0 blocked" },
      ]}
      tableTitle="Feed"
      columns={[
        { header: "Member", key: "member" },
        { header: "Branch", key: "branch" },
        { header: "Time", key: "time" },
        { header: "Date", key: "date" },
      ]}
      rows={overview.attendance}
      searchPlaceholder="Search member"
      searchKeys={["member", "branch", "date", "time"]}
      filters={[
        { key: "branch", label: "Branch", options: [...new Set(overview.attendance.map((item) => item.branch))] },
      ]}
      dateKey="date"
    />
  );
}
