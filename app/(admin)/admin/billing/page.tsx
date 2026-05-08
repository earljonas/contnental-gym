import { ResourcePage } from "@/components/admin/resource-page";
import { getBillingMemberOptions } from "@/lib/branch-admin/data";
import { getSuperAdminOverview } from "@/lib/super-admin/data";
import { createClient } from "@/lib/supabase/server";
import { confirmPayment } from "./actions";
import { RecordPaymentButton } from "./record-payment";

export default async function BillingPage() {
  const overview = await getSuperAdminOverview();
  const supabase = await createClient();

  const [memberOptions, { data: branches }] = await Promise.all([
    getBillingMemberOptions(0),
    supabase
      .from("branches")
      .select("id, name")
      .order("name"),
  ]);

  return (
    <ResourcePage
      title="Billing"
      summary={[
        { label: "Confirmed", value: overview.payments.filter((item) => item.status === "Confirmed").length.toString() },
        { label: "Pending", value: overview.payments.filter((item) => item.status === "Pending").length.toString() },
        { label: "Overdue", value: overview.payments.filter((item) => item.status === "Overdue").length.toString() },
        { label: "Tracked payments", value: overview.payments.length.toString() },
      ]}
      headerAction={<RecordPaymentButton members={memberOptions} branches={branches ?? []} />}
      tableTitle="Transactions"
      columns={[
        { header: "Member", key: "member" },
        { header: "Collected At", key: "branch" },
        { header: "Amount", key: "amount" },
        { header: "Method", key: "method" },
        { header: "Payment Date", key: "dueDate" },
        { header: "Status", key: "status", cellType: "status" },
        { header: "Action", cellType: "payment-action" },
      ]}
      rows={overview.payments}
      onPaymentConfirm={async (id: number) => {
        "use server";
        await confirmPayment(id);
      }}
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
