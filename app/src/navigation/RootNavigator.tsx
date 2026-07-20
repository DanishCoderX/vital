import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import DashboardScreen from "../screens/DashboardScreen";
import WorkoutsScreen from "../screens/WorkoutsScreen";
import StepsScreen from "../screens/StepsScreen";
import HydrationScreen from "../screens/HydrationScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { useAppContext } from "../lib/AppContext";

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Dashboard: "🏠",
  Workouts: "🏋️",
  Steps: "👟",
  Hydration: "💧",
  Settings: "⚙️",
};

export default function RootNavigator() {
  const { theme } = useAppContext();

  return (
    <NavigationContainer
      theme={{
        dark: theme.mode === "dark",
        colors: {
          primary: theme.aqua,
          background: theme.background,
          card: theme.surface,
          text: theme.ink,
          border: theme.hairline,
          notification: theme.coral,
        },
        fonts: {
          regular: { fontFamily: "System", fontWeight: "400" },
          medium: { fontFamily: "System", fontWeight: "500" },
          bold: { fontFamily: "System", fontWeight: "700" },
          heavy: { fontFamily: "System", fontWeight: "800" },
        },
      }}
    >
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: theme.aqua,
          tabBarInactiveTintColor: theme.inkSoft,
          tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.hairline },
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>{TAB_ICONS[route.name]}</Text>,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Workouts" component={WorkoutsScreen} />
        <Tab.Screen name="Steps" component={StepsScreen} />
        <Tab.Screen name="Hydration" component={HydrationScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
