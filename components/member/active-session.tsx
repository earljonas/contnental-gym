"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronRight, Minus, Plus,
  Timer, Volume2, Dumbbell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  memberId: string;
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
export function ActiveSession({ memberId, routineId, routineName, initialExercises }: ActiveSessionProps) {
  const router = useRouter();
  const startTimeRef = useRef(new Date());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalElapsedRef = useRef<number | null>(null);
  const sessionIdRef = useRef("");
  const savingRef = useRef(false);
  const draftKey = `continental-workout:${memberId}:${routineId ?? initialExercises[0]?.exercise_id ?? "quick"}`;

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
  const [draftReady, setDraftReady] = useState(false);
  const [draftStored, setDraftStored] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [restEnabled, setRestEnabled] = useState(true);

  useEffect(() => {
    let current = true;
    queueMicrotask(() => {
      if (!current) return;
      sessionIdRef.current = crypto.randomUUID();
      try {
        const stored = window.localStorage.getItem(draftKey);
        if (stored) {
          const draft = JSON.parse(stored) as { sessionId: string; startedAt: number; currentIdx: number; exercises: ExerciseState[] };
          if (draft.sessionId && Number.isFinite(draft.startedAt) && Date.now() - draft.startedAt < 86_400_000
            && draft.exercises?.length && Number.isInteger(draft.currentIdx) && draft.currentIdx >= 0
            && draft.currentIdx < draft.exercises.length) {
            sessionIdRef.current = draft.sessionId;
            startTimeRef.current = new Date(draft.startedAt);
            setExercises(draft.exercises);
            setCurrentIdx(draft.currentIdx);
          }
        }
        setDraftStored(true);
      } catch {
        setDraftStored(false);
      }
      setDraftReady(true);
    });
    return () => { current = false; };
  }, [draftKey]);

  useEffect(() => {
    if (!draftReady || showSticker) return;
    let current = true;
    queueMicrotask(() => {
      if (!current) return;
      try {
        window.localStorage.setItem(draftKey, JSON.stringify({
          sessionId: sessionIdRef.current, startedAt: startTimeRef.current.getTime(), currentIdx, exercises,
        }));
        setDraftStored(true);
      } catch {
        setDraftStored(false);
      }
    });
    return () => { current = false; };
  }, [draftKey, draftReady, currentIdx, exercises, showSticker]);

  // Stopwatch – stop when session is finished
  useEffect(() => {
    if (showSummary || showSticker) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [showSummary, showSticker]);

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
    if (restEnabled) setShowRest(true);
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
    else {
      finalElapsedRef.current = elapsed;
      setShowSummary(true);
    }
  }

  // Also capture elapsed when Finish button is pressed directly
  function handleFinish() {
    finalElapsedRef.current = elapsed;
    setShowSummary(true);
  }

  function handleBack() {
    if (draftStored || confirm("Leave this workout without a saved draft?")) router.push("/dashboard/workouts");
  }

  // Save
  const handleSave = useCallback(async () => {
    if (!draftReady || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError("");
    const endTime = new Date();
    try {
      await saveSession({
        sessionId: sessionIdRef.current,
        routine_id: routineId,
        routine_name: routineName,
        started_at: startTimeRef.current.toISOString(),
        ended_at: endTime.toISOString(),
        exercises: exercises.map((ex) => ({
          name: ex.name,
          sets: ex.sets.filter((s) => s.done).map((s) => ({ weight: s.weight, reps: s.reps })),
        })),
        notes: null,
      });
      try { window.localStorage.removeItem(draftKey); } catch { /* The session is already saved. */ }
      setShowSummary(false);
      setShowSticker(true);
    } catch {
      setSaveError("Could not save the workout. Your sets are still here. Try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [draftKey, draftReady, exercises, routineId, routineName]);

  const completedExCount = exercises.filter((e) => e.sets.some((s) => s.done)).length;
  const displayElapsed = finalElapsedRef.current ?? elapsed;

  // Stable callback for rest timer dismiss
  const dismissRest = useCallback(() => setShowRest(false), []);

  // Sticker stats overlay
  if (showSticker) {
    const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.done).length, 0);
    const targetMuscles = [...new Set(exercises.filter((e) => e.sets.some((s) => s.done)).map((e) => e.target).filter(Boolean))];
    return (
      <StickerStats
        duration={formatTime(displayElapsed)}
        volume={totalVolume}
        exerciseCount={completedExCount}
        totalSets={totalSets}
        routineName={routineName}
        targetMuscles={targetMuscles}
        onDone={() => router.push("/dashboard/workouts")}
      />
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Header Bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <button onClick={handleBack} aria-label="Back to workouts" className="min-h-11 min-w-11 rounded-lg p-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <Volume2 className="size-3.5" />
            {totalVolume.toLocaleString()}kg
          </span>
          <span>{currentIdx + 1} / {exercises.length}</span>
        </div>
        <button onClick={handleFinish} disabled={!completedExCount || !draftReady}
          className="min-h-11 rounded-xl disabled:opacity-50 bg-[#C9973E] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-black">
          Finish
        </button>
      </div>

      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
        {/* Stopwatch */}
        <div className="text-center">
          <p className="font-display text-5xl font-black tracking-tight text-foreground">
            {formatTime(displayElapsed)}
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Session time
          </p>
          <p className="mt-1 text-xs text-muted-foreground" role="status">{draftReady && (draftStored ? "Draft saved on this device" : "Draft storage unavailable")}</p>
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
          <div className="grid grid-cols-[.55fr_1fr_1fr_1.2fr] border-b border-border px-2 py-2.5">
            {["Set", "KG", "Reps", ""].map((h) => (
              <span key={h} className="text-center text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                {h}
              </span>
            ))}
          </div>
          {current.sets.map((set, i) => (
            <div key={i}
              className={cn("grid grid-cols-[.55fr_1fr_1fr_1.2fr] items-center gap-1 border-b border-border px-2 py-2 last:border-b-0",
                set.done && "bg-emerald-500/5")}>
              <span className={cn("text-center text-[13px] font-medium",
                set.done ? "text-emerald-500 line-through" : "text-foreground")}>
                {i + 1}
              </span>
              <div className="flex justify-center">
                <input type="number" inputMode="decimal" min="0" max="2000" step="0.01" aria-label={`Set ${i + 1} weight in kilograms`} value={set.weight || ""}
                  placeholder="0"
                  onChange={(e) => updateSet(i, "weight", parseFloat(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  disabled={set.done}
                  className={cn("h-11 w-full max-w-16 rounded-lg border border-input bg-transparent text-center text-[13px]",
                    set.done && "line-through opacity-50")} />
              </div>
              <div className="flex justify-center">
                <input type="number" inputMode="numeric" min="1" max="500" aria-label={`Set ${i + 1} repetitions`} value={set.reps || ""}
                  placeholder="0"
                  onChange={(e) => updateSet(i, "reps", parseInt(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  disabled={set.done}
                  className={cn("h-11 w-full max-w-16 rounded-lg border border-input bg-transparent text-center text-[13px]",
                    set.done && "line-through opacity-50")} />
              </div>
              <div className="flex justify-center">
                {set.done ? (
                  <span className="text-xs text-emerald-500">Logged</span>
                ) : (
                  <button onClick={() => completeSet(i)} aria-label={`Log set ${i + 1}`} disabled={!draftReady || set.reps < 1 || set.reps > 500 || set.weight < 0 || set.weight > 2000}
                    className="min-h-11 rounded-lg border border-border px-2 text-xs disabled:opacity-50 hover:border-emerald-500">
                    Log set
                  </button>
                )}
              </div>
            </div>
          ))}
          <button onClick={addSet} disabled={!draftReady || current.sets.length >= 30}
            className="flex w-full items-center justify-center gap-1.5 border-t border-border py-3 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground">
            <Plus className="size-3.5" /> Add Set
          </button>
        </div>

        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={restEnabled} onChange={(event) => setRestEnabled(event.target.checked)} />
          Start a rest timer after logging a set
        </label>
        {currentIdx < exercises.length - 1 && (
          <button onClick={nextExercise} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border">
            <ChevronRight className="size-4" /> Next exercise
          </button>
        )}
      </div>

      {/* Rest Timer */}
      {showRest && <RestTimerOverlay duration={60} onDismiss={dismissRest} />}

      {/* Exercise Detail Sheet */}
      <Sheet open={exerciseDetail} onOpenChange={setExerciseDetail}>
        <SheetContent side="bottom" className="max-h-[60vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="font-display text-lg font-black uppercase tracking-tight">
              {current.name}
            </SheetTitle>
            <SheetDescription>Exercise details and logged sets.</SheetDescription>
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
            <SheetDescription>Review your logged sets before saving.</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-4 pb-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Duration", value: formatTime(displayElapsed), icon: Timer },
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
            {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
            <button onClick={handleSave} disabled={saving || !draftReady}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9973E] px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider text-black transition-all hover:bg-[#B8882F] active:scale-[0.98] disabled:opacity-50">
              {saving ? "Saving…" : saveError ? "Retry save" : "Save session"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
