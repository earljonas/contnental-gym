import { ResourcePage } from "@/components/admin/resource-page";
import { BranchTrafficStack, PeakHoursChart } from "@/components/admin/data-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSuperAdminOverview } from "@/lib/super-admin/data";

export default async function AttendancePage() {
  const overview = await getSuperAdminOverview();

  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const todayCount = overview.attendance.filter((a) => a.date === today).length;
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekCount = overview.attendance.filter((a) => new Date(a.date).getTime() > oneWeekAgo).length;

  const branchCounts = overview.attendance.reduce((acc, curr) => {
    acc[curr.branch] = (acc[curr.branch] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const busiestBranch = Object.entries(branchCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  const timeCounts = overview.attendance.reduce((acc, curr) => {
    const parts = curr.time.split(" ");
    const hour = (parts[0]?.split(":")[0] ?? "") + " " + (parts[1] ?? "");
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const peakHour = Object.entries(timeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  return (
    <ResourcePage
      title="Attendance"
      summary={[
        { label: "Today's check-ins", value: todayCount.toString() },
        { label: "This week's check-ins", value: weekCount.toString() },
        { label: "Busiest branch", value: busiestBranch },
        { label: "Peak hour", value: peakHour },
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
      charts={
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Peak Hours Curve</CardTitle>
            </CardHeader>
            <CardContent>
              <PeakHoursChart />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Branch Traffic Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <BranchTrafficStack />
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}
