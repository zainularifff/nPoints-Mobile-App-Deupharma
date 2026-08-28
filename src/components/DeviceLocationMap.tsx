import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { colors } from "../theme/colors";
import { radius } from "../theme/spacing";
import { isValidCoordinate, lonLatToTilePoint, osmTileUrl } from "../utils/staticMap";

type Props = {
  latitude: unknown;
  longitude: unknown;
  size?: number;
  zoom?: number;
};

// Static map preview built from public OpenStreetMap tiles — no API key,
// no native map module, works with a plain JS reload. Stitches a 3x3 tile
// grid so the pinned coordinate always lands near the center of the frame.
export default function DeviceLocationMap({ latitude, longitude, size = 220, zoom = 16 }: Props) {
  const [failedTiles, setFailedTiles] = useState(0);
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!isValidCoordinate(lat, lon)) {
    return (
      <View style={[styles.fallback, { width: size, height: size }]}>
        <Ionicons name="location-outline" size={26} color={colors.muted} />
        <Text style={styles.fallbackText}>No coordinates available</Text>
      </View>
    );
  }

  const point = lonLatToTilePoint(lon, lat, zoom);
  const tileDisplaySize = size / 3;
  const pinLeft = tileDisplaySize * (1 + point.fracX);
  const pinTop = tileDisplaySize * (1 + point.fracY);

  const allTilesFailed = failedTiles >= 9;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {allTilesFailed ? (
        <View style={[styles.fallback, { width: size, height: size, position: "absolute" }]}>
          <Ionicons name="cloud-offline-outline" size={26} color={colors.muted} />
          <Text style={styles.fallbackText}>Map tiles unavailable right now</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {[-1, 0, 1].map((dy) => (
            <View key={dy} style={styles.gridRow}>
              {[-1, 0, 1].map((dx) => (
                <Image
                  key={dx}
                  source={{ uri: osmTileUrl(point.tileX + dx, point.tileY + dy, zoom) }}
                  style={{ width: tileDisplaySize, height: tileDisplaySize }}
                  onError={() => setFailedTiles((current) => current + 1)}
                />
              ))}
            </View>
          ))}
        </View>
      )}

      {!allTilesFailed ? (
        <View style={[styles.pin, { left: pinLeft - 14, top: pinTop - 28 }]} pointerEvents="none">
          <Ionicons name="location" size={28} color={colors.red} />
        </View>
      ) : null}

      <View style={styles.attribution}>
        <Text style={styles.attributionText}>© OpenStreetMap, © CARTO</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
  },
  gridRow: {
    flexDirection: "row",
  },
  pin: {
    position: "absolute",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceHigh,
    gap: 8,
  },
  fallbackText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  attribution: {
    position: "absolute",
    bottom: 4,
    right: 6,
    backgroundColor: "rgba(6, 11, 21, 0.6)",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  attributionText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 8,
    fontWeight: "600",
  },
});
