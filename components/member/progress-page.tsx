"use client";

import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Trophy, TrendingUp, Calendar, Plus, X,
  ChevronLeft, ChevronRight, Award, Lock, Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { addBodyMetric } from "@/app/(dashboard)/dashboard/progress/actions";

/* ─── Types ─── */
interface SessionData {
  id: number;
  routine_name: string | null;
  started_at: string;
  ended_at: string;
  total_volume: number;
  exercises: { name: string; sets: { weight: number; reps: number }[] }[];
  created_at: string;
}

interface BodyMetric {
  id: number;
  logged_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  arm_cm: number | null;
  leg_cm: number | null;
}

interface ProgressPageProps {
  sessions: SessionData[];
  bodyMetrics: BodyMetric[];
  totalAttendance: number;
  initialPersonalRecords?: PersonalRecord[];
}

type PersonalRecord = {
  name: string;
  weight: number;
  reps: number;
  date: string;
  history: { weight: number; reps: number; date: string }[];
};

/* ─── Achievements ─── */
const ACHIEVEMENTS = [
  { id: "first_session", name: "First Session", desc: "Complete your first workout", tier: "bronze", icon: "🥇", req: (s: number) => s >= 1 },
  { id: "10_sessions", name: "10 Sessions", desc: "Complete 10 workouts", tier: "silver", icon: "🔟", req: (s: number) => s >= 10 },
  { id: "100_sessions", name: "100 Sessions", desc: "Complete 100 workouts", tier: "gold", icon: "💯", req: (s: number) => s >= 100 },
  { id: "first_pr", name: "First PR", desc: "Set your first personal record", tier: "bronze", icon: "🏆", req: (_s: number, prs: number) => prs >= 1 },
  { id: "10k_volume", name: "10K Volume", desc: "Move 10,000 kg total", tier: "silver", icon: "🏋️", req: (_s: number, _p: number, vol: number) => vol >= 10000 },
  { id: "50k_volume", name: "50K Volume", desc: "Move 50,000 kg total", tier: "gold", icon: "💪", req: (_s: number, _p: number, vol: number) => vol >= 50000 },
] as const;

const TIER_COLORS: Record<string, string> = {
  bronze: "from-amber-700 to-amber-900",
  silver: "from-zinc-400 to-zinc-600",
  gold: "from-[#C9973E] to-[#8B6914]",
};

/* ─── Chart tooltip ─── */
function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-[12px]">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{payload[0].value.toLocaleString()}</p>
    </div>
  );
}

/* ─── Main ─── */
export function ProgressPage({ sessions, bodyMetrics, totalAttendance, initialPersonalRecords = [] }: ProgressPageProps) {
  const [chartIdx, setChartIdx] = useState(0);
  const [volumeRange, setVolumeRange] = useState<30 | 90>(30);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [showMetricSheet, setShowMetricSheet] = useState(false);
  const [prDetail, setPrDetail] = useState<string | null>(null);

  // ── Derived data ──
  const exerciseNames = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) =>
      (s.exercises ?? []).forEach((ex) => set.add(ex.name)),
    );
    return Array.from(set).sort();
  }, [sessions]);

  // Volume over time
  const volumeData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - volumeRange);
    return sessions
      .filter((s) => new Date(s.started_at) >= cutoff)
      .map((s) => ({
        date: new Date(s.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        volume: Math.round(s.total_volume),
      }));
  }, [sessions, volumeRange]);

  // Strength progression for selected exercise
  const strengthData = useMemo(() => {
    if (!selectedExercise) return [];
    return sessions
      .filter((s) => (s.exercises ?? []).some((e) => e.name === selectedExercise))
      .map((s) => {
        const ex = (s.exercises ?? []).find((e) => e.name === selectedExercise);
        const best = ex?.sets?.reduce((max, set) => Math.max(max, set.weight), 0) ?? 0;
        return {
          date: new Date(s.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          weight: best,
        };
      });
  }, [sessions, selectedExercise]);

  const strengthInsight = useMemo(() => {
    if (strengthData.length < 2) return null;
    const first = strengthData[0].weight;
    const last = strengthData[strengthData.length - 1].weight;
    const diff = last - first;
    if (diff <= 0) return null;
    const weeks = Math.max(1, Math.round(strengthData.length / 2));
    return `+${diff}kg in ~${weeks} weeks`;
  }, [strengthData]);

  // Frequency: sessions per week for last 8 weeks
  const frequencyData = useMemo(() => {
    const weeks: { label: string; sessions: number }[] = [];
    const now = new Date();
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - w * 7 - now.getDay() + 1);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const count = sessions.filter((s) => {
        const d = new Date(s.started_at);
        return d >= weekStart && d < weekEnd;
      }).length;
      weeks.push({
        label: `W${8 - w}`,
        sessions: count,
      });
    }
    return weeks;
  }, [sessions]);

  // Personal Records
  const personalRecords = useMemo(() => {
    if (initialPersonalRecords.length > 0) return initialPersonalRecords;
    const prs: Record<string, { weight: number; reps: number; date: string; history: { weight: number; reps: number; date: string }[] }> = {};
    sessions.forEach((s) => {
      (s.exercises ?? []).forEach((ex) => {
        (ex.sets ?? []).forEach((set) => {
          const vol = set.weight * set.reps;
          if (!prs[ex.name]) {
            prs[ex.name] = { weight: set.weight, reps: set.reps, date: s.started_at, history: [] };
          }
          prs[ex.name].history.push({ weight: set.weight, reps: set.reps, date: s.started_at });
          const currentVol = prs[ex.name].weight * prs[ex.name].reps;
          if (vol > currentVol) {
            prs[ex.name].weight = set.weight;
            prs[ex.name].reps = set.reps;
            prs[ex.name].date = s.started_at;
          }
        });
      });
    });
    return Object.entries(prs)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [initialPersonalRecords, sessions]);

  const totalVolume = sessions.reduce((s, sess) => s + sess.total_volume, 0);

  // Body metric chart data
  const bodyChartData = useMemo(() => {
    return bodyMetrics.map((m) => ({
      date: new Date(m.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      weight: m.weight_kg,
      fat: m.body_fat_pct,
    }));
  }, [bodyMetrics]);

  // Achievements
  const achievementStatus = useMemo(() => {
    return ACHIEVEMENTS.map((a) => ({
      ...a,
      earned: a.req(sessions.length, personalRecords.length, totalVolume),
    }));
  }, [sessions.length, personalRecords.length, totalVolume]);

  const CHARTS = ["Volume", "Strength", "Frequency"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground md:text-3xl">
          Progress
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Charts, records, and achievements
        </p>
      </div>

      {/* ═══ Section 1: Performance Charts ═══ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Performance
          </p>
          <div className="flex items-center gap-1">
            {CHARTS.map((c, i) => (
              <button
                key={c}
                onClick={() => setChartIdx(i)}
                className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all",
                  chartIdx === i
                    ? "bg-[#C9973E] text-black"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          {/* Volume Chart */}
          {chartIdx === 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-display text-base font-black uppercase tracking-tight text-foreground">
                  Volume Over Time
                </p>
                <div className="flex gap-1">
                  {([30, 90] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setVolumeRange(d)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wider transition-all",
                        volumeRange === d
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {d}D
                    </button>
                  ))}
                </div>
              </div>
              {volumeData.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-muted-foreground">No session data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={40} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="volume" stroke="#C9973E" strokeWidth={2} dot={{ r: 3, fill: "#C9973E" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Strength Chart */}
          {chartIdx === 1 && (
            <div>
              <p className="mb-3 font-display text-base font-black uppercase tracking-tight text-foreground">
                Strength Progression
              </p>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="mb-3 h-9 w-full rounded-xl border border-input bg-transparent px-3 text-[12px] text-foreground"
              >
                <option value="">Select exercise...</option>
                {exerciseNames.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              {strengthData.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-muted-foreground">
                  {selectedExercise ? "No data for this exercise" : "Select an exercise above"}
                </p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={strengthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={40} unit="kg" />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="weight" stroke="#C9973E" strokeWidth={2} dot={{ r: 3, fill: "#C9973E" }} />
                    </LineChart>
                  </ResponsiveContainer>
                  {strengthInsight && (
                    <p className="mt-2 text-center text-[12px] font-medium text-[#C9973E]">
                      <TrendingUp className="mr-1 inline size-3.5" />
                      {strengthInsight}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Frequency Chart */}
          {chartIdx === 2 && (
            <div>
              <p className="mb-3 font-display text-base font-black uppercase tracking-tight text-foreground">
                Workout Frequency
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={frequencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={30} allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="sessions" fill="#C9973E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Section 2: Personal Records ═══ */}
      <div className="space-y-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Personal Records
        </p>
        {personalRecords.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <Trophy className="mb-3 size-8 text-muted-foreground/50" />
            <p className="font-display text-lg font-black uppercase tracking-tight text-foreground">No PRs yet</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Complete workouts to set records</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {personalRecords.slice(0, 8).map((pr) => (
              <button
                key={pr.name}
                onClick={() => setPrDetail(pr.name)}
                className="flex flex-col rounded-2xl border border-border bg-card p-4 text-left transition-all hover:bg-muted active:scale-[0.98]"
              >
                <Trophy className="mb-2 size-4 text-[#C9973E]" />
                <p className="truncate text-[13px] font-medium text-foreground">{pr.name}</p>
                <p className="mt-0.5 font-display text-lg font-black text-foreground">
                  {pr.weight}kg<span className="text-muted-foreground">×{pr.reps}</span>
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(pr.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* PR Detail Sheet */}
      <Sheet open={!!prDetail} onOpenChange={() => setPrDetail(null)}>
        <SheetContent side="bottom" className="max-h-[60vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="font-display text-lg font-black uppercase tracking-tight">{prDetail}</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 px-4 pb-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">History</p>
            {prDetail &&
              personalRecords
                .find((p) => p.name === prDetail)
                ?.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((h, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                    <span className="text-[13px] font-medium text-foreground">{h.weight}kg × {h.reps}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══ Section 3: Body Metrics ═══ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Body Metrics
          </p>
          <button
            onClick={() => setShowMetricSheet(true)}
            className="flex items-center gap-1.5 rounded-full bg-[#C9973E] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-black transition-all hover:bg-[#B8882F] active:scale-[0.97]"
          >
            <Plus className="size-3" />
            Add
          </button>
        </div>

        {bodyMetrics.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <Scale className="mb-3 size-8 text-muted-foreground/50" />
            <p className="font-display text-lg font-black uppercase tracking-tight text-foreground">No measurements</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Track your body composition over time</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={bodyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={40} />
                <Tooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="weight" stroke="#C9973E" strokeWidth={2} dot={{ r: 3, fill: "#C9973E" }} name="Weight (kg)" />
                <Line type="monotone" dataKey="fat" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 4" name="Body Fat %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Body Metric Sheet */}
      <AddMetricSheet open={showMetricSheet} onClose={() => setShowMetricSheet(false)} />

      {/* ═══ Section 4: Achievements ═══ */}
      <div className="space-y-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Achievements
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {achievementStatus.map((a) => (
            <div
              key={a.id}
              className={cn(
                "relative flex flex-col items-center rounded-2xl border p-5 text-center transition-all",
                a.earned
                  ? "border-[#C9973E]/30 bg-card"
                  : "border-border bg-card opacity-40 grayscale",
              )}
            >
              <span className="mb-2 text-2xl">{a.icon}</span>
              <p className="text-[12px] font-medium text-foreground">{a.name}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{a.desc}</p>
              {a.earned && (
                <div className={cn("mt-2 rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white", TIER_COLORS[a.tier])}>
                  {a.tier}
                </div>
              )}
              {!a.earned && <Lock className="absolute right-3 top-3 size-3.5 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ Add Metric Sheet ═══ */
function AddMetricSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    logged_at: new Date().toISOString().split("T")[0],
    weight_kg: "",
    body_fat_pct: "",
    chest_cm: "",
    waist_cm: "",
    arm_cm: "",
    leg_cm: "",
  });

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  async function handleSave() {
    setSaving(true);
    try {
      await addBodyMetric({
        logged_at: form.logged_at,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        body_fat_pct: form.body_fat_pct ? parseFloat(form.body_fat_pct) : null,
        chest_cm: form.chest_cm ? parseFloat(form.chest_cm) : null,
        waist_cm: form.waist_cm ? parseFloat(form.waist_cm) : null,
        arm_cm: form.arm_cm ? parseFloat(form.arm_cm) : null,
        leg_cm: form.leg_cm ? parseFloat(form.leg_cm) : null,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    { key: "weight_kg", label: "Weight (kg)", placeholder: "75" },
    { key: "body_fat_pct", label: "Body Fat %", placeholder: "18" },
    { key: "chest_cm", label: "Chest (cm)", placeholder: "100" },
    { key: "waist_cm", label: "Waist (cm)", placeholder: "80" },
    { key: "arm_cm", label: "Arms (cm)", placeholder: "35" },
    { key: "leg_cm", label: "Legs (cm)", placeholder: "55" },
  ];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="font-display text-lg font-black uppercase tracking-tight">Add Measurement</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Date</label>
            <Input type="date" value={form.logged_at} onChange={(e) => update("logged_at", e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">{f.label}</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={f.placeholder}
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => update(f.key, e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9973E] px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider text-black transition-all hover:bg-[#B8882F] active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Measurement"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
