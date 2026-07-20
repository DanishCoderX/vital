import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/lib/AuthContext";
import AuthGate from "./src/navigation/AuthGate";

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <AuthGate />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </AuthProvider>
  );
}
