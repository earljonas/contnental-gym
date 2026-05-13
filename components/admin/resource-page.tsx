import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPageTransition } from "@/components/admin/page-transition";
import { ResourceTable } from "@/components/admin/resource-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Summary = {
  label: string;
  value: string;
};

type Column<T> = {
  header: string;
  key?: keyof T;
  id?: string;
  cellType?: "text" | "status" | "email-action" | "payment-action" | "member-view";
};

export function ResourcePage<T extends Record<string, unknown>>({
  title,
  actionLabel,
  summary,
  extraCards,
  tableTitle,
  columns,
  rows,
  searchPlaceholder,
  searchKeys,
  filters,
  dateKey,
  charts,
  headerAction,
  onPaymentConfirm,
  memberViewPath,
  enableTableExport,
}: {
  title: string;
  actionLabel?: string;
  summary?: Summary[];
  extraCards?: Summary[];
  tableTitle: string;
  columns: Column<T>[];
  rows: T[];
  searchPlaceholder: string;
  searchKeys: (keyof T)[];
  filters?: {
    key: keyof T;
    label: string;
    options: string[];
  }[];
  dateKey?: keyof T;
  charts?: React.ReactNode;
  headerAction?: React.ReactNode;
  onPaymentConfirm?: (id: number) => Promise<unknown>;
  memberViewPath?: string;
  enableTableExport?: boolean;
}) {
  return (
    <AdminPageTransition>
      <div className="space-y-8">
        <AdminPageHeader title={title} actionLabel={actionLabel} action={headerAction} />

        {summary && summary.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summary.map((item) => (
              <Card key={item.label} className="rounded-[28px]">
                <CardHeader className="gap-4 p-6">
                  <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                    {item.label}
                  </CardDescription>
                  <CardTitle className="font-display text-[clamp(2.35rem,3vw,3.2rem)] font-black uppercase leading-none tracking-tight">
                    {item.value}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : null}

        {extraCards && extraCards.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {extraCards.map((item) => (
              <Card key={item.label} className="rounded-[28px] border-dashed">
                <CardHeader className="gap-4 p-6">
                  <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                    {item.label}
                  </CardDescription>
                  <CardTitle className="font-display text-[clamp(2.35rem,3vw,3.2rem)] font-black uppercase leading-none tracking-tight">
                    {item.value}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : null}

        {charts ? <div className="grid gap-6">{charts}</div> : null}

        <Card className="rounded-[30px]">
          <CardHeader className="border-b border-border/70 p-6">
            <CardTitle>{tableTitle}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResourceTable
              columns={columns}
              rows={rows}
              searchPlaceholder={searchPlaceholder}
              searchKeys={searchKeys}
              filters={filters}
              dateKey={dateKey}
              onPaymentConfirm={onPaymentConfirm}
              memberViewPath={memberViewPath}
              enableExport={enableTableExport}
            />
          </CardContent>
        </Card>
      </div>
    </AdminPageTransition>
  );
}
