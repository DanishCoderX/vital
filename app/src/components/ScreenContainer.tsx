import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useAppContext } from "../lib/AppContext";

interface ScreenContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function ScreenContainer({ title, subtitle, children }: ScreenContainerProps) {
  const { theme } = useAppContext();
  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: theme.inkSoft }]}>{subtitle}</Text>}
      </View>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 16, maxWidth: 720, width: "100%", alignSelf: "center" },
  header: { marginBottom: 4 },
  title: { fontSize: 26, fontWeight: "700" },
  subtitle: { fontSize: 13, marginTop: 2 },
});
