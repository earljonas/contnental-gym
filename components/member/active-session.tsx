"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Check, ChevronRight, Minus, Plus,
  Square, Timer, Trophy, Volume2, X, Dumbbell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { saveSession } from "@/app/(dashboard)/dashboard/session/actions";
import { StickerStats } from "@/components/member/sticker-stats";

/* ─── Types ─── */
interface SessionExercise {
  exercise_id: string;
  exercise_name: string;
  target_muscle: string;
  default_sets: number;
  default_reps: number;
  default_weight: number;
}

interface SetData {
  weight: number;
  reps: number;
  done: boolean;
}

interface ExerciseState {
  name: string;
  target: string;
  sets: SetData[];
}

interface ActiveSessionProps {
  routineId: number | null;
  routineName: string | null;
  initialExercises: SessionExercise[];
}

/* ─── Helpers ─── */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => ctx.close(), 300);
  } catch {}
  try { navigator.vibrate?.(200); } catch {}
}

/* ─── Rest Timer Ring ─── */
function RestTimerOverlay({
  duration, onDismiss,
}: {
  duration: number;
  onDismiss: () => void;
}) {
  const [left, setLeft] = useState(duration);
  const [adjDuration, setAdjDuration] = useState(duration);

  useEffect(() => {
    setLeft(adjDuration);
  }, [adjDuration]);

  useEffect(() => {
    if (left <= 0) { playBeep(); onDismiss(); return; }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onDismiss]);

  const size = 180;
  const sw = 10;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const progress = left / adjDuration;
  const offset = circ * (1 - progress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Rest Timer
        </p>
        <div className="relative inline-flex items-center justify-center">
          <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} className="-rotate-90">
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={sw} className="text-muted-foreground/20" />
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#C9973E" strokeWidth={sw} strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-1000 ease-linear" />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-display text-4xl font-black text-foreground">{left}</span>
            <span className="text-[11px] text-muted-foreground">seconds</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setAdjDuration((d) => Math.max(15, d - 15))}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground">
            <Minus className="size-4" />
          </button>
          <span className="text-[13px] font-medium text-muted-foreground">{adjDuration}s</span>
          <button onClick={() => setAdjDuration((d) => d + 15)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground">
            <Plus className="size-4" />
          </button>
        </div>
        <button onClick={onDismiss}
          className="rounded-xl border border-border px-6 py-3 text-[12px] font-semibold uppercase tracking-wider text-foreground transition-all hover:bg-muted">
          Skip Rest
        </button>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export function ActiveSession({ routineId, routineName, initialExercises }: ActiveSessionProps) {
  const router = useRouter();
  const startTimeRef = useRef(new Date());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [elapsed, setElapsed] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [exercises, setExercises] = useState<ExerciseState[]>(() =>
    initialExercises.length > 0
      ? initialExercises.map((e) => ({
          name: e.exercise_name,
          target: e.target_muscle,
          sets: Array.from({ length: e.default_sets }, () => ({
            weight: e.default_weight,
            reps: e.default_reps,
            done: false,
          })),
        }))
      : [{ name: "Quick Exercise", target: "", sets: [{ weight: 0, reps: 10, done: false }] }],
  );
  const [showRest, setShowRest] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSticker, setShowSticker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exerciseDetail, setExerciseDetail] = useState(false);

  // Stopwatch
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const current = exercises[currentIdx];
  const totalVolume = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.done).reduce((a, s) => a + s.weight * s.reps, 0), 0,
  );

  // Set operations
  function updateSet(setIdx: number, field: "weight" | "reps", value: number) {
    setExercises((prev) => prev.map((ex, ei) =>
      ei === currentIdx
        ? { ...ex, sets: ex.sets.map((s, si) => (si === setIdx ? { ...s, [field]: value } : s)) }
        : ex,
    ));
  }

  function completeSet(setIdx: number) {
    setExercises((prev) => prev.map((ex, ei) =>
      ei === currentIdx
        ? { ...ex, sets: ex.sets.map((s, si) => (si === setIdx ? { ...s, done: true } : s)) }
        : ex,
    ));
    setShowRest(true);
  }

  function addSet() {
    const last = current.sets[current.sets.length - 1];
    setExercises((prev) => prev.map((ex, ei) =>
      ei === currentIdx
        ? { ...ex, sets: [...ex.sets, { weight: last?.weight ?? 0, reps: last?.reps ?? 10, done: false }] }
        : ex,
    ));
  }

  function nextExercise() {
    if (currentIdx < exercises.length - 1) setCurrentIdx((i) => i + 1);
    else setShowSummary(true);
  }

  function handleBack() {
    if (confirm("Leave session? Progress will be lost.")) router.push("/dashboard");
  }

  // Save
  const handleSave = useCallback(async () => {
    setSaving(true);
    const endTime = new Date();
    try {
      await saveSession({
        routine_id: routineId,
        routine_name: routineName,
        started_at: startTimeRef.current.toISOString(),
        ended_at: endTime.toISOString(),
        total_volume: totalVolume,
        exercises: exercises.map((ex) => ({
          name: ex.name,
          sets: ex.sets.filter((s) => s.done).map((s) => ({ weight: s.weight, reps: s.reps })),
        })),
        notes: null,
      });
      setShowSummary(false);
      setShowSticker(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [exercises, routineId, routineName, totalVolume]);

  const completedExCount = exercises.filter((e) => e.sets.some((s) => s.done)).length;
  const durationMin = Math.floor(elapsed / 60);

  // Sticker stats overlay
  if (showSticker) {
    return (
      <StickerStats
        duration={formatTime(elapsed)}
        volume={totalVolume}
        exerciseCount={completedExCount}
        onDone={() => router.push("/dashboard/workouts")}
      />
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Header Bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <button onClick={handleBack} className="rounded-lg p-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <Volume2 className="size-3.5" />
            {totalVolume.toLocaleString()}kg
          </span>
          <span>{currentIdx + 1} / {exercises.length}</span>
        </div>
        <button onClick={() => setShowSummary(true)}
          className="rounded-xl bg-[#C9973E] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-black">
          Finish
        </button>
      </div>

      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
        {/* Stopwatch */}
        <div className="text-center">
          <p className="font-display text-5xl font-black tracking-tight text-foreground">
            {formatTime(elapsed)}
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Session Time
          </p>
        </div>

        {/* Current Exercise */}
        <button onClick={() => setExerciseDetail(true)} className="w-full text-center">
          <p className="font-display text-2xl font-black uppercase tracking-tight text-foreground md:text-3xl">
            {current.name}
          </p>
          {current.target && (
            <p className="mt-1 text-[12px] text-[#C9973E]">{current.target} ›</p>
          )}
        </button>

        {/* Set Tracker */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-4 border-b border-border px-4 py-2.5">
            {["Set", "KG", "Reps", ""].map((h) => (
              <span key={h} className="text-center text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                {h}
              </span>
            ))}
          </div>
          {current.sets.map((set, i) => (
            <div key={i}
              className={cn("grid grid-cols-4 items-center border-b border-border px-4 py-3 last:border-b-0",
                set.done && "bg-emerald-500/5")}>
              <span className={cn("text-center text-[13px] font-medium",
                set.done ? "text-emerald-500 line-through" : "text-foreground")}>
                {i + 1}
              </span>
              <div className="flex justify-center">
                <input type="number" value={set.weight}
                  onChange={(e) => updateSet(i, "weight", parseFloat(e.target.value) || 0)}
                  disabled={set.done}
                  className={cn("h-8 w-16 rounded-lg border border-input bg-transparent text-center text-[13px]",
                    set.done && "line-through opacity-50")} />
              </div>
              <div className="flex justify-center">
                <input type="number" value={set.reps}
                  onChange={(e) => updateSet(i, "reps", parseInt(e.target.value) || 0)}
                  disabled={set.done}
                  className={cn("h-8 w-16 rounded-lg border border-input bg-transparent text-center text-[13px]",
                    set.done && "line-through opacity-50")} />
              </div>
              <div className="flex justify-center">
                {set.done ? (
                  <Check className="size-5 text-emerald-500" />
                ) : (
                  <button onClick={() => completeSet(i)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors hover:border-emerald-500 hover:text-emerald-500">
                    <Check className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          <button onClick={addSet}
            className="flex w-full items-center justify-center gap-1.5 border-t border-border py-3 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground">
            <Plus className="size-3.5" /> Add Set
          </button>
        </div>

        {/* Next Exercise */}
        <button onClick={nextExercise}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-4 text-[12px] font-semibold uppercase tracking-wider text-foreground transition-all hover:bg-muted active:scale-[0.98]">
          {currentIdx < exercises.length - 1 ? (
            <><ChevronRight className="size-4" /> Next Exercise</>
          ) : (
            <><Square className="size-4" /> Finish Workout</>
          )}
        </button>
      </div>

      {/* Rest Timer */}
      {showRest && <RestTimerOverlay duration={90} onDismiss={() => setShowRest(false)} />}

      {/* Exercise Detail Sheet */}
      <Sheet open={exerciseDetail} onOpenChange={setExerciseDetail}>
        <SheetContent side="bottom" className="max-h-[60vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="font-display text-lg font-black uppercase tracking-tight">
              {current.name}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-3 px-4 pb-6">
            {current.target && (
              <span className="inline-flex rounded-full bg-[#C9973E]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#C9973E]">
                {current.target}
              </span>
            )}
            <p className="text-[13px] text-muted-foreground">
              Focus on controlled movement through full range of motion.
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Summary Sheet */}
      <Sheet open={showSummary} onOpenChange={setShowSummary}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="font-display text-lg font-black uppercase tracking-tight">
              Session Complete
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-5 px-4 pb-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Duration", value: formatTime(elapsed), icon: Timer },
                { label: "Volume", value: `${totalVolume.toLocaleString()}kg`, icon: Volume2 },
                { label: "Exercises", value: String(completedExCount), icon: Dumbbell },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center rounded-2xl border border-border bg-card p-4">
                  <stat.icon className="mb-2 size-5 text-[#C9973E]" />
                  <span className="font-display text-xl font-black text-foreground">{stat.value}</span>
                  <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {exercises.filter((e) => e.sets.some((s) => s.done)).map((ex, i) => (
                <div key={i} className="rounded-xl border border-border bg-card px-4 py-3">
                  <p className="text-[13px] font-medium text-foreground">{ex.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {ex.sets.filter((s) => s.done).map((s, j) => (
                      <span key={j}>{s.weight}kg×{s.reps}{j < ex.sets.filter((s2) => s2.done).length - 1 ? " · " : ""}</span>
                    ))}
                  </p>
                </div>
              ))}
            </div>
            <button onClick={handleSave} disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9973E] px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider text-black transition-all hover:bg-[#B8882F] active:scale-[0.98] disabled:opacity-50">
              {saving ? "Saving..." : "Save Session"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
