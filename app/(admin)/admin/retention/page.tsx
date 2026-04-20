import { ResourcePage } from "@/components/admin/resource-page";
import { getSuperAdminOverview } from "@/lib/super-admin/data";

export default async function RetentionPage() {
  const overview = await getSuperAdminOverview();

  return (
    <ResourcePage
      title="Retention"
      actionLabel="Review at-risk members"
      summary={[
        { label: "High risk", value: overview.retention.filter((item) => item.risk === "High").length.toString() },
        { label: "Medium risk", value: overview.retention.filter((item) => item.risk === "Medium").length.toString() },
        { label: "Low risk", value: overview.retention.filter((item) => item.risk === "Low").length.toString() },
        { label: "Suggested actions", value: overview.retention.length.toString() },
      ]}
      tableTitle="Analyzer"
      columns={[
        { header: "Member", key: "member" },
        { header: "Last visit", key: "lastVisit" },
        { header: "Risk", key: "risk" },
        { header: "Trigger", key: "trigger" },
        { header: "Action", key: "action" },
      ]}
      rows={overview.retention}
      searchPlaceholder="Search member"
      searchKeys={["member", "trigger", "action"]}
      filters={[
        { key: "risk", label: "Risk", options: ["High", "Medium", "Low"] },
      ]}
    />
  );
}
