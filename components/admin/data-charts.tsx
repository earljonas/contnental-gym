"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

// --- MOCK DATA ---
const STYLES = {
  blue: { fill: "#3b82f6", stroke: "#2563eb" },
  amber: { fill: "#fbbf24", stroke: "#d97706" },
  emerald: { fill: "#10b981", stroke: "#059669" },
  rose: { fill: "#f43f5e", stroke: "#e11d48" },
  slate: { fill: "#64748b", stroke: "#475569" },
};

export const MOCK_CHART_DATA = {
  heatmap: [
    { time: "6AM", Ecoland: 40, Lanang: 25, Torres: 80 },
    { time: "9AM", Ecoland: 65, Lanang: 45, Torres: 90 },
    { time: "12PM", Ecoland: 30, Lanang: 20, Torres: 55 },
    { time: "3PM", Ecoland: 45, Lanang: 35, Torres: 65 },
    { time: "6PM", Ecoland: 95, Lanang: 85, Torres: 100 },
    { time: "9PM", Ecoland: 50, Lanang: 40, Torres: 60 },
  ],
  churnRisk: [
    { name: "Low Risk", value: 2400, color: STYLES.emerald.fill },
    { name: "Medium Risk", value: 500, color: STYLES.amber.fill },
    { name: "High Risk", value: 305, color: STYLES.rose.fill },
  ],
  lifespan: [
    { month: "Month 1", members: 100 },
    { month: "Month 3", members: 85 },
    { month: "Month 6", members: 60 },
    { month: "Month 9", members: 50 },
    { month: "Month 12", members: 45 },
    { month: "Year 2+", members: 40 },
  ],
  peakHours: [
    { hour: "5AM", traffic: 20 },
    { hour: "8AM", traffic: 85 },
    { hour: "11AM", traffic: 40 },
    { hour: "2PM", traffic: 35 },
    { hour: "5PM", traffic: 95 },
    { hour: "8PM", traffic: 70 },
    { hour: "11PM", traffic: 15 },
  ],
  branchTraffic: [
    { day: "Mon", Ecoland: 400, Lanang: 300, Torres: 550 },
    { day: "Wed", Ecoland: 420, Lanang: 310, Torres: 580 },
    { day: "Fri", Ecoland: 380, Lanang: 280, Torres: 500 },
    { day: "Sun", Ecoland: 250, Lanang: 150, Torres: 300 },
  ],
  revenueOutstanding: [
    { category: "Collected", value: 486000, color: STYLES.emerald.fill },
    { category: "Pending", value: 45000, color: STYLES.amber.fill },
    { category: "Overdue", value: 25000, color: STYLES.rose.fill },
  ],
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-background/95 p-3 shadow-xl backdrop-blur-md">
        <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <p className="text-sm font-medium text-foreground">
                {entry.name}: <span className="font-bold">{entry.value}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// --- COMPONENTS ---

export function AttendanceHeatmap() {
  const maxVal = 100;
  const branches = ["Ecoland", "Lanang", "Torres"];

  const getHeatColor = (value: number) => {
    // amber scale
    const opacity = Math.max(0.1, value / maxVal);
    return `rgba(245, 158, 11, ${opacity})`;
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-[500px]">
        {/* Header Row */}
        <div className="flex mb-2">
          <div className="w-20 shrink-0 text-xs text-muted-foreground uppercase tracking-widest font-semibold" />
          {MOCK_CHART_DATA.heatmap.map((col) => (
            <div key={col.time} className="flex-1 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {col.time}
            </div>
          ))}
        </div>

        {/* Heatmap Matrix */}
        <div className="space-y-2">
          {branches.map((branch) => (
            <div key={branch} className="flex items-center">
              <div className="w-20 shrink-0 text-xs font-medium text-foreground pr-4 truncate">
                {branch}
              </div>
              {MOCK_CHART_DATA.heatmap.map((col) => {
                const val = col[branch as keyof typeof col] as number;
                return (
                  <div key={`${branch}-${col.time}`} className="flex-1 px-1">
                    <div
                      className="h-12 w-full rounded-lg transition-colors hover:brightness-110 flex items-center justify-center cursor-default group"
                      style={{ backgroundColor: getHeatColor(val) }}
                    >
                      <span className="text-white/0 group-hover:text-white font-bold text-xs transition-colors drop-shadow-md">
                        {val}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChurnRiskDoughnut() {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={MOCK_CHART_DATA.churnRisk}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {MOCK_CHART_DATA.churnRisk.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MemberLifespanChart() {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={MOCK_CHART_DATA.lifespan}>
          <defs>
            <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={STYLES.slate.fill} stopOpacity={0.3} />
              <stop offset="95%" stopColor={STYLES.slate.fill} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#888" }} dy={10} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#888" }} dx={-10} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="members" stroke={STYLES.slate.fill} fillOpacity={1} fill="url(#colorMembers)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PeakHoursChart() {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={MOCK_CHART_DATA.peakHours}>
          <defs>
            <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={STYLES.amber.fill} stopOpacity={0.4} />
              <stop offset="95%" stopColor={STYLES.amber.fill} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#888" }} dy={10} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="natural" dataKey="traffic" stroke={STYLES.amber.fill} fillOpacity={1} fill="url(#colorPeak)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BranchTrafficStack() {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={MOCK_CHART_DATA.branchTraffic}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#888" }} dy={10} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#888" }} dx={-10} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
          <Bar dataKey="Torres" stackId="a" fill={STYLES.rose.fill} radius={[0, 0, 4, 4]} />
          <Bar dataKey="Lanang" stackId="a" fill={STYLES.amber.fill} />
          <Bar dataKey="Ecoland" stackId="a" fill={STYLES.blue.fill} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueOutstandingChart() {
  return (
    <div className="h-[120px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={MOCK_CHART_DATA.revenueOutstanding} layout="vertical">
          <CartesianGrid horizontal={false} vertical={false} />
          <XAxis type="number" hide />
          <YAxis dataKey="category" type="category" hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
          <Bar dataKey="value" radius={8} barSize={40}>
            {MOCK_CHART_DATA.revenueOutstanding.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-6 justify-center mt-6">
        {MOCK_CHART_DATA.revenueOutstanding.map((entry) => (
          <div key={entry.category} className="flex items-center gap-2">
            <div className="size-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">{entry.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
