import { useRef, useState } from "react";
import { Platform, View, Text, StyleSheet, TouchableOpacity, TextInput, Switch } from "react-native";
import ScreenContainer from "../components/ScreenContainer";
import Card from "../components/Card";
import SummaryCard from "../components/SummaryCard";
import { useAppContext } from "../lib/AppContext";
import { updateSettings, addWeight, latestWeightKg, toggleRestDay, todayStr, mergeImportedCsv } from "../lib/store";
import { exportCsv, pickAndParseCsv } from "../lib/csv";
import { requestNotificationPermission, scheduleHydrationReminders, cancelAllReminders } from "../lib/notifications";
import { shareSummaryCard } from "../lib/shareSummary";
import { useAuth } from "../lib/AuthContext";
import { showAlert, showConfirm } from "../lib/platformAlert";

export default function SettingsScreen() {
  const { user, logout, deleteAccount, changePassword } = useAuth();
  const { data, theme, refresh } = useAppContext();
  const [goalInput, setGoalInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [newTime, setNewTime] = useState("");
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const summaryRef = useRef<View>(null);

  if (!data) return null;

  const today = todayStr();
  const isRestDayToday = data.restDays.some((r) => r.date === today);

  async function handleSaveGoal() {
    const goal = parseInt(goalInput, 10);
    if (!goal || goal <= 0) return;
    const next = await updateSettings(data!, { hydrationGoalMl: goal });
    refresh(next);
    setGoalInput("");
  }

  async function handleSaveWeight() {
    const weight = parseFloat(weightInput);
    if (!weight || weight <= 0) return;
    const next = await addWeight(data!, weight);
    refresh(next);
    setWeightInput("");
  }

  async function handleToggleTheme(value: boolean) {
    const next = await updateSettings(data!, { theme: value ? "dark" : "light" });
    refresh(next);
  }

  async function handleToggleReminders(value: boolean) {
    if (value) {
      const { granted, canAskAgain } = await requestNotificationPermission();
      if (!granted) {
        if (!canAskAgain) {
          showAlert(
            "Notifications blocked",
            "You've previously denied notification permission. Enable it manually in your device's Settings → Apps → Vital → Notifications, then try the switch again."
          );
        } else {
          showAlert("Permission needed", "Notifications permission is required to use reminders.");
        }
        return; // leave the switch off — don't update settings.enabled since it never actually turned on
      }
      await scheduleHydrationReminders(data!.settings.reminders.times);
    } else {
      await cancelAllReminders();
    }
    const next = await updateSettings(data!, { reminders: { ...data!.settings.reminders, enabled: value } });
    refresh(next);
  }

  async function handleAddTime() {
    const trimmed = newTime.trim();
    if (!/^\d{1,2}:\d{2}$/.test(trimmed)) {
      showAlert("Invalid time", "Use 24-hour HH:MM format, e.g. 14:30");
      return;
    }
    const times = [...data!.settings.reminders.times, trimmed].sort();
    const next = await updateSettings(data!, { reminders: { ...data!.settings.reminders, times } });
    refresh(next);
    if (data!.settings.reminders.enabled) await scheduleHydrationReminders(times);
    setNewTime("");
  }

  async function handleRemoveTime(time: string) {
    const times = data!.settings.reminders.times.filter((t) => t !== time);
    const next = await updateSettings(data!, { reminders: { ...data!.settings.reminders, times } });
    refresh(next);
    if (data!.settings.reminders.enabled) await scheduleHydrationReminders(times);
  }

  async function handleToggleRestDay() {
    const next = await toggleRestDay(data!, today);
    refresh(next);
  }

  async function handleExport() {
    await exportCsv(data!);
  }

  async function handleImport() {
    const sections = await pickAndParseCsv();
    if (!sections) return;
    const next = await mergeImportedCsv(data!, sections);
    refresh(next);
    showAlert("Import complete", "Your data has been merged in.");
  }

  async function handleShareSummary() {
    await shareSummaryCard(summaryRef);
  }

  async function performDelete() {
    try {
      await deleteAccount();
    } catch {
      showAlert("Something went wrong", "Couldn't delete your account. Please check your connection and try again.");
    }
  }

  function handleDeleteAccount() {
    showConfirm(
      "Delete account?",
      "This permanently deletes your account and everything synced to it — workouts, hydration history, steps, weight, everything. This cannot be undone.",
      "Delete Everything",
      performDelete
    );
  }

  async function handleChangePassword() {
    if (currentPasswordInput.length === 0 || newPasswordInput.length < 8) return;
    setChangingPassword(true);
    try {
      await changePassword(currentPasswordInput, newPasswordInput);
      setCurrentPasswordInput("");
      setNewPasswordInput("");
      showAlert("Password changed", "Your password has been updated.");
    } catch {
      showAlert("Couldn't change password", "Check your current password and try again.");
    } finally {
      setChangingPassword(false);
    }
  }

  const weight = latestWeightKg(data);

  return (
    <ScreenContainer title="Settings" subtitle="Tune Vital to how you actually live">
      <Card>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>Account</Text>
        <Text style={[styles.current, { color: theme.inkSoft }]}>{user?.email}</Text>
        <TouchableOpacity onPress={logout} style={[styles.fullButton, { backgroundColor: theme.danger }]}>
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDeleteAccount}
          style={[styles.fullButton, { backgroundColor: "transparent", borderWidth: 1, borderColor: theme.danger, marginTop: 10 }]}
        >
          <Text style={[styles.buttonText, { color: theme.danger }]}>Delete Account</Text>
        </TouchableOpacity>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>Change password</Text>
        <TextInput
          value={currentPasswordInput}
          onChangeText={setCurrentPasswordInput}
          placeholder="Current password"
          placeholderTextColor={theme.inkSoft}
          secureTextEntry
          style={[styles.input, { borderColor: theme.hairline, color: theme.ink, marginBottom: 10 }]}
        />
        <TextInput
          value={newPasswordInput}
          onChangeText={setNewPasswordInput}
          placeholder="New password (min. 8 characters)"
          placeholderTextColor={theme.inkSoft}
          secureTextEntry
          style={[styles.input, { borderColor: theme.hairline, color: theme.ink, marginBottom: 10 }]}
        />
        <TouchableOpacity
          onPress={handleChangePassword}
          disabled={changingPassword || !currentPasswordInput || newPasswordInput.length < 8}
          style={[styles.fullButton, { backgroundColor: theme.aqua, opacity: changingPassword ? 0.7 : 1 }]}
        >
          <Text style={styles.buttonText}>Update Password</Text>
        </TouchableOpacity>
        <Text style={[styles.note, { color: theme.inkSoft }]}>
          If you signed up with Google, this won't apply — there's no password to change.
        </Text>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>Hydration goal</Text>
        <Text style={[styles.current, { color: theme.inkSoft }]}>Current: {data.settings.hydrationGoalMl}ml/day</Text>
        <View style={styles.row}>
          <TextInput
            value={goalInput}
            onChangeText={setGoalInput}
            placeholder="New goal (ml)"
            placeholderTextColor={theme.inkSoft}
            keyboardType="number-pad"
            style={[styles.input, { borderColor: theme.hairline, color: theme.ink }]}
          />
          <TouchableOpacity onPress={handleSaveGoal} style={[styles.button, { backgroundColor: theme.aqua }]}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card>
        <View style={styles.switchRow}>
          <Text style={[styles.sectionTitle, { color: theme.ink, marginBottom: 0 }]}>Dark mode</Text>
          <Switch value={data.settings.theme === "dark"} onValueChange={handleToggleTheme} />
        </View>
      </Card>

      <Card>
        <View style={styles.switchRow}>
          <Text style={[styles.sectionTitle, { color: theme.ink, marginBottom: 0 }]}>Hydration reminders</Text>
          <Switch value={data.settings.reminders.enabled} onValueChange={handleToggleReminders} />
        </View>
        {Platform.OS === "web" && (
          <Text style={[styles.note, { color: theme.inkSoft }]}>
            On web, reminders only fire while this tab is open. On the mobile app, they work even when the app is
            closed.
          </Text>
        )}
        <View style={styles.timeChips}>
          {data.settings.reminders.times.map((t) => (
            <View key={t} style={[styles.timeChip, { backgroundColor: theme.surfaceRaised }]}>
              <Text style={{ color: theme.ink, fontSize: 13 }}>{t}</Text>
              <TouchableOpacity onPress={() => handleRemoveTime(t)} style={{ marginLeft: 6 }}>
                <Text style={{ color: theme.danger }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View style={styles.row}>
          <TextInput
            value={newTime}
            onChangeText={setNewTime}
            placeholder="HH:MM e.g. 15:00"
            placeholderTextColor={theme.inkSoft}
            style={[styles.input, { borderColor: theme.hairline, color: theme.ink }]}
          />
          <TouchableOpacity onPress={handleAddTime} style={[styles.button, { backgroundColor: theme.ink }]}>
            <Text style={[styles.buttonText, { color: theme.background }]}>Add</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>Body weight</Text>
        <Text style={[styles.current, { color: theme.inkSoft }]}>
          Current: {weight}kg (used for calorie estimates)
        </Text>
        <View style={styles.row}>
          <TextInput
            value={weightInput}
            onChangeText={setWeightInput}
            placeholder="Weight (kg)"
            placeholderTextColor={theme.inkSoft}
            keyboardType="decimal-pad"
            style={[styles.input, { borderColor: theme.hairline, color: theme.ink }]}
          />
          <TouchableOpacity onPress={handleSaveWeight} style={[styles.button, { backgroundColor: theme.sage }]}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: theme.ink, marginBottom: 2 }]}>Rest day today</Text>
            <Text style={[styles.note, { color: theme.inkSoft, marginTop: 0 }]}>
              Marked rest days won't break your hydration streak.
            </Text>
          </View>
          <Switch value={isRestDayToday} onValueChange={handleToggleRestDay} />
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>Data</Text>
        <TouchableOpacity onPress={handleExport} style={[styles.fullButton, { backgroundColor: theme.ink }]}>
          <Text style={[styles.buttonText, { color: theme.background }]}>Export as CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleImport} style={[styles.fullButton, { backgroundColor: theme.surfaceRaised, borderWidth: 1, borderColor: theme.hairline, marginTop: 10 }]}>
          <Text style={[styles.buttonText, { color: theme.ink }]}>Import CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShareSummary} style={[styles.fullButton, { backgroundColor: theme.coral, marginTop: 10 }]}>
          <Text style={styles.buttonText}>Share Weekly Summary</Text>
        </TouchableOpacity>
      </Card>

      {/* Off-screen summary card used only for capture — not part of the visible layout */}
      <View style={styles.hiddenCapture} pointerEvents="none">
        <SummaryCard ref={summaryRef} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  current: { fontSize: 12, marginBottom: 10 },
  row: { flexDirection: "row", gap: 10 },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  button: { paddingHorizontal: 16, justifyContent: "center", borderRadius: 10 },
  buttonText: { color: "#fff", fontWeight: "600" },
  fullButton: { paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  note: { fontSize: 11, marginTop: 8, marginBottom: 10 },
  timeChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 10 },
  timeChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  hiddenCapture: { position: "absolute", top: -9999, left: -9999 },
});