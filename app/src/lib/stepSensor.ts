import { Platform } from "react-native";
import { Pedometer } from "expo-sensors";

export interface StepSensorResult {
  available: boolean;
  steps: number;
}

/** Returns whether the device pedometer sensor is available at all (always false on web). */
export async function isStepSensorAvailable(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    return await Pedometer.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Reads today's step count so far from the device's motion sensor (native only). */
export async function readTodayStepsFromSensor(): Promise<StepSensorResult> {
  if (Platform.OS === "web") return { available: false, steps: 0 };

  try {
    const available = await Pedometer.isAvailableAsync();
    if (!available) return { available: false, steps: 0 };

    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const result = await Pedometer.getStepCountAsync(start, end);
    return { available: true, steps: result.steps };
  } catch {
    return { available: false, steps: 0 };
  }
}

/**
 * Subscribes to live step updates for the current session (native only).
 * Returns an unsubscribe function. The callback receives incremental steps
 * since subscription started, not the day's total — callers should add this
 * to the sensor-read total from readTodayStepsFromSensor for a running count.
 */
export function subscribeToStepUpdates(onStep: (steps: number) => void): () => void {
  if (Platform.OS === "web") return () => {};
  const subscription = Pedometer.watchStepCount((result) => {
    onStep(result.steps);
  });
  return () => subscription.remove();
}
