import { ArrowDownRight, ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPageTransition } from "@/components/admin/page-transition";
import { DistributionBarChart, TrendLineChart } from "@/components/admin/charts";
import { ResourceTable } from "@/components/admin/resource-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ActivityRow,
  DashboardMetric,
  DistributionPoint,
  PaymentRow,
  TrendPoint,
} from "@/lib/super-admin/data";
import { cn } from "@/lib/utils";

function metricTone(trend: DashboardMetric["trend"]) {
  if (trend === "up") return "text-emerald-600";
  if (trend === "down") return "text-amber-600";
  return "text-slate-500";
}

function activityTone(status: ActivityRow["status"]) {
  if (status === "success") return "success";
  if (status === "warning") return "warning";
  if (status === "danger") return "danger";
  return "outline";
}

export function DashboardPage({
  metrics,
  revenueTrend,
  checkInTrend,
  branchRevenue,
  planDistribution,
  recentActivity,
  payments,
}: {
  metrics: DashboardMetric[];
  revenueTrend: TrendPoint[];
  checkInTrend: TrendPoint[];
  branchRevenue: DistributionPoint[];
  planDistribution: DistributionPoint[];
  recentActivity: ActivityRow[];
  payments: PaymentRow[];
}) {
  return (
    <AdminPageTransition>
      <div className="space-y-8">
        <AdminPageHeader title="Dashboard" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="overflow-hidden rounded-[28px]">
              <CardHeader className="gap-5 p-6">
                <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                  {metric.label}
                </CardDescription>
                <div className="flex min-h-20 flex-col justify-between gap-4">
                  <CardTitle className="font-display text-[clamp(2.5rem,3vw,3.4rem)] font-black uppercase leading-none tracking-tight">
                    {metric.value}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={cn("flex items-center gap-1 text-sm font-semibold", metricTone(metric.trend))}>
                      {metric.trend === "down" ? (
                        <ArrowDownRight className="size-4" />
                      ) : metric.trend === "up" ? (
                        <ArrowUpRight className="size-4" />
                      ) : (
                        <ArrowRight className="size-4" />
                      )}
                      {metric.delta}
                    </span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Revenue</CardTitle>
              <Badge variant="secondary">Finance</Badge>
            </CardHeader>
            <CardContent>
              <TrendLineChart
                data={revenueTrend}
                strokeClassName="text-amber-500"
                fillClassName="text-amber-100"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Plans</CardTitle>
              <Badge variant="secondary">Members</Badge>
            </CardHeader>
            <CardContent>
              <DistributionBarChart data={planDistribution} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Revenue by Branch</CardTitle>
            <Badge variant="secondary">Finance</Badge>
          </CardHeader>
          <CardContent>
            {branchRevenue.length > 0 ? (
              <DistributionBarChart data={branchRevenue} />
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center md:p-12">
                <p className="text-sm font-semibold text-foreground">No branch revenue yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Confirmed payments will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Check-ins</CardTitle>
              <Badge variant="outline">Attendance</Badge>
            </CardHeader>
            <CardContent>
              <TrendLineChart
                data={checkInTrend}
                strokeClassName="text-sky-600"
                fillClassName="text-sky-100"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Activity</CardTitle>
              <Sparkles className="size-5 text-amber-500" />
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                <div
                  key={`${activity.member}-${activity.activity}-${activity.timestamp}-${index}`}
                  className="rounded-2xl border border-border bg-secondary/60 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{activity.member}</p>
                        <Badge variant={activityTone(activity.status)}>{activity.branch}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.activity}</p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {activity.timestamp}
                    </span>
                  </div>
                  {activity.amount ? (
                    <p className="mt-3 text-sm font-semibold text-foreground">{activity.amount}</p>
                  ) : null}
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <p className="text-sm font-semibold text-foreground">No recent activity</p>
                  <p className="mt-1 text-xs text-muted-foreground">Payments and check-ins will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <ResourceTable
              columns={[
                { header: "Member", key: "member" },
                { header: "Amount", key: "amount" },
                { header: "Status", key: "status" },
                { header: "Branch", key: "branch" },
              ]}
              rows={payments.slice(0, 5)}
              searchPlaceholder="Search payments"
              searchKeys={["member", "status", "branch"]}
            />
          </CardContent>
        </Card>
      </div>
    </AdminPageTransition>
  );
}
