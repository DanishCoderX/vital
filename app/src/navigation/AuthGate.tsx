import { useEffect, useRef, useState } from "react";
import { Platform, View, Text, ActivityIndicator } from "react-native";
import * as Notifications from "expo-notifications";
import { useAuth } from "../lib/AuthContext";
import { lightTheme } from "../theme";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import { AppProvider, useAppContext } from "../lib/AppContext";
import RootNavigator from "./RootNavigator";
import DownloadAndroidBanner from "../components/DownloadAndroidBanner";
import { addHydration } from "../lib/store";
import {
  setupNotificationCategory,
  isQuickAddAction,
  scheduleHydrationReminders,
  startWebReminderLoop,
} from "../lib/notifications";

function NotificationBridge() {
  const { data, refresh } = useAppContext();
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    setupNotificationCategory();
    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      if (isQuickAddAction(response) && dataRef.current) {
        const next = await addHydration(dataRef.current, 250);
        refresh(next);
      }
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Platform.OS === "web" || !data) return;
    if (data.settings.reminders.enabled) {
      scheduleHydrationReminders(data.settings.reminders.times);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.settings.reminders.enabled, data?.settings.reminders.times.join(",")]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const stop = startWebReminderLoop(
      () => dataRef.current?.settings.reminders.times ?? [],
      () => dataRef.current?.settings.reminders.enabled ?? false
    );
    return stop;
  }, []);

  return null;
}

export default function AuthGate() {
  const { user, loading, offline } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("signup");

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: lightTheme.background }}>
        <ActivityIndicator color={lightTheme.aqua} size="large" />
      </View>
    );
  }

  if (!user) {
    return mode === "signup" ? (
      <SignupScreen onSwitchToLogin={() => setMode("login")} />
    ) : (
      <LoginScreen onSwitchToSignup={() => setMode("signup")} />
    );
  }

  return (
    <AppProvider>
      <NotificationBridge />
      {offline && (
        <View style={{ backgroundColor: "#D9A441", paddingVertical: 6, alignItems: "center" }}>
          <Text style={{ color: "#1F2A2E", fontSize: 12, fontWeight: "600" }}>
            Offline — showing your last synced data
          </Text>
        </View>
      )}
      <DownloadAndroidBanner />
      <RootNavigator />
    </AppProvider>
  );
}
