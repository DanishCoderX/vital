import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  AppData,
  WorkoutEntry,
  WorkoutPreset,
  StepEntry,
  HydrationEntry,
  WeightEntry,
  RestDay,
  Badge,
  WorkoutType,
} from "../types";

const STORAGE_KEY = "vital-tracker:data:v1";

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a + "T00:00:00");
  const d2 = new Date(b + "T00:00:00");
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const DEFAULT_BADGES: Badge[] = [
  { id: "first-workout", label: "First Step", description: "Log your first workout", icon: "🥉", earnedAt: null },
  { id: "ten-workouts", label: "Consistent", description: "Log 10 workouts", icon: "🥈", earnedAt: null },
  { id: "hydration-3-streak", label: "Hydrated", description: "Hit your hydration goal 3 days in a row", icon: "💧", earnedAt: null },
  { id: "hydration-7-streak", label: "Well Hydrated", description: "Hit your hydration goal 7 days in a row", icon: "🌊", earnedAt: null },
  { id: "steps-10k", label: "10K Day", description: "Log 10,000 steps in a single day", icon: "👟", earnedAt: null },
  { id: "five-workout-types", label: "Cross Trainer", description: "Try 5 different workout types", icon: "🏅", earnedAt: null },
];

export function defaultData(): AppData {
  return {
    workouts: [],
    presets: [],
    steps: [],
    hydration: [],
    weights: [],
    restDays: [],
    streaks: { hydration: { current: 0, longest: 0, lastGoalMetDate: null } },
    settings: {
      hydrationGoalMl: 2500,
      theme: "light",
      reminders: { enabled: false, times: ["09:00", "13:00", "18:00"] },
      defaultWeightKg: 70,
    },
    badges: DEFAULT_BADGES,
  };
}

export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = defaultData();
      await saveData(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as AppData;
    // Migration guards for anyone upgrading from an earlier shape
    if (!parsed.presets) parsed.presets = [];
    if (!parsed.weights) parsed.weights = [];
    if (!parsed.restDays) parsed.restDays = [];
    if (!parsed.badges) parsed.badges = DEFAULT_BADGES;
    if (!parsed.streaks) parsed.streaks = { hydration: { current: 0, longest: 0, lastGoalMetDate: null } };
    return parsed;
  } catch {
    return defaultData();
  }
}

export async function saveData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ---------- Workouts ----------

export async function addWorkout(data: AppData, entry: Omit<WorkoutEntry, "id" | "timestamp">): Promise<AppData> {
  const workout: WorkoutEntry = { ...entry, id: uid(), timestamp: Date.now() };
  const next = { ...data, workouts: [workout, ...data.workouts] };
  const withBadges = checkAndAwardBadges(next);
  await saveData(withBadges);
  return withBadges;
}

export async function updateWorkout(data: AppData, id: string, updates: Partial<WorkoutEntry>): Promise<AppData> {
  const next = { ...data, workouts: data.workouts.map((w) => (w.id === id ? { ...w, ...updates } : w)) };
  await saveData(next);
  return next;
}

export async function deleteWorkout(data: AppData, id: string): Promise<AppData> {
  const next = { ...data, workouts: data.workouts.filter((w) => w.id !== id) };
  await saveData(next);
  return next;
}

// ---------- Workout presets ----------

export async function addPreset(data: AppData, preset: Omit<WorkoutPreset, "id">): Promise<AppData> {
  const next = { ...data, presets: [{ ...preset, id: uid() }, ...data.presets] };
  await saveData(next);
  return next;
}

export async function deletePreset(data: AppData, id: string): Promise<AppData> {
  const next = { ...data, presets: data.presets.filter((p) => p.id !== id) };
  await saveData(next);
  return next;
}

// ---------- Steps ----------

/** Upserts today's (or a given date's) step count — one entry per date. */
export async function setSteps(data: AppData, date: string, steps: number, source: "manual" | "sensor"): Promise<AppData> {
  const existingIdx = data.steps.findIndex((s) => s.date === date);
  const steps_ = [...data.steps];
  if (existingIdx >= 0) {
    steps_[existingIdx] = { ...steps_[existingIdx], steps, source };
  } else {
    steps_.push({ id: uid(), date, steps, source });
  }
  const next = { ...data, steps: steps_ };
  const withBadges = checkAndAwardBadges(next);
  await saveData(withBadges);
  return withBadges;
}

// ---------- Hydration ----------

export async function addHydration(data: AppData, amountMl: number): Promise<AppData> {
  const today = todayStr();
  const entry: HydrationEntry = { id: uid(), date: today, amountMl, timestamp: Date.now() };
  let next = { ...data, hydration: [entry, ...data.hydration] };

  const totalToday = next.hydration.filter((h) => h.date === today).reduce((sum, h) => sum + h.amountMl, 0);
  if (totalToday >= next.settings.hydrationGoalMl) {
    next = { ...next, streaks: { ...next.streaks, hydration: bumpHydrationStreak(next, today) } };
  }

  const withBadges = checkAndAwardBadges(next);
  await saveData(withBadges);
  return withBadges;
}

function bumpHydrationStreak(data: AppData, today: string) {
  const { current, longest, lastGoalMetDate } = data.streaks.hydration;
  if (lastGoalMetDate === today) return data.streaks.hydration; // already counted today

  let nextCurrent: number;
  if (lastGoalMetDate === null) {
    nextCurrent = 1;
  } else {
    const gap = daysBetween(lastGoalMetDate, today);
    // A rest day in between shouldn't break the streak — treat gap of 2 as continuous if the
    // in-between day was marked as rest. Simpler: only break if gap > 1 and that day wasn't a rest day.
    const inBetweenDate = new Date(new Date(lastGoalMetDate + "T00:00:00").getTime() + 86400000).toISOString().slice(0, 10);
    const wasRestDay = data.restDays.some((r) => r.date === inBetweenDate);
    nextCurrent = gap === 1 || (gap === 2 && wasRestDay) ? current + 1 : 1;
  }
  return { current: nextCurrent, longest: Math.max(longest, nextCurrent), lastGoalMetDate: today };
}

export async function deleteHydrationEntry(data: AppData, id: string): Promise<AppData> {
  const next = { ...data, hydration: data.hydration.filter((h) => h.id !== id) };
  await saveData(next);
  return next;
}

// ---------- Weight ----------

export async function addWeight(data: AppData, weightKg: number, date: string = todayStr()): Promise<AppData> {
  const existingIdx = data.weights.findIndex((w) => w.date === date);
  const weights = [...data.weights];
  if (existingIdx >= 0) {
    weights[existingIdx] = { ...weights[existingIdx], weightKg };
  } else {
    weights.push({ id: uid(), date, weightKg });
  }
  const next = { ...data, weights };
  await saveData(next);
  return next;
}

export function latestWeightKg(data: AppData): number {
  if (data.weights.length === 0) return data.settings.defaultWeightKg;
  const sorted = [...data.weights].sort((a, b) => (a.date < b.date ? 1 : -1));
  return sorted[0].weightKg;
}

// ---------- Rest days ----------

export async function toggleRestDay(data: AppData, date: string): Promise<AppData> {
  const exists = data.restDays.some((r) => r.date === date);
  const restDays = exists ? data.restDays.filter((r) => r.date !== date) : [...data.restDays, { date }];
  const next = { ...data, restDays };
  await saveData(next);
  return next;
}

// ---------- Settings ----------

export async function updateSettings(data: AppData, updates: Partial<AppData["settings"]>): Promise<AppData> {
  const next = { ...data, settings: { ...data.settings, ...updates } };
  await saveData(next);
  return next;
}

// ---------- Badges ----------

function checkAndAwardBadges(data: AppData): AppData {
  const now = Date.now();
  const badges = data.badges.map((b) => {
    if (b.earnedAt) return b;
    let earned = false;
    switch (b.id) {
      case "first-workout":
        earned = data.workouts.length >= 1;
        break;
      case "ten-workouts":
        earned = data.workouts.length >= 10;
        break;
      case "hydration-3-streak":
        earned = data.streaks.hydration.longest >= 3;
        break;
      case "hydration-7-streak":
        earned = data.streaks.hydration.longest >= 7;
        break;
      case "steps-10k":
        earned = data.steps.some((s) => s.steps >= 10000);
        break;
      case "five-workout-types":
        earned = new Set(data.workouts.map((w) => w.type)).size >= 5;
        break;
      default:
        earned = false;
    }
    return earned ? { ...b, earnedAt: now } : b;
  });
  return { ...data, badges };
}

// ---------- Derived helpers ----------

export function hydrationTotalForDate(data: AppData, date: string): number {
  return data.hydration.filter((h) => h.date === date).reduce((sum, h) => sum + h.amountMl, 0);
}

export function caloriesForDate(data: AppData, date: string): number {
  return data.workouts.filter((w) => w.date === date).reduce((sum, w) => sum + w.calories, 0);
}

export function stepsForDate(data: AppData, date: string): number {
  return data.steps.find((s) => s.date === date)?.steps ?? 0;
}

/** Returns the last N calendar dates (oldest first) as YYYY-MM-DD strings, ending today. */
export function lastNDates(n: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export type WorkoutTypeCount = Partial<Record<WorkoutType, number>>;

// ---------- CSV import merge ----------

interface ImportedSections {
  workouts: { date: string; type: string; durationMinutes: number; calories: number; note: string }[];
  steps: { date: string; steps: number; source: string }[];
  hydration: { date: string; amountMl: number; time: string }[];
  weights: { date: string; weightKg: number }[];
}

const VALID_WORKOUT_TYPES: WorkoutType[] = ["running", "cycling", "swimming", "gym", "yoga", "walking", "hiit", "other"];

/** Merges parsed CSV sections into existing data. Workouts/hydration are appended (deduped by content); steps/weights are upserted by date. */
export async function mergeImportedCsv(data: AppData, sections: ImportedSections): Promise<AppData> {
  let next = { ...data };

  const existingWorkoutKeys = new Set(next.workouts.map((w) => `${w.date}-${w.type}-${w.durationMinutes}-${w.calories}`));
  const newWorkouts: WorkoutEntry[] = sections.workouts
    .filter((w) => !existingWorkoutKeys.has(`${w.date}-${w.type}-${w.durationMinutes}-${w.calories}`))
    .map((w) => ({
      id: uid(),
      type: (VALID_WORKOUT_TYPES.includes(w.type as WorkoutType) ? w.type : "other") as WorkoutType,
      durationMinutes: w.durationMinutes,
      calories: w.calories,
      date: w.date,
      timestamp: Date.now(),
      note: w.note || undefined,
    }));
  next = { ...next, workouts: [...newWorkouts, ...next.workouts] };

  const stepsByDate = new Map(next.steps.map((s) => [s.date, s]));
  for (const s of sections.steps) {
    const existing = stepsByDate.get(s.date);
    if (!existing || s.steps > existing.steps) {
      stepsByDate.set(s.date, { id: existing?.id ?? uid(), date: s.date, steps: s.steps, source: (s.source as "manual" | "sensor") || "manual" });
    }
  }
  next = { ...next, steps: Array.from(stepsByDate.values()) };

  const existingHydrationKeys = new Set(next.hydration.map((h) => `${h.date}-${h.amountMl}-${h.timestamp}`));
  const newHydration: HydrationEntry[] = sections.hydration
    .map((h) => ({ id: uid(), date: h.date, amountMl: h.amountMl, timestamp: h.time ? Date.parse(h.time) || Date.now() : Date.now() }))
    .filter((h) => !existingHydrationKeys.has(`${h.date}-${h.amountMl}-${h.timestamp}`));
  next = { ...next, hydration: [...newHydration, ...next.hydration] };

  const weightsByDate = new Map(next.weights.map((w) => [w.date, w]));
  for (const w of sections.weights) {
    const existing = weightsByDate.get(w.date);
    weightsByDate.set(w.date, { id: existing?.id ?? uid(), date: w.date, weightKg: w.weightKg });
  }
  next = { ...next, weights: Array.from(weightsByDate.values()) };

  const withBadges = checkAndAwardBadges(next);
  await saveData(withBadges);
  return withBadges;
}
