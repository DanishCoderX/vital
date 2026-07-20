import type { ThemeMode } from "../types";

export interface Theme {
  mode: ThemeMode;
  background: string;
  surface: string;
  surfaceRaised: string;
  ink: string;
  inkSoft: string;
  hairline: string;
  aqua: string; // hydration
  coral: string; // workouts / calories
  sage: string; // steps / success
  amber: string; // badges / achievements
  danger: string;
}

export const lightTheme: Theme = {
  mode: "light",
  background: "#F4F7F7",
  surface: "#FFFFFF",
  surfaceRaised: "#EDF3F3",
  ink: "#1F2A2E",
  inkSoft: "#6B7A7E",
  hairline: "#DCE6E6",
  aqua: "#2E9CCA",
  coral: "#F0704A",
  sage: "#4E9B63",
  amber: "#D9A441",
  danger: "#D64545",
};

export const darkTheme: Theme = {
  mode: "dark",
  background: "#141A1B",
  surface: "#1C2426",
  surfaceRaised: "#232D2F",
  ink: "#EDF3F3",
  inkSoft: "#8C9A9D",
  hairline: "#2E393B",
  aqua: "#5CBADD",
  coral: "#F4886A",
  sage: "#6FBF83",
  amber: "#E8BB6B",
  danger: "#E56767",
};

export function getTheme(mode: ThemeMode): Theme {
  return mode === "dark" ? darkTheme : lightTheme;
}
