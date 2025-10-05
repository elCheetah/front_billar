import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React from "react";
import { Button } from "react-native";

export default function Layout() {
  const router = useRouter();

  return (
    <Drawer>
      <Drawer.Screen name="index" options={{ title: "Inicio" }} />
      <Drawer.Screen name="reservas" options={{ title: "Reservas" }} />
      <Drawer.Screen name="mesas" options={{ title: "Mesas" }} />
      <Drawer.Screen name="usuarios" options={{ title: "Usuarios" }} />
      <Drawer.Screen
        name="configuracion"
        options={{
          title: "Configuración",
          headerRight: () => (
            <Button title="Cerrar Sesión" onPress={() => router.replace("/login")} />
          ),
        }}
      />
    </Drawer>
  );
}
