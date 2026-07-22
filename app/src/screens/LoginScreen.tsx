import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../lib/AuthContext";
import { lightTheme as theme } from "../theme";
import GoogleSignInButton from "../components/GoogleSignInButton";

interface LoginScreenProps {
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
}

export default function LoginScreen({ onSwitchToSignup, onSwitchToForgotPassword }: LoginScreenProps) {
  const { login, loginWithGoogleIdToken, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch {
      // error already captured in auth context state
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleToken(idToken: string) {
    setSubmitting(true);
    try {
      await loginWithGoogleIdToken(idToken);
    } catch {
      // error already captured in auth context state
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.ink }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: theme.inkSoft }]}>Log in to sync your data everywhere</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.inkSoft}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, { borderColor: theme.hairline, color: theme.ink }]}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={theme.inkSoft}
          secureTextEntry
          style={[styles.input, { borderColor: theme.hairline, color: theme.ink }]}
        />

        <TouchableOpacity onPress={onSwitchToForgotPassword} style={styles.forgotLink}>
          <Text style={{ color: theme.aqua, fontSize: 13, fontWeight: "600" }}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={submitting || !email || !password}
          style={[styles.primaryButton, { backgroundColor: theme.aqua, opacity: submitting ? 0.7 : 1 }]}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Log In</Text>}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: theme.hairline }]} />
          <Text style={[styles.dividerText, { color: theme.inkSoft }]}>or</Text>
          <View style={[styles.divider, { backgroundColor: theme.hairline }]} />
        </View>

        <GoogleSignInButton onIdToken={handleGoogleToken} label="Log in with Google" />

        <TouchableOpacity onPress={onSwitchToSignup} style={styles.switchLink}>
          <Text style={{ color: theme.inkSoft, fontSize: 13 }}>
            Don't have an account? <Text style={{ color: theme.aqua, fontWeight: "700" }}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: "center", padding: 24, maxWidth: 420, width: "100%", alignSelf: "center" },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  error: { color: "#D64545", marginBottom: 12, fontSize: 13 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 15 },
  primaryButton: { paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 8 },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 10 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  switchLink: { marginTop: 20, alignItems: "center" },
  forgotLink: { alignItems: "flex-end", marginBottom: 16, marginTop: -4 },
});
