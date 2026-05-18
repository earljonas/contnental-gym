import { ResourcePage } from "@/components/admin/resource-page";
import { ExportButton } from "@/components/admin/export-button";
import { getSuperAdminOverview } from "@/lib/super-admin/data";
import { getMemberDetails } from "./actions";
import { MemberSheet } from "@/components/admin/member-sheet";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ memberId?: string }>;
}) {
  const query = await searchParams;
  const overview = await getSuperAdminOverview();

  let details = null;
  if (query.memberId) {
    details = await getMemberDetails(query.memberId);
  }

  return (
    <>
      <ResourcePage
        title="Members"
        summary={[
          { label: "Total members", value: overview.members.length.toString() },
          { label: "Active", value: overview.members.filter((item) => item.status === "Active").length.toString() },
          { label: "At risk", value: overview.members.filter((item) => item.status === "At Risk").length.toString() },
          { label: "Pending", value: overview.members.filter((item) => item.status === "Pending").length.toString() },
        ]}
        headerAction={
          <ExportButton
            rows={overview.members}
            columns={[
              { header: "Name", key: "name" },
              { header: "Email", key: "email" },
              { header: "Registration Branch / Home Branch", key: "branch" },
              { header: "Plan", key: "plan" },
              { header: "Status", key: "status" },
              { header: "Expiry Date", key: "expiryDate" },
              { header: "Last Check-in", key: "lastCheckIn" },
              { header: "Joined", key: "joined" },
            ]}
            filename="contnental-members"
          />
        }
        tableTitle="Directory"
        columns={[
          { header: "Member Name", key: "name" },
          { header: "Membership Status", key: "status" },
          { header: "Membership Plan", key: "plan" },
          { header: "Expiry Date", key: "expiryDate" },
          { header: "Registration Branch / Home Branch", key: "branch" },
          { header: "Last Check-in", key: "lastCheckIn" },
          {
            header: "Actions",
            id: "actions",
            key: "email",
            cellType: "member-view",
          },
        ]}
        rows={overview.members}
        searchPlaceholder="Search name or email"
        searchKeys={["name", "email", "plan"]}
        filters={[
          { key: "status", label: "Status", options: ["Active", "Pending", "At Risk", "Inactive"] },
          { key: "branch", label: "Branch", options: [...new Set(overview.members.map((item) => item.branch))] },
          { key: "plan", label: "Plan", options: [...new Set(overview.members.map((item) => item.plan))] },
        ]}
        dateKey="joined"
        memberViewPath="/admin/members"
        enableTableExport={false}
      />

      {details && <MemberSheet details={details} />}
    </>
  );
}
