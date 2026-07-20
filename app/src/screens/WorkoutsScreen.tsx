import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Modal } from "react-native";
import ScreenContainer from "../components/ScreenContainer";
import Card from "../components/Card";
import { useAppContext } from "../lib/AppContext";
import { addWorkout, updateWorkout, deleteWorkout, addPreset, deletePreset, latestWeightKg, todayStr } from "../lib/store";
import { estimateCalories, WORKOUT_TYPE_LABELS, WORKOUT_TYPE_ICONS } from "../lib/met";
import type { WorkoutType, WorkoutEntry } from "../types";

const WORKOUT_TYPES = Object.keys(WORKOUT_TYPE_LABELS) as WorkoutType[];

export default function WorkoutsScreen() {
  const { data, theme, refresh } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<WorkoutType>("running");
  const [duration, setDuration] = useState("30");
  const [caloriesOverride, setCaloriesOverride] = useState("");

  if (!data) return null;

  const weight = latestWeightKg(data);
  const estimated = estimateCalories(type, parseInt(duration, 10) || 0, weight);

  function resetForm() {
    setEditingId(null);
    setType("running");
    setDuration("30");
    setCaloriesOverride("");
    setShowForm(false);
  }

  async function handleSave() {
    const durationMinutes = parseInt(duration, 10) || 0;
    const calories = caloriesOverride ? parseInt(caloriesOverride, 10) || 0 : estimateCalories(type, durationMinutes, weight);

    if (editingId) {
      const next = await updateWorkout(data!, editingId, { type, durationMinutes, calories });
      refresh(next);
    } else {
      const next = await addWorkout(data!, { type, durationMinutes, calories, date: todayStr() });
      refresh(next);
    }
    resetForm();
  }

  function handleEdit(w: WorkoutEntry) {
    setEditingId(w.id);
    setType(w.type);
    setDuration(String(w.durationMinutes));
    setCaloriesOverride(String(w.calories));
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    const next = await deleteWorkout(data!, id);
    refresh(next);
  }

  async function handleSavePreset() {
    const durationMinutes = parseInt(duration, 10) || 0;
    const next = await addPreset(data!, {
      name: `${WORKOUT_TYPE_LABELS[type]} · ${durationMinutes}min`,
      type,
      durationMinutes,
    });
    refresh(next);
  }

  async function handleQuickLog(presetId: string) {
    const preset = data!.presets.find((p) => p.id === presetId);
    if (!preset) return;
    const calories = estimateCalories(preset.type, preset.durationMinutes, weight);
    const next = await addWorkout(data!, {
      type: preset.type,
      durationMinutes: preset.durationMinutes,
      calories,
      date: todayStr(),
    });
    refresh(next);
  }

  async function handleDeletePreset(id: string) {
    const next = await deletePreset(data!, id);
    refresh(next);
  }

  return (
    <ScreenContainer title="Workouts" subtitle="Log activity, calories auto-estimated">
      {data.presets.length > 0 && (
        <Card>
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>Quick log</Text>
          <View style={styles.presetRow}>
            {data.presets.map((p) => (
              <View key={p.id} style={[styles.presetChip, { backgroundColor: theme.surfaceRaised }]}>
                <TouchableOpacity onPress={() => handleQuickLog(p.id)}>
                  <Text style={{ color: theme.ink, fontWeight: "600", fontSize: 13 }}>
                    {WORKOUT_TYPE_ICONS[p.type]} {p.name}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeletePreset(p.id)} style={{ marginLeft: 8 }}>
                  <Text style={{ color: theme.danger, fontSize: 12 }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </Card>
      )}

      <TouchableOpacity
        onPress={() => setShowForm(true)}
        style={[styles.addWorkoutButton, { backgroundColor: theme.coral }]}
      >
        <Text style={styles.addWorkoutButtonText}>+ Log a Workout</Text>
      </TouchableOpacity>

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>History</Text>
        {data.workouts.length === 0 ? (
          <Text style={{ color: theme.inkSoft, fontSize: 13 }}>No workouts logged yet.</Text>
        ) : (
          <FlatList
            data={data.workouts}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={[styles.workoutRow, { borderColor: theme.hairline }]}>
                <Text style={{ fontSize: 22 }}>{WORKOUT_TYPE_ICONS[item.type]}</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ color: theme.ink, fontWeight: "600" }}>{WORKOUT_TYPE_LABELS[item.type]}</Text>
                  <Text style={{ color: theme.inkSoft, fontSize: 12 }}>
                    {item.durationMinutes} min · {item.calories} kcal · {item.date}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleEdit(item)} style={{ marginRight: 12 }}>
                  <Text style={{ color: theme.aqua, fontSize: 12 }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={{ color: theme.danger, fontSize: 12 }}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </Card>

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={resetForm}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.ink }]}>{editingId ? "Edit Workout" : "Log Workout"}</Text>

            <Text style={[styles.label, { color: theme.inkSoft }]}>Type</Text>
            <View style={styles.typeGrid}>
              {WORKOUT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  style={[
                    styles.typeChip,
                    { borderColor: type === t ? theme.coral : theme.hairline, backgroundColor: type === t ? theme.surfaceRaised : "transparent" },
                  ]}
                >
                  <Text style={{ color: theme.ink, fontSize: 12 }}>
                    {WORKOUT_TYPE_ICONS[t]} {WORKOUT_TYPE_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: theme.inkSoft }]}>Duration (minutes)</Text>
            <TextInput
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              style={[styles.input, { borderColor: theme.hairline, color: theme.ink }]}
            />

            <Text style={[styles.label, { color: theme.inkSoft }]}>
              Estimated calories: {estimated} kcal (editable below)
            </Text>
            <TextInput
              value={caloriesOverride}
              onChangeText={setCaloriesOverride}
              placeholder={String(estimated)}
              placeholderTextColor={theme.inkSoft}
              keyboardType="number-pad"
              style={[styles.input, { borderColor: theme.hairline, color: theme.ink }]}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={resetForm} style={[styles.modalButton, { borderColor: theme.hairline }]}>
                <Text style={{ color: theme.inkSoft }}>Cancel</Text>
              </TouchableOpacity>
              {!editingId && (
                <TouchableOpacity onPress={handleSavePreset} style={[styles.modalButton, { borderColor: theme.hairline }]}>
                  <Text style={{ color: theme.inkSoft }}>Save as Preset</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleSave} style={[styles.modalButton, { backgroundColor: theme.coral }]}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>{editingId ? "Save" : "Log It"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 10 },
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  presetChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  addWorkoutButton: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  addWorkoutButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  workoutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxWidth: 720, width: "100%", alignSelf: "center" },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  label: { fontSize: 12, marginBottom: 6, marginTop: 10 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 18, flexWrap: "wrap" },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", borderWidth: 1, minWidth: 100 },
});
