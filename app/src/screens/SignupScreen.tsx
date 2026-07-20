import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../lib/AuthContext";
import { lightTheme as theme } from "../theme";
import GoogleSignInButton from "../components/GoogleSignInButton";

interface SignupScreenProps {
  onSwitchToLogin: () => void;
}

export default function SignupScreen({ onSwitchToLogin }: SignupScreenProps) {
  const { signup, loginWithGoogleIdToken, error } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [weight, setWeight] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim() && email.trim() && password.length >= 8;

  async function handleSignup() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const weightKg = parseFloat(weight);
      await signup(email.trim(), password, name.trim(), isNaN(weightKg) ? undefined : weightKg);
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
        <Text style={[styles.title, { color: theme.ink }]}>Create your account</Text>
        <Text style={[styles.subtitle, { color: theme.inkSoft }]}>
          Your data syncs automatically across every device you log in on
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name"
          placeholderTextColor={theme.inkSoft}
          style={[styles.input, { borderColor: theme.hairline, color: theme.ink }]}
        />
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
          placeholder="Password (min. 8 characters)"
          placeholderTextColor={theme.inkSoft}
          secureTextEntry
          style={[styles.input, { borderColor: theme.hairline, color: theme.ink }]}
        />
        <TextInput
          value={weight}
          onChangeText={setWeight}
          placeholder="Your weight in kg (optional, improves calorie accuracy)"
          placeholderTextColor={theme.inkSoft}
          keyboardType="decimal-pad"
          style={[styles.input, { borderColor: theme.hairline, color: theme.ink }]}
        />

        <TouchableOpacity
          onPress={handleSignup}
          disabled={submitting || !canSubmit}
          style={[styles.primaryButton, { backgroundColor: theme.coral, opacity: submitting || !canSubmit ? 0.6 : 1 }]}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign Up</Text>}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: theme.hairline }]} />
          <Text style={[styles.dividerText, { color: theme.inkSoft }]}>or</Text>
          <View style={[styles.divider, { backgroundColor: theme.hairline }]} />
        </View>

        <GoogleSignInButton onIdToken={handleGoogleToken} label="Sign up with Google" />

        <TouchableOpacity onPress={onSwitchToLogin} style={styles.switchLink}>
          <Text style={{ color: theme.inkSoft, fontSize: 13 }}>
            Already have an account? <Text style={{ color: theme.aqua, fontWeight: "700" }}>Log in</Text>
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
});
