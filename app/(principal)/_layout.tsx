import { Drawer } from "expo-router/drawer";

export default function LayoutPrincipal() {
  return (
    <Drawer
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: "#0066FF" },
        headerTintColor: "#FFFFFF",
      }}
    >
      <Drawer.Screen name="index" options={{ title: "Inicio" }} />
      <Drawer.Screen name="reservas" options={{ title: "Reservas" }} />
      <Drawer.Screen name="mesas" options={{ title: "Mesas" }} />
      <Drawer.Screen name="usuarios" options={{ title: "Usuarios" }} />
      <Drawer.Screen name="configuracion" options={{ title: "Configuración" }} />
    </Drawer>
  );
}
