import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useAppContext } from "../lib/AppContext";

interface HydrationRingProps {
  currentMl: number;
  goalMl: number;
  size?: number;
}

// Simple ease-out cubic, no external dependency needed.
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function HydrationRing({ currentMl, goalMl, size = 220 }: HydrationRingProps) {
  const { theme } = useAppContext();
  const pct = Math.min(1, goalMl > 0 ? currentMl / goalMl : 0);

  // Manually tweened progress (0–1), animated via requestAnimationFrame instead of RN's
  // Animated API — avoids a cross-platform crash combining Animated with react-native-svg.
  const [animatedPct, setAnimatedPct] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = animatedPct;
    const startTime = Date.now();
    const duration = 700;

    function tick() {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      setAnimatedPct(startValue + (pct - startValue) * eased);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct]);

  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - animatedPct);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.hairline}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.aqua}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={[styles.amount, { color: theme.ink }]}>{currentMl}</Text>
      <Text style={[styles.unit, { color: theme.inkSoft }]}>of {goalMl} ml</Text>
      <Text style={[styles.pct, { color: theme.aqua }]}>{Math.round(pct * 100)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  amount: { fontSize: 32, fontWeight: "700" },
  unit: { fontSize: 13, marginTop: 2 },
  pct: { fontSize: 13, fontWeight: "600", marginTop: 6 },
});
