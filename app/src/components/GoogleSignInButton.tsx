import { useEffect } from "react";
import { TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { lightTheme as theme } from "../theme";
import { showAlert } from "../lib/platformAlert";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = "1053961701519-cpbf5ch5epvaquqn9eqp0kuroeenigvo.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID = "1053961701519-lunu0002b1cnor4u6rc80g01g262gssa.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID = "1053961701519-qagmcqgp7oc627gmrpk9rpt453f2lbui.apps.googleusercontent.com";

interface GoogleSignInButtonProps {
  onIdToken: (idToken: string) => void;
  label?: string;
}

export default function GoogleSignInButton({ onIdToken, label = "Continue with Google" }: GoogleSignInButtonProps) {

  const redirectUri = AuthSession.makeRedirectUri({ scheme: "vital-tracker" });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
      iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    },
    { scheme: "vital-tracker" }
  );

  useEffect(() => {
    if (response?.type === "success" && response.params.id_token) {
      onIdToken(response.params.id_token);
    } else if (response?.type === "error") {
      showAlert("Google sign-in failed", response.error?.message || "Please try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const configured = Boolean(GOOGLE_WEB_CLIENT_ID || GOOGLE_IOS_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID);

  if (!configured) {
    return (
      <TouchableOpacity
        onPress={() => showAlert("Not configured", "Google sign-in needs OAuth client IDs — see README.md.")}
        style={[styles.button, { borderColor: theme.hairline, opacity: 0.5 }]}
      >
        <Text style={{ color: theme.inkSoft, fontWeight: "600" }}>{label} (not configured)</Text>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity
        disabled={!request}
        onPress={() => promptAsync()}
        style={[styles.button, { borderColor: theme.hairline }]}
      >
        <Text style={{ color: theme.ink, fontWeight: "600" }}>🔵 {label}</Text>
      </TouchableOpacity>
      {Platform.OS !== "web" && (
        <Text style={styles.debugText} selectable>
          Debug redirect URI: {redirectUri}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  debugText: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
    marginTop: 6,
  },
});