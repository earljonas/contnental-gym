"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { DistributionPoint, TrendPoint } from "@/lib/super-admin/data";

function formatCompact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function TrendLineChart({
  data,
  strokeClassName,
  fillClassName,
}: {
  data: TrendPoint[];
  strokeClassName?: string;
  fillClassName?: string;
}) {
  const width = 640;
  const height = 240;
  const padding = 24;
  const max = Math.max(...data.map((item) => item.value), 1);

  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y = height - padding - (item.value / max) * (height - padding * 2);
    return { ...item, x, y };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = `${padding},${height - padding} ${polylinePoints} ${width - padding},${height - padding}`;

  return (
    <div className="space-y-4">
      <div className="h-60 w-full overflow-hidden rounded-3xl bg-secondary/60">
        <motion.svg
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full"
        >
          {[0.25, 0.5, 0.75].map((ratio) => {
            const y = height - padding - ratio * (height - padding * 2);
            return (
              <line
                key={ratio}
                x1={padding}
                x2={width - padding}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeDasharray="4 6"
                className="text-border/80"
              />
            );
          })}

          <polygon points={areaPoints} className={cn("text-amber-100/80", fillClassName)} fill="currentColor" />
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("text-amber-500", strokeClassName)}
          />

          {points.map((point) => (
            <circle
              key={point.label}
              cx={point.x}
              cy={point.y}
              r="5"
              fill="currentColor"
              className={cn("text-amber-500", strokeClassName)}
            />
          ))}
        </motion.svg>
      </div>

      <div className={`grid gap-2 text-xs text-muted-foreground ${data.length > 6 ? "grid-cols-7" : "grid-cols-6"}`}>
        {data.map((item) => (
          <div key={item.label} className="space-y-1">
            <p className="font-medium text-foreground">{item.label}</p>
            <p>{formatCompact(item.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DistributionBarChart({ data }: { data: DistributionPoint[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={item.label} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{item.label}</span>
            <span className="text-muted-foreground">{item.value.toLocaleString()}</span>
          </div>
          <div className="h-3 rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ delay: index * 0.06, duration: 0.35 }}
              className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
