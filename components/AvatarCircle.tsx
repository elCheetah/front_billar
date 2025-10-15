// components/AvatarCircle.tsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function getInitials(fullName?: string) {
  const safe = (fullName || "").trim();
  if (!safe) return "?";
  const parts = safe.split(/\s+/);
  const a = (parts[0]?.[0] || "").toUpperCase();
  const b = (parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1]) || "";
  return (a + b).toUpperCase();
}

// color estable (HSL) a partir del nombre/correo
function colorFromString(seed = "user") {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 48%)`;
}

export default function AvatarCircle({
  name,
  size = 32,
  onPress,
  overrideColor,
}: {
  name?: string;              // <- opcional
  size?: number;
  onPress?: () => void;
  overrideColor?: string;
}) {
  const initials = getInitials(name);
  const bg = overrideColor ?? colorFromString(name || "user");

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <View
        style={[
          styles.circle,
          { backgroundColor: bg, width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Text style={[styles.text, { fontSize: Math.max(12, size * 0.45) }]}>{initials}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  circle: { alignItems: "center", justifyContent: "center" },
  text: { color: "#fff", fontWeight: "700" },
});
