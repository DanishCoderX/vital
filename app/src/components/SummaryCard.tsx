import { forwardRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppContext } from "../lib/AppContext";
import { lastNDates, caloriesForDate, stepsForDate, hydrationTotalForDate } from "../lib/store";

const SummaryCard = forwardRef<View>((_props, ref) => {
  const { data, theme } = useAppContext();
  if (!data) return null;

  const dates = lastNDates(7);
  const totalCalories = dates.reduce((sum, d) => sum + caloriesForDate(data, d), 0);
  const totalSteps = dates.reduce((sum, d) => sum + stepsForDate(data, d), 0);
  const totalHydrationDays = dates.filter((d) => hydrationTotalForDate(data, d) >= data.settings.hydrationGoalMl).length;
  const workoutCount = data.workouts.filter((w) => dates.includes(w.date)).length;

  return (
    <View ref={ref} style={[styles.card, { backgroundColor: theme.surface }]}>
      <Text style={[styles.title, { color: theme.ink }]}>My Week with Vital</Text>
      <Text style={[styles.subtitle, { color: theme.inkSoft }]}>
        {new Date(dates[0] + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })} –{" "}
        {new Date(dates[6] + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      </Text>

      <View style={styles.statsGrid}>
        <View style={styles.statBlock}>
          <Text style={[styles.statValue, { color: theme.coral }]}>{workoutCount}</Text>
          <Text style={[styles.statLabel, { color: theme.inkSoft }]}>Workouts</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={[styles.statValue, { color: theme.coral }]}>{totalCalories}</Text>
          <Text style={[styles.statLabel, { color: theme.inkSoft }]}>Calories</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={[styles.statValue, { color: theme.sage }]}>{totalSteps.toLocaleString()}</Text>
          <Text style={[styles.statLabel, { color: theme.inkSoft }]}>Steps</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={[styles.statValue, { color: theme.aqua }]}>{totalHydrationDays}/7</Text>
          <Text style={[styles.statLabel, { color: theme.inkSoft }]}>Hydration goal hit</Text>
        </View>
      </View>

      <Text style={[styles.footer, { color: theme.inkSoft }]}>🔥 {data.streaks.hydration.current}-day hydration streak</Text>
    </View>
  );
});

SummaryCard.displayName = "SummaryCard";
export default SummaryCard;

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 24, width: 320 },
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 2, marginBottom: 18 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  statBlock: { width: "42%" },
  statValue: { fontSize: 26, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  footer: { fontSize: 12, marginTop: 20, fontWeight: "600" },
});
