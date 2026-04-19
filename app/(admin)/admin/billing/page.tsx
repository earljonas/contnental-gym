import { ResourcePage } from "@/components/admin/resource-page";
import { getSuperAdminOverview } from "@/lib/super-admin/data";

export default async function BillingPage() {
  const overview = await getSuperAdminOverview();

  return (
    <ResourcePage
      title="Billing"
      actionLabel="Generate summary"
      summary={[
        { label: "Confirmed", value: overview.payments.filter((item) => item.status === "Confirmed").length.toString() },
        { label: "Pending", value: overview.payments.filter((item) => item.status === "Pending").length.toString() },
        { label: "Overdue", value: overview.payments.filter((item) => item.status === "Overdue").length.toString() },
        { label: "Tracked payments", value: overview.payments.length.toString() },
      ]}
      tableTitle="Transactions"
      columns={[
        { header: "Member", key: "member" },
        { header: "Branch", key: "branch" },
        { header: "Amount", key: "amount" },
        { header: "Method", key: "method" },
        { header: "Due date", key: "dueDate" },
        { header: "Status", key: "status" },
      ]}
      rows={overview.payments}
      searchPlaceholder="Search member or amount"
      searchKeys={["member", "branch", "amount", "method"]}
      filters={[
        { key: "status", label: "Status", options: ["Confirmed", "Pending", "Overdue"] },
        { key: "branch", label: "Branch", options: [...new Set(overview.payments.map((item) => item.branch).filter(Boolean))] },
        { key: "method", label: "Method", options: [...new Set(overview.payments.map((item) => item.method).filter(Boolean))] },
      ]}
      dateKey="dueDate"
    />
  );
}
