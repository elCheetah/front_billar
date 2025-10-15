import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function getInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => (w[0] || "").toUpperCase())
    .join("");
}

// Hash simple y color estable (HSL) a partir del nombre/correo
function colorFromString(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0; // 32-bit
  }
  const hue = Math.abs(hash) % 360;     // 0..359
  const saturation = 70;                 // % (más vivo)
  const lightness = 48;                  // % (legible)
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export default function AvatarCircle({
  name,
  size = 32,
  onPress,
  overrideColor,
}: {
  name: string;
  size?: number;
  onPress?: () => void;
  /** si quieres forzar un color manualmente */
  overrideColor?: string;
}) {
  const initials = getInitials(name || "");
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
        <Text style={[styles.text, { fontSize: size * 0.45 }]}>{initials || "?"}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  circle: { alignItems: "center", justifyContent: "center" },
  text: { color: "#fff", fontWeight: "700" },
});
