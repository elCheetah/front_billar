// app/(principal)/_layout.tsx
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import AvatarCircle from "../../components/AvatarCircle";
import { clearAuth, getToken, getUser } from "../../utils/authStorage";

type UserShape = {
  id: number;
  correo: string;
  nombreCompleto: string;
  rol: string;
};

export default function LayoutPrincipal() {
  const router = useRouter();
  const [user, setUser] = useState<UserShape | null>(null);

  useEffect(() => {
    (async () => {
      const [token, u] = await Promise.all([getToken(), getUser()]);
      if (!token || !u) {
        router.replace("/autenticacion");
        return;
      }
      setUser(u);
    })();
  }, []);

  return (
    <Drawer
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: "#0066FF" },
        headerTintColor: "#FFFFFF",
        headerRight: () =>
          user ? (
            <TouchableOpacity
              style={{ marginRight: 14 }}
              onPress={() => router.push("/(principal)/configuracion")}
            >
              <AvatarCircle name={user?.nombreCompleto} size={32} />
            </TouchableOpacity>
          ) : null,
      }}
      drawerContent={(props) => (
        <CustomDrawerContent
          {...props}
          user={user}
          onLogout={async () => {
            await clearAuth();
            router.replace("/autenticacion");
          }}
        />
      )}
    >
      <Drawer.Screen name="index" options={{ title: "Inicio" }} />
      <Drawer.Screen name="reservas" options={{ title: "Reservas" }} />
      <Drawer.Screen name="mesas" options={{ title: "Mesas" }} />
      <Drawer.Screen name="usuarios" options={{ title: "Usuarios" }} />
      <Drawer.Screen
        name="configuracion"
        options={{ title: "Configuración" }}
      />
    </Drawer>
  );
}

type CustomDrawerProps = DrawerContentComponentProps & {
  user: UserShape | null;
  onLogout: () => void | Promise<void>;
};

function CustomDrawerContent({ user, onLogout, ...props }: CustomDrawerProps) {
  return (
    <DrawerContentScrollView {...props}>
      {/* Encabezado con avatar + nombre */}
      <View style={styles.header}>
        <AvatarCircle name={user?.nombreCompleto} size={56} />
        <View style={{ marginLeft: 12, flexShrink: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {user?.nombreCompleto || "Invitado"}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {user?.correo || ""}
          </Text>
        </View>
      </View>

      <DrawerItemList {...props} />

      {/* Footer: nombre y botón de cerrar sesión */}
      <View style={styles.footer}>
        <Text style={styles.footerName} numberOfLines={1}>
          {user?.nombreCompleto || ""}
        </Text>
        <DrawerItem
          label="Cerrar sesión"
          onPress={onLogout}
          labelStyle={{ color: "#FF4B4B", fontWeight: "700" }}
          style={{ borderTopWidth: 1, borderTopColor: "#EEE" }}
        />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 24,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    marginBottom: 8,
  },
  name: { fontSize: 16, fontWeight: "800", color: "#0033A0" },
  email: { fontSize: 12, color: "#666" },
  footer: { marginTop: 16, paddingHorizontal: 12 },
  footerName: { color: "#888", fontSize: 12, marginBottom: 6 },
});
