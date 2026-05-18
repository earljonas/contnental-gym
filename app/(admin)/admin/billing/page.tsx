import { ResourcePage } from "@/components/admin/resource-page";
import { ExportButton } from "@/components/admin/export-button";
import { getBillingMemberOptions } from "@/lib/branch-admin/data";
import { getSuperAdminOverview } from "@/lib/super-admin/data";
import { createClient } from "@/lib/supabase/server";
import { PaymentSheet } from "@/components/admin/payment-sheet";
import { confirmPayment, getPaymentDetails } from "./actions";
import { RecordPaymentButton } from "./record-payment";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentId?: string }>;
}) {
  const query = await searchParams;
  const overview = await getSuperAdminOverview();
  const supabase = await createClient();

  const [memberOptions, { data: branches }] = await Promise.all([
    getBillingMemberOptions(0),
    supabase
      .from("branches")
      .select("id, name")
      .order("name"),
  ]);
  const paymentDetails = query.paymentId ? await getPaymentDetails(Number(query.paymentId)) : null;

  return (
    <>
    <ResourcePage
      title="Billing"
      summary={[
        { label: "Confirmed", value: overview.payments.filter((item) => item.status === "Confirmed").length.toString() },
        { label: "Pending", value: overview.payments.filter((item) => item.status === "Pending").length.toString() },
        { label: "Overdue", value: overview.payments.filter((item) => item.status === "Overdue").length.toString() },
        { label: "Tracked payments", value: overview.payments.length.toString() },
      ]}
      headerAction={
        <div className="flex flex-wrap items-center gap-3">
          <ExportButton
            rows={overview.payments}
            columns={[
              { header: "Member", key: "member" },
              { header: "Amount", key: "amount" },
              { header: "Payment Method", key: "method" },
              { header: "Payment Status", key: "status" },
              { header: "Reference Number", key: "referenceNumber" },
              { header: "Payment Branch", key: "branch" },
              { header: "Date", key: "date" },
            ]}
            filename="contnental-payments"
          />
          <RecordPaymentButton members={memberOptions} branches={branches ?? []} />
        </div>
      }
      tableTitle="Transactions"
      columns={[
        { header: "Member", key: "member" },
        { header: "Amount", key: "amount" },
        { header: "Payment Method", key: "method" },
        { header: "Payment Status", key: "status", cellType: "status" },
        { header: "Reference Number", key: "referenceNumber" },
        { header: "Payment Branch", key: "branch" },
        { header: "Date", key: "date" },
        { header: "Actions", cellType: "payment-action" },
      ]}
      rows={overview.payments}
      onPaymentConfirm={async (id: number) => {
        "use server";
        await confirmPayment(id);
      }}
      searchPlaceholder="Search member, reference, branch..."
      searchKeys={["member", "branch", "amount", "method", "referenceNumber"]}
      filters={[
        { key: "branch", label: "Branch", options: [...new Set(overview.payments.map((item) => item.branch).filter(Boolean))] },
        { key: "status", label: "Status", options: ["Confirmed", "Pending", "Overdue"] },
        { key: "method", label: "Method", options: [...new Set(overview.payments.map((item) => item.method).filter(Boolean))] },
      ]}
      dateKey="date"
      paymentViewPath="/admin/billing"
      enableTableExport={false}
    />
    {paymentDetails ? <PaymentSheet details={paymentDetails} /> : null}
    </>
  );
}
