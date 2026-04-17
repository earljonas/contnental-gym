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
  key: keyof T;
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
            <Card key={item.label}>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-semibold uppercase tracking-[0.16em]">
                  {item.label}
                </CardDescription>
                <CardTitle className="font-display text-4xl font-black uppercase tracking-tight">
                  {item.value}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <CardTitle>{tableTitle}</CardTitle>
            <Button variant="outline" className="rounded-2xl text-xs font-semibold uppercase tracking-[0.16em]">
              Export
            </Button>
          </CardHeader>
          <CardContent>
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
