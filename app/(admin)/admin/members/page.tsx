import { ResourcePage } from "@/components/admin/resource-page";
import { getSuperAdminOverview } from "@/lib/super-admin/data";
import { getMemberDetails } from "./actions";
import { MemberSheet } from "@/components/admin/member-sheet";
import { redirect } from "next/navigation";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: { memberId?: string };
}) {
  const overview = await getSuperAdminOverview();
  
  let details = null;
  if (searchParams?.memberId) {
    details = await getMemberDetails(searchParams.memberId);
  }

  async function handleMemberView(id: string | number) {
    "use server";
    redirect(`/admin/members?memberId=${id}`);
  }

  return (
    <>
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
        { header: "Plan", key: "plan" },
        { header: "Status", key: "status" },
        { header: "Joined", key: "joined" },
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
        { key: "plan", label: "Plan", options: [...new Set(overview.members.map((item) => item.plan))] },
      ]}
      dateKey="joined"
      onMemberView={handleMemberView}
    />
    
    {details && <MemberSheet details={details} />}
    </>
  );
}
