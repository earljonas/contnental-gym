import { ResourcePage } from "@/components/admin/resource-page";
import { RevenueOutstandingChart } from "@/components/admin/data-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSuperAdminOverview } from "@/lib/super-admin/data";
import { createClient } from "@/lib/supabase/server";
import { confirmPayment } from "./actions";
import { RecordPaymentButton } from "./record-payment";

export default async function BillingPage() {
  const overview = await getSuperAdminOverview();
  const supabase = await createClient();

  // Fetch members for the record payment dialog
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("role", "MEMBER")
    .order("first_name");

  const memberOptions = (profiles ?? []).map((p) => ({
    id: p.id as string,
    name: `${p.first_name} ${p.last_name}`.trim(),
  }));

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
      headerAction={<RecordPaymentButton members={memberOptions} />}
      tableTitle="Transactions"
      columns={[
        { header: "Member", key: "member" },
        { header: "Branch", key: "branch" },
        { header: "Amount", key: "amount" },
        { header: "Method", key: "method" },
        { header: "Due date", key: "dueDate" },
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
      charts={
        <div className="grid grid-cols-1 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Receivables</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueOutstandingChart />
            </CardContent>
          </Card>
        </div>
      }
    />
  );
}
