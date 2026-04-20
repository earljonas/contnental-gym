import { DashboardPage } from "@/components/admin/dashboard-page";
import { getSuperAdminOverview } from "@/lib/super-admin/data";

export default async function AdminPage() {
  const overview = await getSuperAdminOverview();

  return (
    <DashboardPage
      metrics={overview.metrics}
      revenueTrend={overview.revenueTrend}
      checkInTrend={overview.checkInTrend}
      planDistribution={overview.planDistribution}
      recentActivity={overview.recentActivity}
      payments={overview.payments}
    />
  );
}
