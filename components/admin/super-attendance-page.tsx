"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPageTransition } from "@/components/admin/page-transition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SuperAdminAttendanceData } from "@/lib/super-admin/data";

type ChartTooltipPayload = {
  value: number;
  name?: string;
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold text-foreground">
        {payload[0].value.toLocaleString()} check-ins
      </p>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center">
      <div>
        <p className="text-sm font-semibold text-foreground">No attendance data</p>
        <p className="mt-1 text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function SuperAttendancePage({ data }: { data: SuperAdminAttendanceData }) {
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.rows.filter((row) => {
      const matchesSearch =
        !query ||
        row.member.toLowerCase().includes(query) ||
        row.branch.toLowerCase().includes(query) ||
        row.date.toLowerCase().includes(query);

      if (!matchesSearch) return false;
      if (branchFilter !== "All" && row.branch !== branchFilter) return false;
      return true;
    });
  }, [branchFilter, data.rows, search]);

  return (
    <AdminPageTransition>
      <div className="space-y-8">
        <AdminPageHeader title="Attendance" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.metrics.map((metric) => (
            <Card key={metric.label} className="rounded-3xl">
              <CardHeader className="gap-4 p-6">
                <CardDescription className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground md:text-[11px]">
                  {metric.label}
                </CardDescription>
                <div>
                  <CardTitle className="font-display text-[clamp(2.25rem,3vw,3.2rem)] font-black uppercase leading-none tracking-tight">
                    {metric.value}
                  </CardTitle>
                  <p className="mt-2 text-xs text-muted-foreground">{metric.detail}</p>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="rounded-3xl">
            <CardHeader className="border-b border-border p-6">
              <CardTitle>Daily Check-ins</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {data.dailyTrend.some((point) => point.value > 0) ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--secondary))" }} />
                      <Bar dataKey="value" fill="#C9973E" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart message="Check-ins will appear here once members start visiting." />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader className="border-b border-border p-6">
              <CardTitle>Branch Split</CardTitle>
              <CardDescription>This week</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {data.branchSplit.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.branchSplit} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis dataKey="branch" type="category" tickLine={false} axisLine={false} width={90} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--secondary))" }} />
                      <Bar dataKey="value" fill="#C9973E" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart message="This chart compares branch visits for the current week." />
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl">
          <CardHeader className="border-b border-border p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Recent Attendance</CardTitle>
                <CardDescription>Latest check-ins across all branches</CardDescription>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search member, branch, date..."
                  className="h-10 rounded-xl focus:border-[#C9973E] focus:ring-[#C9973E]/20 sm:w-64"
                />
                <Select
                  value={branchFilter}
                  onChange={(event) => setBranchFilter(event.target.value)}
                  className="h-10 rounded-xl focus:border-[#C9973E] focus:ring-[#C9973E]/20 sm:w-44"
                >
                  <option value="All">All Branches</option>
                  {data.branchOptions.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {filteredRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center md:p-12">
                <p className="text-sm font-semibold text-foreground">No attendance found</p>
                <p className="mt-1 text-xs text-muted-foreground">Try a different search or branch filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Member</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-[15px] font-semibold text-foreground">{row.member}</TableCell>
                        <TableCell className="text-[15px] text-muted-foreground">{row.branch}</TableCell>
                        <TableCell className="text-[15px] text-muted-foreground">{row.date}</TableCell>
                        <TableCell className="text-[15px] text-muted-foreground">{row.time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageTransition>
  );
}
