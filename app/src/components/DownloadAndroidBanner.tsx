import { useState } from "react";
import { Platform, View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { useAppContext } from "../lib/AppContext";

// Fill this in once your EAS build finishes — see the "eas build" instructions in README.md.
// It should point to a permanently-hosted .apk file (e.g. uploaded to a GitHub Release),
// not the temporary expo.dev build artifact URL, which expires.
export const ANDROID_APK_URL = "";

export default function DownloadAndroidBanner() {
  const { theme } = useAppContext();
  const [dismissed, setDismissed] = useState(false);

  if (Platform.OS !== "web" || !ANDROID_APK_URL || dismissed) return null;

  return (
    <View style={[styles.banner, { backgroundColor: theme.surfaceRaised, borderColor: theme.hairline }]}>
      <Text style={[styles.text, { color: theme.ink }]}>
        📱 Get the full native app with automatic step tracking and real reminders.
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => Linking.openURL(ANDROID_APK_URL)} style={[styles.downloadButton, { backgroundColor: theme.aqua }]}>
          <Text style={styles.downloadText}>Download for Android</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDismissed(true)}>
          <Text style={[styles.dismiss, { color: theme.inkSoft }]}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  text: { fontSize: 12, flex: 1, minWidth: 200 },
  actions: { flexDirection: "row", alignItems: "center", gap: 12 },
  downloadButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  downloadText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  dismiss: { fontSize: 14, paddingHorizontal: 4 },
});
