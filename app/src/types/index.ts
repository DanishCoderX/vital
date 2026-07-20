export type WorkoutType =
  | "running"
  | "cycling"
  | "swimming"
  | "gym"
  | "yoga"
  | "walking"
  | "hiit"
  | "other";

export interface WorkoutEntry {
  id: string;
  type: WorkoutType;
  durationMinutes: number;
  calories: number; // auto-estimated via MET, but user-editable
  date: string; // YYYY-MM-DD
  timestamp: number;
  note?: string;
}

export interface WorkoutPreset {
  id: string;
  name: string; // e.g. "Morning Run"
  type: WorkoutType;
  durationMinutes: number;
}

export interface StepEntry {
  id: string;
  date: string; // YYYY-MM-DD — one entry per day, upserted
  steps: number;
  source: "manual" | "sensor";
}

export interface HydrationEntry {
  id: string;
  date: string; // YYYY-MM-DD
  amountMl: number;
  timestamp: number;
}

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
}

export interface RestDay {
  date: string; // YYYY-MM-DD
}

export interface Streaks {
  hydration: { current: number; longest: number; lastGoalMetDate: string | null };
}

export type ThemeMode = "light" | "dark";

export interface ReminderSettings {
  enabled: boolean;
  times: string[]; // "HH:MM" 24-hour, e.g. ["09:00", "13:00", "18:00"]
}

export interface Settings {
  hydrationGoalMl: number;
  theme: ThemeMode;
  reminders: ReminderSettings;
  defaultWeightKg: number; // used for MET calorie calc if no weight entries logged yet
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string; // emoji, simple cross-platform icon without extra asset dependencies
  earnedAt: number | null; // null = not yet earned
}

export interface AppData {
  workouts: WorkoutEntry[];
  presets: WorkoutPreset[];
  steps: StepEntry[];
  hydration: HydrationEntry[];
  weights: WeightEntry[];
  restDays: RestDay[];
  streaks: Streaks;
  settings: Settings;
  badges: Badge[];
}
