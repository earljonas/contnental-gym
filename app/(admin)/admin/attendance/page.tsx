import { ResourcePage } from "@/components/admin/resource-page";
import { BranchTrafficStack, PeakHoursChart } from "@/components/admin/data-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSuperAdminOverview } from "@/lib/super-admin/data";

export default async function AttendancePage() {
  const overview = await getSuperAdminOverview();

  // Dynamic branch-specific cards from attendance data
  const branchCounts = overview.attendance.reduce((acc, curr) => {
    acc[curr.branch] = (acc[curr.branch] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const allBranches = [...new Set(overview.attendance.map((a) => a.branch))].sort();
  // Ensure Lanang is always included even if no attendance yet
  if (!allBranches.includes("Lanang")) {
    allBranches.push("Lanang");
    allBranches.sort();
  }

  const branchCards = allBranches.map((branch) => ({
    label: `${branch} check-ins`,
    value: (branchCounts[branch] || 0).toString(),
  }));

  return (
    <ResourcePage
      title="Attendance"
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
      extraCards={branchCards}
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
