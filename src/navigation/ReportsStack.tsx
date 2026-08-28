import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ReportsScreen from "../screens/reports/ReportsScreen";
import LiveReportScreen from "../screens/reports/LiveReportScreen";

const Stack = createNativeStackNavigator();

export default function ReportsStack() {
  return (
    <Stack.Navigator
      initialRouteName="ReportsHome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ReportsHome" component={ReportsScreen} />
      <Stack.Screen name="ReportDetail" component={LiveReportScreen} />
    </Stack.Navigator>
  );
}
