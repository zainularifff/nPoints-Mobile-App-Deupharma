import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";

import OverviewStack from "./OverviewStack";
import AssetsStack from "./AssetsStack";
import ReportsStack from "./ReportsStack";
import SettingsScreen from "../screens/settings/SettingsScreen";
import { accentGlow, colors } from "../theme/colors";

export type MainTabParamList = {
  Overview: undefined;
  Assets: undefined;
  CreateTicketAction: undefined;
  Reports: undefined;
  Settings: undefined;
};

type MainTabsProps = { onLogout: () => void };

const Tab = createBottomTabNavigator<MainTabParamList>();

// Filled icon when active, outline when inactive.
const tabIcons: Partial<Record<
  keyof MainTabParamList,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
>> = {
  Overview: { active: "grid", inactive: "grid-outline" },
  Assets: { active: "cube", inactive: "cube-outline" },
  Reports: { active: "document-text", inactive: "document-text-outline" },
  Settings: { active: "settings", inactive: "settings-outline" },
};

// The center "+" is never actually navigated to — its tabPress listener
// (below) intercepts the press and jumps into Overview's CreateTicket
// screen instead, so this route just needs to exist to reserve the middle
// tab bar slot. Kept intentionally empty rather than reusing a real screen,
// so it can never flash on-screen if the intercept somehow doesn't fire.
function CreateTicketActionScreen() {
  return null;
}

export default function MainTabs({ onLogout }: MainTabsProps) {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.blueBright,
        tabBarInactiveTintColor: colors.muted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: "700",
          letterSpacing: 0.3,
        },
        tabBarItemStyle: {
          paddingTop: 8,
        },
        // Standard docked bar, full width, anchored to the bottom edge.
        tabBarStyle: {
          height: 58 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 8,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarIcon: ({ color, focused }) => {
          const icons = tabIcons[route.name as keyof MainTabParamList];
          if (!icons) return null;
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={22}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Overview" component={OverviewStack} />
      <Tab.Screen name="Assets" component={AssetsStack} />
      <Tab.Screen
        name="CreateTicketAction"
        component={CreateTicketActionScreen}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => <CreateTicketFabButton {...props} />,
        }}
        listeners={({ navigation }: any) => ({
          tabPress: (e: any) => {
            e.preventDefault();
            navigation.navigate("Overview", { screen: "CreateTicket" });
          },
        })}
      />
      <Tab.Screen name="Reports" component={ReportsStack} />
      <Tab.Screen name="Settings">
        {() => <SettingsScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Elevated circular button, same "+" role the KWSP app's bottom nav uses —
// floats above the bar instead of sitting flush with the other 4 icons.
function CreateTicketFabButton({ onPress, accessibilityState }: any) {
  return (
    <View style={styles.fabWrap} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={onPress}
        accessibilityState={accessibilityState}
        accessibilityLabel="Create Ticket"
      >
        <Plus size={26} color={colors.white} strokeWidth={2.8} />
      </TouchableOpacity>
    </View>
  );
}

const FAB_SIZE = 56;

const styles = StyleSheet.create({
  fabWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -22,
    borderWidth: 4,
    borderColor: colors.surface,
    ...accentGlow,
  },
});
