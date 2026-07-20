import { Alert, Platform } from "react-native";

/** Simple one-button informational alert that works on both native and web. */
export function showAlert(title: string, message: string): void {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

/**
 * Confirmation dialog with Cancel + a destructive/confirm action, working on both
 * native (Alert.alert) and web (window.confirm), since Alert doesn't reliably render on web.
 */
export function showConfirm(title: string, message: string, confirmLabel: string, onConfirm: () => void): void {
  if (Platform.OS === "web") {
    const confirmed = window.confirm(`${title}\n\n${message}`);
    if (confirmed) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: confirmLabel, style: "destructive", onPress: onConfirm },
  ]);
}