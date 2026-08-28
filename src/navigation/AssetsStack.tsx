import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AssetsHomeScreen from "../screens/assets/AssetsHomeScreen";
import ActiveDeviceListScreen from "../screens/endpoint/ActiveDeviceListScreen";
import DeviceQuickViewScreen from "../screens/endpoint/DeviceQuickViewScreen";
import OfflineAssetInventoryScreen from "../screens/assets/OfflineAssetInventoryScreen";
import OfflineAssetDetailScreen from "../screens/assets/OfflineAssetDetailScreen";
import ScanAssetScreen from "../screens/scan/ScanAssetScreen";
import CreateTicketScreen from "../screens/ticket/CreateTicketScreen";
import TicketConfirmationScreen from "../screens/ticket/TicketConfirmationScreen";

// Own top-level stack for the "Assets" tab — same screen components the
// Overview tab already registers (ActiveDeviceList, DeviceQuickView,
// OfflineAssetInventory/Detail, ScanAsset) are re-registered here too, so
// each tab keeps its own independent back-stack instead of jumping across
// tabs. CreateTicket/TicketConfirmation are included so "Report Issue" from
// an asset's detail screen, or "Scan Asset" -> prefill, stays inside this
// tab's stack rather than hopping into the Overview tab.
const Stack = createNativeStackNavigator();

export default function AssetsStack() {
  return (
    <Stack.Navigator
      initialRouteName="AssetsHome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AssetsHome" component={AssetsHomeScreen} />
      <Stack.Screen name="ActiveDeviceList" component={ActiveDeviceListScreen} />
      <Stack.Screen name="DeviceQuickView" component={DeviceQuickViewScreen} />
      <Stack.Screen name="OfflineAssetInventory" component={OfflineAssetInventoryScreen} />
      <Stack.Screen name="OfflineAssetDetail" component={OfflineAssetDetailScreen} />
      <Stack.Screen name="ScanAsset" component={ScanAssetScreen} />
      <Stack.Screen name="CreateTicket" component={CreateTicketScreen} />
      <Stack.Screen name="TicketConfirmation" component={TicketConfirmationScreen} />
    </Stack.Navigator>
  );
}
