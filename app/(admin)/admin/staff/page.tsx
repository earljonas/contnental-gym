import { ResourcePage } from "@/components/admin/resource-page";
import { getSuperAdminOverview } from "@/lib/super-admin/data";

export default async function StaffPage() {
  const overview = await getSuperAdminOverview();

  return (
    <ResourcePage
      title="Staff"
      actionLabel="Invite staff"
      summary={[
        { label: "Owners", value: overview.staff.filter((item) => item.role === "Owner").length.toString() },
        { label: "Managers", value: overview.staff.filter((item) => item.role === "Manager").length.toString() },
        { label: "Receptionists", value: overview.staff.filter((item) => item.role === "Receptionist").length.toString() },
        { label: "Invites pending", value: overview.staff.filter((item) => item.status === "Invited").length.toString() },
      ]}
      tableTitle="Directory"
      columns={[
        { header: "Name", key: "name" },
        { header: "Role", key: "role" },
        { header: "Branch", key: "branch" },
        { header: "Permissions", key: "permissions" },
        { header: "Status", key: "status" },
      ]}
      rows={overview.staff}
      searchPlaceholder="Search staff"
      searchKeys={["name", "role", "branch", "permissions"]}
      filters={[
        { key: "role", label: "Role", options: ["Owner", "Manager", "Receptionist"] },
        { key: "status", label: "Status", options: ["Active", "Invited"] },
        { key: "branch", label: "Branch", options: [...new Set(overview.staff.map((item) => item.branch).filter((b) => b && b !== "All branches"))] },
      ]}
    />
  );
}
