export type Exercise = {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
};

let cachedExercises: Exercise[] | null = null;

export async function getExercises(): Promise<Exercise[]> {
  if (cachedExercises) return cachedExercises;

  const res = await fetch("/data/exercises.json");
  const data: Exercise[] = await res.json();
  cachedExercises = data;
  return data;
}

export function searchExercises(
  exercises: Exercise[],
  query: string,
  bodyPartFilter?: string,
): Exercise[] {
  const q = query.toLowerCase().trim();

  let filtered = exercises;

  if (bodyPartFilter && bodyPartFilter !== "all") {
    filtered = filtered.filter((ex) =>
      (ex.primaryMuscles ?? []).some(
        (m) => m?.toLowerCase() === bodyPartFilter.toLowerCase(),
      ),
    );
  }

  if (q) {
    filtered = filtered.filter(
      (ex) =>
        ex.name?.toLowerCase().includes(q) ||
        ex.primaryMuscles?.some((m) => m?.toLowerCase().includes(q)) ||
        (ex.equipment ?? "").toLowerCase().includes(q) ||
        (ex.category ?? "").toLowerCase().includes(q),
    );
  }

  return filtered;
}

export function getBodyParts(exercises: Exercise[]): string[] {
  const set = new Set<string>();
  exercises.forEach((ex) =>
    ex.primaryMuscles.forEach((m) => set.add(m.toLowerCase())),
  );
  return Array.from(set).sort();
}

/** Generate a one-line form tip from the first instruction */
export function getFormTip(exercise: Exercise): string {
  if (!exercise.instructions.length) return "Focus on controlled movement.";
  return exercise.instructions[0];
}
