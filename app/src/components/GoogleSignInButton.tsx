import { useEffect, useState } from "react";
import { TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { lightTheme as theme } from "../theme";
import { showAlert } from "../lib/platformAlert";

// This must be the WEB client ID (not Android/iOS) — GoogleSignin uses it as the
// "server client ID" so the ID token it returns can be verified by our backend,
// which already expects a token issued for GOOGLE_CLIENT_ID (the web client) in .env.
const GOOGLE_WEB_CLIENT_ID = "1053961701519-cpbf5ch5epvaquqn9eqp0kuroeenigvo.apps.googleusercontent.com";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
  configured = true;
}

interface GoogleSignInButtonProps {
  onIdToken: (idToken: string) => void;
  label?: string;
}

export default function GoogleSignInButton({ onIdToken, label = "Continue with Google" }: GoogleSignInButtonProps) {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") ensureConfigured();
  }, []);

  async function handlePress() {
    if (Platform.OS === "web") {
      showAlert("Not supported on web", "Google sign-in via this button requires the native Android/iOS app. Use email/password sign-in on web for now.");
      return;
    }

    setSubmitting(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      const idToken = result.data?.idToken;
      if (!idToken) {
        throw new Error("No ID token returned from Google — check that webClientId is set correctly.");
      }
      onIdToken(idToken);
    } catch (err: any) {
      if (err?.code === statusCodes.SIGN_IN_CANCELLED) {
        // User closed the account picker — not an error, no alert needed.
      } else if (err?.code === statusCodes.IN_PROGRESS) {
        // A sign-in is already in flight — ignore the duplicate tap.
      } else if (err?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showAlert("Google Play Services required", "Please update Google Play Services and try again.");
      } else {
        showAlert("Google sign-in failed", err?.message || "Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <TouchableOpacity
      disabled={submitting}
      onPress={handlePress}
      style={[styles.button, { borderColor: theme.hairline, opacity: submitting ? 0.7 : 1 }]}
    >
      <Text style={{ color: theme.ink, fontWeight: "600" }}>🔵 {submitting ? "Signing in..." : label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
});