import { ResourcePage } from "@/components/admin/resource-page";
import { getSuperAdminOverview } from "@/lib/super-admin/data";

export default async function MembersPage() {
  const overview = await getSuperAdminOverview();

  return (
    <ResourcePage
      title="Members"
      actionLabel="Add member"
      summary={[
        { label: "Total members", value: overview.members.length.toString() },
        { label: "Active", value: overview.members.filter((item) => item.status === "Active").length.toString() },
        { label: "At risk", value: overview.members.filter((item) => item.status === "At Risk").length.toString() },
        { label: "Pending", value: overview.members.filter((item) => item.status === "Pending").length.toString() },
      ]}
      tableTitle="Directory"
      columns={[
        { header: "Name", key: "name" },
        { header: "Email", key: "email" },
        { header: "Branch", key: "branch" },
        { header: "Plan", key: "plan" },
        { header: "Status", key: "status" },
        { header: "Joined", key: "joined" },
      ]}
      rows={overview.members}
      searchPlaceholder="Search name or email"
      searchKeys={["name", "email", "branch", "plan"]}
      filters={[
        { key: "status", label: "Status", options: ["Active", "Pending", "At Risk", "Inactive"] },
        { key: "plan", label: "Plan", options: [...new Set(overview.members.map((item) => item.plan))] },
        { key: "branch", label: "Branch", options: [...new Set(overview.members.map((item) => item.branch))] },
      ]}
      dateKey="joined"
    />
  );
}
