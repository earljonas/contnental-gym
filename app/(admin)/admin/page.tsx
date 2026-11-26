import { DashboardPage } from "@/components/admin/dashboard-page";
import { ReportUnavailable } from "@/components/admin/report-unavailable";
import { getSuperAdminOverview, type DashboardPeriod } from "@/lib/super-admin/data";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period: DashboardPeriod =
    params.period === "7d" || params.period === "quarter" ? params.period : "30d";
  const overview = await getSuperAdminOverview(period);
  if (overview.unavailable) return <ReportUnavailable title="Dashboard unavailable" href={`/admin?period=${period}`} />;

  return (
    <DashboardPage
      metrics={overview.metrics}
      revenueTrend={overview.revenueTrend}
      checkInTrend={overview.checkInTrend}
      branchRevenue={overview.branchRevenue}
      branchCheckIns={overview.branchCheckIns}
      topPerformingBranch={overview.topPerformingBranch}
      planDistribution={overview.planDistribution}
      recentActivity={overview.recentActivity}
      payments={overview.payments}
      period={period}
    />
  );
}
