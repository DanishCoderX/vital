import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../lib/AuthContext";
import { lightTheme as theme } from "../theme";
import { showAlert } from "../lib/platformAlert";

interface ForgotPasswordScreenProps {
  onSwitchToLogin: () => void;
}

type Step = "request" | "reset";

export default function ForgotPasswordScreen({ onSwitchToLogin }: ForgotPasswordScreenProps) {
  const { requestPasswordReset, resetPasswordWithCode, error } = useAuth();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleRequestCode() {
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setStep("reset");
      showAlert("Check your email", "If an account exists for that email, a 6-digit reset code is on its way.");
    } catch {
      // error already captured in auth context state
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword() {
    if (!code.trim() || newPassword.length < 8) return;
    setSubmitting(true);
    try {
      await resetPasswordWithCode(email.trim(), code.trim(), newPassword);
      // Success takes the user straight into the app, same as a normal login — AuthGate handles the transition.
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
        <Text style={[styles.title, { color: theme.ink }]}>Reset your password</Text>
        <Text style={[styles.subtitle, { color: theme.inkSoft }]}>
          {step === "request"
            ? "Enter your account email and we'll send you a 6-digit reset code."
            : `Enter the code sent to ${email} along with your new password.`}
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        {step === "request" ? (
          <>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={theme.inkSoft}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, { borderColor: theme.hairline, color: theme.ink }]}
            />
            <TouchableOpacity
              onPress={handleRequestCode}
              disabled={submitting || !email.trim()}
              style={[styles.primaryButton, { backgroundColor: theme.aqua, opacity: submitting ? 0.7 : 1 }]}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Send Reset Code</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="6-digit code"
              placeholderTextColor={theme.inkSoft}
              keyboardType="number-pad"
              maxLength={6}
              style={[styles.input, { borderColor: theme.hairline, color: theme.ink }]}
            />
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New password (min. 8 characters)"
              placeholderTextColor={theme.inkSoft}
              secureTextEntry
              style={[styles.input, { borderColor: theme.hairline, color: theme.ink }]}
            />
            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={submitting || !code.trim() || newPassword.length < 8}
              style={[styles.primaryButton, { backgroundColor: theme.aqua, opacity: submitting ? 0.7 : 1 }]}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Reset Password</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep("request")} style={styles.switchLink}>
              <Text style={{ color: theme.inkSoft, fontSize: 13 }}>Didn't get a code? Try again</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={onSwitchToLogin} style={styles.switchLink}>
          <Text style={{ color: theme.inkSoft, fontSize: 13 }}>
            Remember your password? <Text style={{ color: theme.aqua, fontWeight: "700" }}>Log in</Text>
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
  switchLink: { marginTop: 20, alignItems: "center" },
});
