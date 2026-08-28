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
import { parseOfflineAssetId } from "../../services/offlineAssetService";
import { fetchPublicOfflineAsset } from "../../services/publicOfflineAssetService";
import { fetchPublicDeviceLookup, parseDeviceQrValue } from "../../services/deviceLookupService";
import { ApiError } from "../../services/apiClient";

type Props = { onExit: () => void };

// Guest counterpart to ScanAssetScreen — same camera/scan-lock mechanics,
// but resolves the scanned QR through the unauthenticated
// /api/public/offline-assets/:id lookup instead of the logged-in mobile
// one, since a guest never has a session token.
export default function GuestScanScreen({ onExit }: Props) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
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
        if (offlineId) {
          const asset = await fetchPublicOfflineAsset(offlineId);
          navigation.navigate("GuestReport", { kind: "offline", assetId: offlineId, asset });
        } else if (device) {
          const info = await fetchPublicDeviceLookup(device.agent, device.assetId);
          navigation.navigate("GuestReport", {
            kind: "online",
            agent: device.agent,
            assetId: device.assetId,
            asset: {
              assetTag: info.deviceId,
              name: info.name,
              type: info.platform || "Other",
              manufacturer: "",
              model: info.model,
              serialNumber: "",
              branch: info.groupPath,
              department: info.department,
              owner: "",
              status: info.status,
            },
          });
        }
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
        <TouchableOpacity style={[styles.backButton, { top: insets.top + 12 }]} onPress={onExit} activeOpacity={0.85}>
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.7} />
          <Text style={styles.backText}>Exit Guest Mode</Text>
        </TouchableOpacity>

        <View style={styles.permissionIcon}>
          <QrCode size={32} color={colors.white} strokeWidth={2.4} />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          Camera access is needed to scan an asset's QR code and report an issue.
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
        <TouchableOpacity style={[styles.backButton, { top: insets.top + 12 }]} onPress={onExit} activeOpacity={0.85}>
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.7} />
          <Text style={styles.backText}>Exit Guest Mode</Text>
        </TouchableOpacity>

        <View style={styles.frameWrap} pointerEvents="none">
          <View style={styles.frame}>
            <ScanLine size={28} color={colors.white} strokeWidth={2} style={{ opacity: 0.85 }} />
          </View>
          <Text style={styles.frameHint}>
            {loading ? "Loading asset details..." : "Align the asset's QR code within the frame"}
          </Text>
          {loading ? <ActivityIndicator color={colors.white} style={{ marginTop: 14 }} /> : null}
        </View>
      </View>
    </View>
  );
}

const FRAME_SIZE = 250;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.black },
  centered: { alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.28)" },
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
  backText: { color: colors.text, fontSize: 12, fontWeight: "900", marginLeft: 6 },
  frameWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
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
  permissionTitle: { color: colors.text, fontSize: 18, fontWeight: "900", marginBottom: 8 },
  permissionText: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 22,
  },
});
