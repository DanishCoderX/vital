import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { useAppContext } from "../lib/AppContext";

interface BarChartProps {
  labels: string[];
  values: number[];
  color?: string;
  height?: number;
  valueSuffix?: string;
}

export default function BarChart({ labels, values, color, height = 140, valueSuffix = "" }: BarChartProps) {
  const { theme } = useAppContext();
  const barColor = color ?? theme.aqua;
  const max = Math.max(1, ...values);
  const barWidth = 100 / values.length;

  return (
    <View>
      <View style={{ height, flexDirection: "row", alignItems: "flex-end" }}>
        <Svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
          {values.map((v, i) => {
            const barHeight = max > 0 ? (v / max) * (height - 4) : 0;
            const x = i * barWidth + barWidth * 0.2;
            const w = barWidth * 0.6;
            return (
              <Rect
                key={i}
                x={x}
                y={height - barHeight}
                width={w}
                height={barHeight}
                rx={2}
                fill={barColor}
              />
            );
          })}
        </Svg>
      </View>
      <View style={styles.labelsRow}>
        {labels.map((label, i) => (
          <Text key={i} style={[styles.label, { color: theme.inkSoft }]} numberOfLines={1}>
            {label}
          </Text>
        ))}
      </View>
      <Text style={[styles.maxLabel, { color: theme.inkSoft }]}>
        Peak: {max}
        {valueSuffix}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  labelsRow: { flexDirection: "row", marginTop: 6 },
  label: { flex: 1, textAlign: "center", fontSize: 10 },
  maxLabel: { fontSize: 10, textAlign: "right", marginTop: 4 },
});
