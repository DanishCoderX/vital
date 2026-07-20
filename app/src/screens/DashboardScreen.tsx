import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import ScreenContainer from "../components/ScreenContainer";
import Card from "../components/Card";
import HydrationRing from "../components/HydrationRing";
import BarChart from "../components/BarChart";
import { useAppContext } from "../lib/AppContext";
import { hydrationTotalForDate, caloriesForDate, stepsForDate, lastNDates, todayStr } from "../lib/store";

type Range = "week" | "month";

export default function DashboardScreen() {
  const { data, theme } = useAppContext();
  const [range, setRange] = useState<Range>("week");

  if (!data) return null;

  const today = todayStr();
  const todayHydration = hydrationTotalForDate(data, today);
  const todayCalories = caloriesForDate(data, today);
  const todaySteps = stepsForDate(data, today);

  const dayCount = range === "week" ? 7 : 30;
  const dates = lastNDates(dayCount);
  const labels =
    range === "week"
      ? dates.map((d) => new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2))
      : dates.map((_, i) => (i % 5 === 0 ? String(i + 1) : ""));

  const calorieValues = dates.map((d) => caloriesForDate(data, d));
  const stepValues = dates.map((d) => stepsForDate(data, d));
  const hydrationValues = dates.map((d) => hydrationTotalForDate(data, d));

  const earnedBadges = data.badges.filter((b) => b.earnedAt);

  return (
    <ScreenContainer title="Dashboard" subtitle="Today at a glance">
      <Card style={styles.ringCard}>
        <HydrationRing currentMl={todayHydration} goalMl={data.settings.hydrationGoalMl} />
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: theme.coral }]}>{todayCalories}</Text>
          <Text style={[styles.statLabel, { color: theme.inkSoft }]}>Calories burned</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: theme.sage }]}>{todaySteps.toLocaleString()}</Text>
          <Text style={[styles.statLabel, { color: theme.inkSoft }]}>Steps today</Text>
        </Card>
      </View>

      <Card>
        <View style={styles.streakRow}>
          <Text style={styles.streakIcon}>🔥</Text>
          <View>
            <Text style={[styles.streakValue, { color: theme.ink }]}>
              {data.streaks.hydration.current} day{data.streaks.hydration.current === 1 ? "" : "s"} streak
            </Text>
            <Text style={[styles.streakSub, { color: theme.inkSoft }]}>
              Longest: {data.streaks.hydration.longest} days
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.rangeToggle}>
        {(["week", "month"] as Range[]).map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => setRange(r)}
            style={[
              styles.rangeButton,
              { backgroundColor: range === r ? theme.ink : "transparent", borderColor: theme.hairline },
            ]}
          >
            <Text style={{ color: range === r ? theme.background : theme.inkSoft, fontSize: 12, fontWeight: "600" }}>
              {r === "week" ? "Week" : "Month"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Card>
        <Text style={[styles.chartTitle, { color: theme.ink }]}>Calories</Text>
        <BarChart labels={labels} values={calorieValues} color={theme.coral} />
      </Card>

      <Card>
        <Text style={[styles.chartTitle, { color: theme.ink }]}>Steps</Text>
        <BarChart labels={labels} values={stepValues} color={theme.sage} />
      </Card>

      <Card>
        <Text style={[styles.chartTitle, { color: theme.ink }]}>Hydration (ml)</Text>
        <BarChart labels={labels} values={hydrationValues} color={theme.aqua} />
      </Card>

      {earnedBadges.length > 0 && (
        <Card>
          <Text style={[styles.chartTitle, { color: theme.ink, marginBottom: 10 }]}>Achievements</Text>
          <View style={styles.badgeRow}>
            {earnedBadges.map((b) => (
              <View key={b.id} style={[styles.badgeChip, { backgroundColor: theme.surfaceRaised }]}>
                <Text style={{ fontSize: 18 }}>{b.icon}</Text>
                <Text style={[styles.badgeLabel, { color: theme.ink }]}>{b.label}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  ringCard: { alignItems: "center", paddingVertical: 24 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "700" },
  statLabel: { fontSize: 12, marginTop: 4 },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  streakIcon: { fontSize: 32 },
  streakValue: { fontSize: 16, fontWeight: "700" },
  streakSub: { fontSize: 12, marginTop: 2 },
  rangeToggle: { flexDirection: "row", gap: 8 },
  rangeButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  chartTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badgeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  badgeLabel: { fontSize: 12, fontWeight: "600" },
});
