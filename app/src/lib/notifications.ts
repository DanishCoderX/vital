import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const HYDRATION_CATEGORY = "hydration-reminder";
const QUICK_ADD_ACTION = "quick-add-250";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionResult> {
  if (Platform.OS === "web") {
    if (typeof Notification === "undefined") return { granted: false, canAskAgain: false };
    const result = await Notification.requestPermission();
    return { granted: result === "granted", canAskAgain: result !== "denied" };
  }

  // Check current status first — requesting again after a permanent denial won't
  // re-prompt on Android, so we need to tell the difference to give the right message.
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return { granted: true, canAskAgain: true };
  if (!current.canAskAgain) return { granted: false, canAskAgain: false };

  const requested = await Notifications.requestPermissionsAsync();
  return { granted: requested.status === "granted", canAskAgain: requested.canAskAgain };
}

/** Registers the "+250ml" quick-action button on the notification itself (native only). */
export async function setupNotificationCategory(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.setNotificationCategoryAsync(HYDRATION_CATEGORY, [
    {
      identifier: QUICK_ADD_ACTION,
      buttonTitle: "+250ml",
      options: { opensAppToForeground: false },
    },
  ]);
}

/** Cancels any previously scheduled reminders and reschedules based on the given times. */
export async function scheduleHydrationReminders(times: string[]): Promise<void> {
  if (Platform.OS === "web") return; // web reminders are handled by a live interval instead, see startWebReminderLoop
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const time of times) {
    const [hour, minute] = time.split(":").map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to hydrate 💧",
        body: "Tap +250ml to log a glass of water right now.",
        categoryIdentifier: HYDRATION_CATEGORY,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Returns true if a notification response was the "+250ml" quick action button. */
export function isQuickAddAction(response: Notifications.NotificationResponse): boolean {
  return response.actionIdentifier === QUICK_ADD_ACTION;
}

/**
 * Web-only: since browsers can't run background scheduled tasks without a service worker
 * push subscription (out of scope here), this runs a simple in-memory interval that checks
 * the current time against configured reminder times once a minute, only while the tab is open.
 * Returns a cleanup function to stop the loop.
 */
export function startWebReminderLoop(getTimes: () => string[], getEnabled: () => boolean): () => void {
  if (Platform.OS !== "web" || typeof Notification === "undefined") return () => {};

  const firedThisMinute = new Set<string>();

  const interval = setInterval(() => {
    if (!getEnabled()) return;
    if (Notification.permission !== "granted") return;

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const current = `${hh}:${mm}`;
    const key = `${now.toDateString()}-${current}`;

    if (getTimes().includes(current) && !firedThisMinute.has(key)) {
      firedThisMinute.add(key);
      new Notification("Time to hydrate 💧", {
        body: "Open Vital to log some water.",
      });
    }
  }, 30000); // check twice a minute to avoid missing the exact minute boundary

  return () => clearInterval(interval);
}