import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPageTransition } from "@/components/admin/page-transition";
import { Button } from "@/components/ui/button";
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
  cellType?: "text" | "status" | "email-action";
};

export function ResourcePage<T extends Record<string, string>>({
  title,
  actionLabel,
  summary,
  tableTitle,
  columns,
  rows,
  searchPlaceholder,
  searchKeys,
  filters,
  dateKey,
}: {
  title: string;
  actionLabel?: string;
  summary: Summary[];
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
}) {
  return (
    <AdminPageTransition>
      <div className="space-y-8">
        <AdminPageHeader title={title} actionLabel={actionLabel} />

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

        <Card className="rounded-[30px]">
          <CardHeader className="flex-col gap-4 border-b border-border/70 p-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle>{tableTitle}</CardTitle>
            <Button variant="outline" className="h-11 rounded-2xl px-5 text-xs font-semibold uppercase tracking-[0.16em]">
              Export
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <ResourceTable
              columns={columns}
              rows={rows}
              searchPlaceholder={searchPlaceholder}
              searchKeys={searchKeys}
              filters={filters}
              dateKey={dateKey}
            />
          </CardContent>
        </Card>
      </div>
    </AdminPageTransition>
  );
}
