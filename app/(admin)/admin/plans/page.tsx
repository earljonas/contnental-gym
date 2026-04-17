import { ResourcePage } from "@/components/admin/resource-page";
import { getSuperAdminOverview } from "@/lib/super-admin/data";

export default async function PlansPage() {
  const overview = await getSuperAdminOverview();

  return (
    <ResourcePage
      title="Plans"
      actionLabel="Create plan"
      summary={[
        { label: "Active plans", value: overview.plans.filter((item) => item.status === "Active").length.toString() },
        { label: "Basic tier", value: overview.plans.filter((item) => item.tier === "Basic").length.toString() },
        { label: "Prime tier", value: overview.plans.filter((item) => item.tier === "Prime").length.toString() },
        { label: "Extreme tier", value: overview.plans.filter((item) => item.tier === "Extreme").length.toString() },
      ]}
      tableTitle="Catalog"
      columns={[
        { header: "Name", key: "name" },
        { header: "Tier", key: "tier" },
        { header: "Price", key: "price" },
        { header: "Duration", key: "duration" },
        { header: "Access", key: "access" },
        { header: "Status", key: "status" },
      ]}
      rows={overview.plans}
      searchPlaceholder="Search plan"
      searchKeys={["name", "tier", "access", "price"]}
      filters={[
        { key: "status", label: "Status", options: ["Active", "Archived"] },
        { key: "tier", label: "Tier", options: ["Basic", "Prime", "Extreme"] },
      ]}
    />
  );
}
