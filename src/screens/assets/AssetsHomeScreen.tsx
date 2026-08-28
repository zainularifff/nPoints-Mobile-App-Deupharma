import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Boxes, ChevronRight, MonitorCog } from "lucide-react-native";

import { fetchEndpointDevices } from "../../services/opsMobileService";
import { fetchOfflineAssetInventory } from "../../services/offlineAssetService";
import { formatNumber } from "../../utils/formatters";
import { drilldownPalette } from "../../theme/colors";

const ui = drilldownPalette;

export default function AssetsHomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [endpointTotal, setEndpointTotal] = useState<number | null>(null);
  const [offlineTotal, setOfflineTotal] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchEndpointDevices({ status: "all" })
      .then((rows) => {
        if (isMounted) setEndpointTotal(rows.length);
      })
      .catch(() => {
        // Card simply omits the count if this fails.
      });

    fetchOfflineAssetInventory()
      .then((rows) => {
        if (isMounted) setOfflineTotal(rows.length);
      })
      .catch(() => {
        // Card simply omits the count if this fails.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 104 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ height: insets.top, backgroundColor: ui.navy }} />
      <LinearGradient colors={[ui.navy, ui.navy2, "#3B33C4"]} style={styles.hero}>
        <View style={styles.heroOrb} />
        <Text style={styles.eyebrow}>ASSET MANAGEMENT</Text>
        <Text style={styles.title}>Assets</Text>
        <Text style={styles.meta}>Managed endpoints and manually catalogued offline assets.</Text>
      </LinearGradient>

      <View style={styles.cardStack}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.88}
          onPress={() => navigation.navigate("ActiveDeviceList", { status: "all" })}
        >
          <View style={[styles.cardIcon, { backgroundColor: "rgba(79, 70, 229, 0.12)" }]}>
            <MonitorCog size={24} color={ui.blue} strokeWidth={2.6} />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>Managed Asset Inventory</Text>
            <Text style={styles.cardSubtitle}>
              {endpointTotal === null ? "Live devices with a monitoring agent" : `${formatNumber(endpointTotal)} devices tracked`}
            </Text>
          </View>
          <ChevronRight size={20} color={ui.muted} strokeWidth={2.6} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.88}
          onPress={() => navigation.navigate("OfflineAssetInventory")}
        >
          <View style={[styles.cardIcon, { backgroundColor: "rgba(8, 145, 178, 0.12)" }]}>
            <Boxes size={24} color={ui.cyan} strokeWidth={2.6} />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>Offline Asset Inventory</Text>
            <Text style={styles.cardSubtitle}>
              {offlineTotal === null ? "Devices without a monitoring agent" : `${formatNumber(offlineTotal)} assets logged`}
            </Text>
          </View>
          <ChevronRight size={20} color={ui.muted} strokeWidth={2.6} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.88}
          onPress={() => navigation.navigate("ScanAsset")}
        >
          <View style={[styles.cardIcon, { backgroundColor: "rgba(217, 119, 6, 0.12)" }]}>
            <Boxes size={24} color={ui.amber} strokeWidth={2.6} />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>Scan Asset QR</Text>
            <Text style={styles.cardSubtitle}>Look up a device and log an issue instantly</Text>
          </View>
          <ChevronRight size={20} color={ui.muted} strokeWidth={2.6} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: ui.bg },
  hero: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, overflow: "hidden" },
  heroOrb: { position: "absolute", width: 220, height: 220, borderRadius: 220, backgroundColor: "rgba(14,143,166,0.35)", top: -110, right: -80 },
  eyebrow: { color: "#9DC2FF", fontSize: 11, fontWeight: "900", letterSpacing: 1.25 },
  title: { color: "#FFFFFF", fontSize: 27, fontWeight: "900", letterSpacing: -1, marginTop: 6 },
  meta: { color: "#B5C7DE", fontSize: 11.5, fontWeight: "700", marginTop: 8, lineHeight: 16 },
  cardStack: { paddingHorizontal: 16, marginTop: -16, gap: 12 },
  card: {
    backgroundColor: ui.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: ui.line,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
  cardIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 14 },
  cardTextWrap: { flex: 1 },
  cardTitle: { color: ui.ink, fontSize: 15, fontWeight: "900" },
  cardSubtitle: { color: ui.soft, fontSize: 11.5, fontWeight: "700", marginTop: 3 },
});
