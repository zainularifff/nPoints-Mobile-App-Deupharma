import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import OverviewHomeScreen from "../screens/overview/OverviewHomeScreen";
import TaskListScreen from "../screens/overview/TaskListScreen";
import AgingDevicesScreen from "../screens/overview/AgingDevicesScreen";
import ActiveDeviceListScreen from "../screens/endpoint/ActiveDeviceListScreen";
import DeviceQuickViewScreen from "../screens/endpoint/DeviceQuickViewScreen";
import GeolocationSummaryScreen from "../screens/geolocation/GeolocationSummaryScreen";
import GeolocationHistoryScreen from "../screens/geolocation/GeolocationHistoryScreen";
import PatchComplianceScreen from "../screens/patch/PatchComplianceScreen";
import PatchDeviceListScreen from "../screens/patch/PatchDeviceListScreen";
import DeviceRiskScreen from "../screens/risk/DeviceRiskScreen";
import SoftwareOverviewScreen from "../screens/software/SoftwareOverviewScreen";
import AlertsScreen from "../screens/alerts/AlertsScreen";
import TicketSummaryScreen from "../screens/ticket/TicketSummaryScreen";
import TicketWorkloadListScreen from "../screens/ticket/TicketWorkloadListScreen";
import TicketQuickViewScreen from "../screens/ticket/TicketQuickViewScreen";
import CreateTicketScreen from "../screens/ticket/CreateTicketScreen";
import TicketConfirmationScreen from "../screens/ticket/TicketConfirmationScreen";
import ScanAssetScreen from "../screens/scan/ScanAssetScreen";
import OfflineAssetInventoryScreen from "../screens/assets/OfflineAssetInventoryScreen";
import OfflineAssetDetailScreen from "../screens/assets/OfflineAssetDetailScreen";

const Stack = createNativeStackNavigator();

export default function OverviewStack() {
  return (
    <Stack.Navigator
      initialRouteName="OverviewHome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="OverviewHome" component={OverviewHomeScreen} />
      <Stack.Screen name="TaskList" component={TaskListScreen} />
      <Stack.Screen name="AgingDevices" component={AgingDevicesScreen} />
      <Stack.Screen name="ActiveDeviceList" component={ActiveDeviceListScreen} />
      <Stack.Screen name="DeviceQuickView" component={DeviceQuickViewScreen} />
      <Stack.Screen name="GeolocationSummary" component={GeolocationSummaryScreen} />
      <Stack.Screen name="GeolocationHistory" component={GeolocationHistoryScreen} />
      <Stack.Screen name="PatchCompliance" component={PatchComplianceScreen} />
      <Stack.Screen name="PatchDeviceList" component={PatchDeviceListScreen} />
      <Stack.Screen name="DeviceRisk" component={DeviceRiskScreen} />
      <Stack.Screen name="SoftwareOverview" component={SoftwareOverviewScreen} />
      <Stack.Screen name="AlertsHome" component={AlertsScreen} />
      <Stack.Screen name="TicketSummary" component={TicketSummaryScreen} />
      <Stack.Screen name="TicketWorkloadList" component={TicketWorkloadListScreen} />
      <Stack.Screen name="TicketQuickView" component={TicketQuickViewScreen} />
      <Stack.Screen name="CreateTicket" component={CreateTicketScreen} />
      <Stack.Screen name="TicketConfirmation" component={TicketConfirmationScreen} />
      <Stack.Screen name="ScanAsset" component={ScanAssetScreen} />
      <Stack.Screen name="OfflineAssetInventory" component={OfflineAssetInventoryScreen} />
      <Stack.Screen name="OfflineAssetDetail" component={OfflineAssetDetailScreen} />
    </Stack.Navigator>
  );
}
