import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from "react-native";
import ScreenContainer from "../components/ScreenContainer";
import Card from "../components/Card";
import HydrationRing from "../components/HydrationRing";
import { useAppContext } from "../lib/AppContext";
import { addHydration, deleteHydrationEntry, hydrationTotalForDate, todayStr } from "../lib/store";

const QUICK_AMOUNTS = [250, 500, 750];

export default function HydrationScreen() {
  const { data, theme, refresh } = useAppContext();
  const [customAmount, setCustomAmount] = useState("");

  if (!data) return null;

  const today = todayStr();
  const todayTotal = hydrationTotalForDate(data, today);
  const todaysEntries = data.hydration.filter((h) => h.date === today).sort((a, b) => b.timestamp - a.timestamp);

  async function handleQuickAdd(amount: number) {
    const next = await addHydration(data!, amount);
    refresh(next);
  }

  async function handleCustomAdd() {
    const amount = parseInt(customAmount, 10);
    if (!amount || amount <= 0) return;
    const next = await addHydration(data!, amount);
    refresh(next);
    setCustomAmount("");
  }

  async function handleDelete(id: string) {
    const next = await deleteHydrationEntry(data!, id);
    refresh(next);
  }

  return (
    <ScreenContainer title="Hydration" subtitle="Stay on top of your water intake">
      <Card style={styles.ringCard}>
        <HydrationRing currentMl={todayTotal} goalMl={data.settings.hydrationGoalMl} size={200} />
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>Quick add</Text>
        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map((amt) => (
            <TouchableOpacity
              key={amt}
              onPress={() => handleQuickAdd(amt)}
              style={[styles.quickButton, { backgroundColor: theme.aqua }]}
            >
              <Text style={styles.quickButtonText}>+{amt}ml</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customRow}>
          <TextInput
            value={customAmount}
            onChangeText={setCustomAmount}
            placeholder="Custom amount (ml)"
            placeholderTextColor={theme.inkSoft}
            keyboardType="number-pad"
            style={[styles.input, { borderColor: theme.hairline, color: theme.ink }]}
          />
          <TouchableOpacity onPress={handleCustomAdd} style={[styles.addButton, { backgroundColor: theme.ink }]}>
            <Text style={{ color: theme.background, fontWeight: "600" }}>Add</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>Today's log</Text>
        {todaysEntries.length === 0 ? (
          <Text style={{ color: theme.inkSoft, fontSize: 13 }}>No entries yet today.</Text>
        ) : (
          <FlatList
            data={todaysEntries}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={[styles.logRow, { borderColor: theme.hairline }]}>
                <Text style={{ color: theme.ink }}>{item.amountMl}ml</Text>
                <Text style={{ color: theme.inkSoft, fontSize: 12 }}>
                  {new Date(item.timestamp).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={{ color: theme.danger, fontSize: 12 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  ringCard: { alignItems: "center", paddingVertical: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 10 },
  quickRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  quickButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  quickButtonText: { color: "#fff", fontWeight: "700" },
  customRow: { flexDirection: "row", gap: 10 },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  addButton: { paddingHorizontal: 18, justifyContent: "center", borderRadius: 10 },
  logRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
