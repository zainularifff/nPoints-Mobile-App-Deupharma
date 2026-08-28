import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import GuestScanScreen from "../screens/guest/GuestScanScreen";
import GuestReportScreen from "../screens/guest/GuestReportScreen";
import GuestConfirmationScreen from "../screens/guest/GuestConfirmationScreen";

type Props = { onExit: () => void };

const Stack = createNativeStackNavigator();

// Guest mode's entire navigable surface: scan -> report -> confirmation,
// nothing else. No MainTabs, no dashboards — "Continue as Guest" on Login
// exists for exactly one job (report an offline asset issue without an
// account), so this stack deliberately can't reach anywhere beyond that.
export default function GuestStack({ onExit }: Props) {
  return (
    <Stack.Navigator initialRouteName="GuestScan" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GuestScan">{() => <GuestScanScreen onExit={onExit} />}</Stack.Screen>
      <Stack.Screen name="GuestReport" component={GuestReportScreen} />
      <Stack.Screen name="GuestConfirmation">
        {() => <GuestConfirmationScreen onExit={onExit} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
