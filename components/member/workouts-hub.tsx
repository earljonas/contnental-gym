"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus, Play, Search, Trash2, Edit3, Clock, Dumbbell,
  ChevronDown, ChevronRight, Heart, X, CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  type Exercise, getExercises, searchExercises, getBodyParts, getFormTip,
} from "@/lib/exercises";
import { createRoutine, deleteRoutine, updateRoutine } from "@/app/(dashboard)/dashboard/workouts/actions";

/* ─── Types ─── */
interface RoutineExercise {
  id: number;
  exercise_id: string;
  exercise_name: string;
  target_muscle: string;
  default_sets: number;
  default_reps: number;
  default_weight: number;
  sort_order: number;
}

interface Routine {
  id: number;
  name: string;
  days: string[];
  created_at: string;
  routine_exercises: RoutineExercise[];
}

interface Session {
  id: number;
  routine_id: number | null;
  routine_name: string | null;
  started_at: string;
  ended_at: string;
  total_volume: number;
  exercises: ExerciseLog[];
  notes: string | null;
  created_at: string;
}

interface ExerciseLog {
  name: string;
  sets: { weight: number; reps: number }[];
}

interface WorkoutsHubProps {
  routines: Routine[];
  sessions: Session[];
}

const TABS = ["My Routines", "Log History", "Exercise Library"] as const;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ─── Main ─── */
export function WorkoutsHub({ routines, sessions }: WorkoutsHubProps) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("My Routines");
  const [showCreate, setShowCreate] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  const openCreate = () => {
    setEditingRoutine(null);
    setShowCreate(true);
  };

  const openEdit = (routine: Routine) => {
    setEditingRoutine(routine);
    setShowCreate(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground md:text-3xl">
          Workouts
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Routines, history, and exercises
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 rounded-2xl border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-xl px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all",
              tab === t
                ? "bg-[#C9973E] text-black"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "My Routines" && (
        <RoutinesTab routines={routines} onCreateOpen={openCreate} onEdit={openEdit} />
      )}
      {tab === "Log History" && <HistoryTab sessions={sessions} />}
      {tab === "Exercise Library" && <LibraryTab />}

      <CreateRoutineSheet 
        open={showCreate} 
        onClose={() => setShowCreate(false)} 
        editingRoutine={editingRoutine} 
      />
    </div>
  );
}

/* ═══════════════ Tab 1: My Routines ═══════════════ */
function RoutinesTab({ routines, onCreateOpen, onEdit }: { routines: Routine[]; onCreateOpen: () => void; onEdit: (r: Routine) => void }) {
  return (
    <div className="space-y-4">
      <button
        onClick={onCreateOpen}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-4 text-[12px] font-semibold uppercase tracking-wider text-foreground transition-all hover:bg-muted active:scale-[0.98]"
      >
        <Plus className="size-4 text-[#C9973E]" />
        Create Routine
      </button>

      {routines.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <Dumbbell className="mb-3 size-8 text-muted-foreground/50" />
          <p className="font-display text-lg font-black uppercase tracking-tight text-foreground">
            No routines yet
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Create your first routine to get started
          </p>
        </div>
      ) : (
        routines.map((r) => <RoutineCard key={r.id} routine={r} onEdit={onEdit} />)
      )}
    </div>
  );
}

function RoutineCard({ routine, onEdit }: { routine: Routine; onEdit: (r: Routine) => void }) {
  const [deleting, setDeleting] = useState(false);
  const exCount = routine.routine_exercises.length;
  const estMins = exCount * 8;

  async function handleDelete() {
    if (!confirm("Delete this routine?")) return;
    setDeleting(true);
    try {
      await deleteRoutine(routine.id);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-display text-base font-black uppercase tracking-tight text-foreground">
            {routine.name}
          </h3>
          {routine.days.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {routine.days.map((d) => (
                <span
                  key={d}
                  className="rounded-full bg-[#C9973E]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#C9973E]"
                >
                  {d}
                </span>
              ))}
            </div>
          )}
          <p className="mt-2 text-[12px] text-muted-foreground">
            {exCount} exercise{exCount !== 1 ? "s" : ""} · ~{estMins} min
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(routine)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Edit3 className="size-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-red-500"
          >
            <Trash2 className="size-4" />
          </button>
          <Link
            href={`/dashboard/session?routineId=${routine.id}`}
            className="flex items-center gap-1.5 rounded-xl bg-[#C9973E] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-black transition-all hover:bg-[#B8882F] active:scale-[0.97]"
          >
            <Play className="size-3.5" />
            Start
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Tab 2: Log History ═══════════════ */
function HistoryTab({ sessions }: { sessions: Session[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
        <CalendarCheck className="mb-3 size-8 text-muted-foreground/50" />
        <p className="font-display text-lg font-black uppercase tracking-tight text-foreground">
          No sessions logged
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Complete your first workout to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => {
        const isOpen = expanded === s.id;
        const start = new Date(s.started_at);
        const end = new Date(s.ended_at);
        const durMin = Math.round((end.getTime() - start.getTime()) / 60000);
        const exArr = Array.isArray(s.exercises) ? s.exercises : [];

        return (
          <div key={s.id} className="rounded-2xl border border-border bg-card">
            <button
              onClick={() => setExpanded(isOpen ? null : s.id)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <div>
                <p className="text-[13px] font-medium text-foreground">
                  {start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {s.routine_name ?? "Quick Session"} · {durMin}m · {s.total_volume}kg · {exArr.length} ex
                </p>
              </div>
              <ChevronDown
                className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
              />
            </button>
            {isOpen && (
              <div className="border-t border-border px-4 py-3 space-y-2">
                {exArr.map((ex, i) => (
                  <div key={i} className="text-[12px]">
                    <span className="font-medium text-foreground">{ex.name}</span>
                    <span className="text-muted-foreground">
                      {" — "}
                      {ex.sets?.map((set: { weight: number; reps: number }, j: number) => (
                        <span key={j}>
                          {set.weight}kg×{set.reps}
                          {j < ex.sets.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════ Tab 3: Exercise Library ═══════════════ */
function LibraryTab() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState("");
  const [bodyPart, setBodyPart] = useState("all");
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [results, setResults] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getExercises().then((data) => {
      setExercises(data);
      setBodyParts(getBodyParts(data));
      setResults(data.slice(0, 30));
      const saved = localStorage.getItem("fav_exercises");
      if (saved) setFavIds(new Set(JSON.parse(saved)));
    });
  }, []);

  useEffect(() => {
    if (exercises.length) {
      setResults(searchExercises(exercises, query, bodyPart));
    }
  }, [query, bodyPart, exercises]);

  const toggleFav = useCallback((id: string) => {
    setFavIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem("fav_exercises", JSON.stringify([...next]));
      return next;
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 rounded-xl pl-9"
          />
        </div>
        <select
          value={bodyPart}
          onChange={(e) => setBodyPart(e.target.value)}
          className="h-10 rounded-xl border border-input bg-transparent px-3 text-[12px] text-foreground"
        >
          <option value="all">All Muscles</option>
          {bodyParts.map((bp) => (
            <option key={bp} value={bp}>
              {bp.charAt(0).toUpperCase() + bp.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <Search className="mb-3 size-8 text-muted-foreground/50" />
          <p className="font-display text-lg font-black uppercase tracking-tight text-foreground">
            No exercises found
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Try a different search term or filter
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelected(ex)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:bg-muted active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C9973E]/10">
                <Dumbbell className="size-5 text-[#C9973E]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-[13px] font-medium text-foreground">
                  {ex.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {ex.primaryMuscles.join(", ")} · {ex.equipment}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFav(ex.id);
                }}
                className="shrink-0 p-1"
              >
                <Heart
                  className={cn(
                    "size-4",
                    favIds.has(ex.id)
                      ? "fill-[#C9973E] text-[#C9973E]"
                      : "text-muted-foreground",
                  )}
                />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Exercise Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-lg font-black uppercase tracking-tight">
                  {selected.name}
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6">
                <div className="flex flex-wrap gap-2">
                  {selected.primaryMuscles.map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-[#C9973E]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#C9973E]"
                    >
                      {m}
                    </span>
                  ))}
                  <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {selected.equipment}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {selected.level}
                  </span>
                </div>
                {selected.instructions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                      Instructions
                    </p>
                    <ol className="space-y-1.5 text-[13px] text-foreground">
                      {selected.instructions.map((inst, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="shrink-0 text-[#C9973E]">{i + 1}.</span>
                          {inst}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                <Link
                  href={`/dashboard/session?exerciseId=${selected.id}&exerciseName=${encodeURIComponent(selected.name)}&muscle=${encodeURIComponent(selected.primaryMuscles[0] ?? "")}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9973E] px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-black transition-all hover:bg-[#B8882F] active:scale-[0.98]"
                >
                  <Play className="size-4" />
                  Log This Now
                </Link>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ═══════════════ Create/Edit Routine Sheet ═══════════════ */
function CreateRoutineSheet({ open, onClose, editingRoutine }: { open: boolean; onClose: () => void; editingRoutine?: Routine | null }) {
  const [name, setName] = useState("");
  const [days, setDays] = useState<string[]>([]);
  const [addedExercises, setAddedExercises] = useState<
    { exercise_id: string; exercise_name: string; target_muscle: string; default_sets: number; default_reps: number; default_weight: number }[]
  >([]);
  const [searchQ, setSearchQ] = useState("");
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) getExercises().then(setAllExercises);
  }, [open]);

  useEffect(() => {
    if (open && editingRoutine) {
      setName(editingRoutine.name);
      setDays(editingRoutine.days);
      setAddedExercises(
        [...editingRoutine.routine_exercises].sort((a, b) => a.sort_order - b.sort_order).map((ex) => ({
          exercise_id: ex.exercise_id,
          exercise_name: ex.exercise_name,
          target_muscle: ex.target_muscle ?? "",
          default_sets: ex.default_sets,
          default_reps: ex.default_reps,
          default_weight: ex.default_weight,
        }))
      );
    } else if (open && !editingRoutine) {
      setName("");
      setDays([]);
      setAddedExercises([]);
    }
  }, [open, editingRoutine]);

  useEffect(() => {
    if (allExercises.length) {
      setSearchResults(searchExercises(allExercises, searchQ).slice(0, 10));
    }
  }, [searchQ, allExercises]);

  function addExercise(ex: Exercise) {
    if (addedExercises.some((a) => a.exercise_id === ex.id)) return;
    setAddedExercises((prev) => [
      ...prev,
      {
        exercise_id: ex.id,
        exercise_name: ex.name,
        target_muscle: ex.primaryMuscles[0] ?? "",
        default_sets: 3,
        default_reps: 10,
        default_weight: 0,
      },
    ]);
    setSearchQ("");
  }

  function removeExercise(id: string) {
    setAddedExercises((prev) => prev.filter((e) => e.exercise_id !== id));
  }

  async function handleSave() {
    if (!name.trim() || addedExercises.length === 0) return;
    setSaving(true);
    try {
      if (editingRoutine) {
        await updateRoutine(editingRoutine.id, { name: name.trim(), days, exercises: addedExercises });
      } else {
        await createRoutine({ name: name.trim(), days, exercises: addedExercises });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="font-display text-lg font-black uppercase tracking-tight">
            {editingRoutine ? "Edit Routine" : "Create Routine"}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-6">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Routine Name
            </label>
            <Input
              placeholder="e.g. PPL — Push Day"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>

          {/* Days */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Days
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() =>
                    setDays((prev) =>
                      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
                    )
                  }
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all",
                    days.includes(d)
                      ? "bg-[#C9973E] text-black"
                      : "border border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Add Exercises */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Add Exercises
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="h-10 rounded-xl pl-9"
              />
            </div>
            {searchQ && searchResults.length > 0 && (
              <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border bg-card p-2">
                {searchResults.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => addExercise(ex)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] hover:bg-muted"
                  >
                    <Plus className="size-3.5 shrink-0 text-[#C9973E]" />
                    <span className="truncate text-foreground">{ex.name}</span>
                    <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                      {ex.primaryMuscles[0]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Added exercises list */}
          {addedExercises.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Exercises ({addedExercises.length})
              </p>
              {addedExercises.map((ex, i) => (
                <div
                  key={ex.exercise_id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <span className="text-[11px] font-bold text-[#C9973E]">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {ex.exercise_name}
                    </p>
                    <div className="mt-1 flex gap-2">
                      <input
                        type="number"
                        value={ex.default_sets}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 1;
                          setAddedExercises((prev) =>
                            prev.map((x) =>
                              x.exercise_id === ex.exercise_id ? { ...x, default_sets: v } : x,
                            ),
                          );
                        }}
                        className="h-7 w-14 rounded-lg border border-input bg-transparent px-2 text-center text-[12px]"
                        min={1}
                      />
                      <span className="self-center text-[11px] text-muted-foreground">sets ×</span>
                      <input
                        type="number"
                        value={ex.default_reps}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 1;
                          setAddedExercises((prev) =>
                            prev.map((x) =>
                              x.exercise_id === ex.exercise_id ? { ...x, default_reps: v } : x,
                            ),
                          );
                        }}
                        className="h-7 w-14 rounded-lg border border-input bg-transparent px-2 text-center text-[12px]"
                        min={1}
                      />
                      <span className="self-center text-[11px] text-muted-foreground">reps</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeExercise(ex.exercise_id)}
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-red-500"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || addedExercises.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9973E] px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider text-black transition-all hover:bg-[#B8882F] active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? "Saving..." : editingRoutine ? "Save Changes" : "Save Routine"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
