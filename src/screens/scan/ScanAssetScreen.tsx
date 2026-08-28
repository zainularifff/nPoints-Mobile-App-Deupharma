import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, QrCode, ScanLine } from "lucide-react-native";

import AppButton from "../../components/AppButton";
import { colors } from "../../theme/colors";
import { fetchOfflineAsset, parseOfflineAssetId } from "../../services/offlineAssetService";
import { fetchPublicDeviceLookup, parseDeviceQrValue } from "../../services/deviceLookupService";
import { ApiError } from "../../services/apiClient";

export default function ScanAssetScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  // Guards against the camera firing onBarcodeScanned repeatedly for the
  // same code while a lookup request is already in flight.
  const scanLockRef = useRef(false);

  const resetScanLock = useCallback(() => {
    scanLockRef.current = false;
  }, []);

  const handleBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      if (scanLockRef.current) return;
      scanLockRef.current = true;

      const offlineId = parseOfflineAssetId(result.data);
      const device = offlineId ? null : parseDeviceQrValue(result.data);

      if (!offlineId && !device) {
        Alert.alert(
          "QR Not Recognized",
          "This QR code is not an EMA asset. Please scan a valid Offline Asset or device QR code.",
          [{ text: "OK", onPress: resetScanLock }]
        );
        return;
      }

      setLoading(true);
      try {
        // If Create Ticket is already open earlier in the stack (user
        // tapped "Scan QR" from the form itself), this pops back to that
        // same instance with the new params instead of pushing a second
        // copy — see CreateTicketScreen's useFocusEffect on
        // route.params.prefillAsset, which applies this and clears the
        // param so it can't reapply on a later unrelated focus.
        if (offlineId) {
          const asset = await fetchOfflineAsset(offlineId);
          navigation.navigate("CreateTicket", { prefillAsset: asset });
        } else if (device) {
          const info = await fetchPublicDeviceLookup(device.agent, device.assetId);
          navigation.navigate("CreateTicket", {
            prefillAsset: {
              id: info.deviceId,
              assetTag: info.deviceId,
              name: info.name,
              type: "Other",
              manufacturer: "",
              model: info.model,
              os: info.platform,
              branch: info.groupPath,
              department: info.department,
              status: info.status,
            },
          });
        }
        // Lock stays engaged until this screen regains focus (see
        // useIsFocused reset below) so re-navigating back here doesn't
        // immediately re-trigger a scan of the same code still in frame.
      } catch (error: any) {
        const message =
          error instanceof ApiError ? error.message : "Failed to load asset. Please try again.";
        Alert.alert("Scan Failed", message, [{ text: "OK", onPress: resetScanLock }]);
      } finally {
        setLoading(false);
      }
    },
    [navigation, resetScanLock]
  );

  React.useEffect(() => {
    if (isFocused) resetScanLock();
  }, [isFocused, resetScanLock]);

  if (!permission) {
    return (
      <View style={[styles.page, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.blue} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.page,
          styles.centered,
          { paddingTop: insets.top + 24, backgroundColor: colors.background },
        ]}
      >
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 12 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.7} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.permissionIcon}>
          <QrCode size={32} color={colors.white} strokeWidth={2.4} />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          OPS Mobile needs camera access to scan an asset's QR code and pull up its details.
        </Text>

        {permission.canAskAgain ? (
          <AppButton title="Allow Camera Access" onPress={requestPermission} />
        ) : (
          <AppButton title="Open Settings" onPress={() => Linking.openSettings()} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.page}>
      {isFocused ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={loading ? undefined : handleBarcodeScanned}
        />
      ) : null}

      <View style={styles.overlay} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 12 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.7} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.frameWrap} pointerEvents="none">
          <View style={styles.frame}>
            <ScanLine size={28} color={colors.white} strokeWidth={2} style={styles.frameIcon} />
          </View>
          <Text style={styles.frameHint}>
            {loading ? "Loading asset details..." : "Align the asset's QR code within the frame"}
          </Text>
          {loading ? (
            <ActivityIndicator color={colors.white} style={{ marginTop: 14 }} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const FRAME_SIZE = 250;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.black,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  backButton: {
    position: "absolute",
    left: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  backText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 6,
  },
  frameWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  frameIcon: {
    opacity: 0.85,
  },
  frameHint: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 18,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  permissionIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  permissionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },
  permissionText: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 22,
  },
});
