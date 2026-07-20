import { useEffect, useState } from "react";
import { Platform, View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import ScreenContainer from "../components/ScreenContainer";
import Card from "../components/Card";
import BarChart from "../components/BarChart";
import { useAppContext } from "../lib/AppContext";
import { setSteps, stepsForDate, lastNDates, todayStr } from "../lib/store";
import { isStepSensorAvailable, readTodayStepsFromSensor } from "../lib/stepSensor";

export default function StepsScreen() {
  const { data, theme, refresh } = useAppContext();
  const [sensorAvailable, setSensorAvailable] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [checkingSensor, setCheckingSensor] = useState(Platform.OS !== "web");

  const today = todayStr();
  const todaySteps = data ? stepsForDate(data, today) : 0;

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const available = await isStepSensorAvailable();
      if (cancelled) return;
      setSensorAvailable(available);
      setCheckingSensor(false);
      if (available && data) {
        const result = await readTodayStepsFromSensor();
        if (!cancelled && result.available) {
          const next = await setSteps(data, today, result.steps, "sensor");
          refresh(next);
        }
      }
    }
    check();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return null;

  const dates = lastNDates(7);
  const labels = dates.map((d) => new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2));
  const values = dates.map((d) => stepsForDate(data, d));

  async function handleManualSet() {
    const steps = parseInt(manualInput, 10);
    if (isNaN(steps) || steps < 0) return;
    const next = await setSteps(data!, today, steps, "manual");
    refresh(next);
    setManualInput("");
  }

  async function handleIncrement(amount: number) {
    const next = await setSteps(data!, today, todaySteps + amount, "manual");
    refresh(next);
  }

  return (
    <ScreenContainer title="Steps" subtitle={sensorAvailable ? "Auto-tracked from your device" : "Manual entry"}>
      <Card style={styles.todayCard}>
        <Text style={[styles.todayValue, { color: theme.sage }]}>{todaySteps.toLocaleString()}</Text>
        <Text style={[styles.todayLabel, { color: theme.inkSoft }]}>steps today</Text>

        {Platform.OS === "web" && (
          <Text style={[styles.note, { color: theme.inkSoft }]}>
            Step sensors aren't available in a browser — log your steps manually below. On the mobile app, this
            updates automatically from your phone's motion sensor.
          </Text>
        )}
        {Platform.OS !== "web" && checkingSensor && (
          <Text style={[styles.note, { color: theme.inkSoft }]}>Checking for a step sensor...</Text>
        )}
        {Platform.OS !== "web" && !checkingSensor && !sensorAvailable && (
          <Text style={[styles.note, { color: theme.inkSoft }]}>
            No step sensor detected on this device — you can still log steps manually below.
          </Text>
        )}
      </Card>

      {!sensorAvailable && (
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>Log steps</Text>
          <View style={styles.incrementRow}>
            {[1000, 2500, 5000].map((amt) => (
              <TouchableOpacity
                key={amt}
                onPress={() => handleIncrement(amt)}
                style={[styles.incrementButton, { backgroundColor: theme.sage }]}
              >
                <Text style={styles.incrementText}>+{amt.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.customRow}>
            <TextInput
              value={manualInput}
              onChangeText={setManualInput}
              placeholder="Set exact total for today"
              placeholderTextColor={theme.inkSoft}
              keyboardType="number-pad"
              style={[styles.input, { borderColor: theme.hairline, color: theme.ink }]}
            />
            <TouchableOpacity onPress={handleManualSet} style={[styles.setButton, { backgroundColor: theme.ink }]}>
              <Text style={{ color: theme.background, fontWeight: "600" }}>Set</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>This week</Text>
        <BarChart labels={labels} values={values} color={theme.sage} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  todayCard: { alignItems: "center", paddingVertical: 24 },
  todayValue: { fontSize: 40, fontWeight: "800" },
  todayLabel: { fontSize: 13, marginTop: 4 },
  note: { fontSize: 12, textAlign: "center", marginTop: 12, paddingHorizontal: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 10 },
  incrementRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  incrementButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  incrementText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  customRow: { flexDirection: "row", gap: 10 },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  setButton: { paddingHorizontal: 18, justifyContent: "center", borderRadius: 10 },
});
