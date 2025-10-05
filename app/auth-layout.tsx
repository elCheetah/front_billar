import { Slot, useRouter } from "expo-router";
import React, { useState } from "react";
import { Button, View } from "react-native";

export default function AuthLayout() {
  const [logged, setLogged] = useState(false);
  const router = useRouter();

  if (!logged) {
    return <Slot />; // Muestra las pantallas login/register/recover
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Aquí redirige al drawer (_layout.tsx) */}
      <Button title="Ir al menú principal" onPress={() => router.replace("/")} />
    </View>
  );
}
