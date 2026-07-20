import type { WorkoutType } from "../types";

// Standard MET (Metabolic Equivalent of Task) values for moderate-intensity versions
// of each activity. Approximate, sourced from the widely-used Compendium of Physical Activities.
export const MET_VALUES: Record<WorkoutType, number> = {
  running: 9.8,
  cycling: 7.5,
  swimming: 8.0,
  gym: 5.0,
  yoga: 3.0,
  walking: 3.5,
  hiit: 8.0,
  other: 4.0,
};

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  running: "Running",
  cycling: "Cycling",
  swimming: "Swimming",
  gym: "Gym / Strength",
  yoga: "Yoga",
  walking: "Walking",
  hiit: "HIIT",
  other: "Other",
};

export const WORKOUT_TYPE_ICONS: Record<WorkoutType, string> = {
  running: "🏃",
  cycling: "🚴",
  swimming: "🏊",
  gym: "🏋️",
  yoga: "🧘",
  walking: "🚶",
  hiit: "🔥",
  other: "⚡",
};

/**
 * Estimates calories burned using the standard formula: kcal = MET × weight(kg) × time(hours)
 * Result is rounded to the nearest whole calorie.
 */
export function estimateCalories(type: WorkoutType, durationMinutes: number, weightKg: number): number {
  const met = MET_VALUES[type];
  const hours = durationMinutes / 60;
  return Math.round(met * weightKg * hours);
}
