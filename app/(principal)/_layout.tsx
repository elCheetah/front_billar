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
import { AuthUser, Rol, clearAuth, getToken, getUser, roleLabel } from "../../utils/authStorage";

export default function LayoutPrincipal() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

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
              <AvatarCircle name={user.nombreCompleto} size={32} />
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
      <Drawer.Screen name="configuracion" options={{ title: "Configuración" }} />
    </Drawer>
  );
}

type CustomDrawerProps = DrawerContentComponentProps & {
  user: AuthUser | null;
  onLogout: () => void | Promise<void>;
};

function CustomDrawerContent({ user, onLogout, ...props }: CustomDrawerProps) {
  return (
    <DrawerContentScrollView {...props}>
      {/* Encabezado con avatar + nombre + rol */}
      <View style={styles.header}>
        <AvatarCircle name={user?.nombreCompleto || ""} size={56} />
        <View style={{ marginLeft: 12, flexShrink: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {user?.nombreCompleto || "Invitado"}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {user?.correo || ""}
          </Text>
          {!!user?.rol && <RoleBadge rol={user.rol} />}
        </View>
      </View>

      <DrawerItemList {...props} />

      {/* Footer con nombre + rol y botón de salir */}
      <View style={styles.footer}>
        <Text style={styles.footerName} numberOfLines={1}>
          {user?.nombreCompleto || ""}
        </Text>
        {!!user?.rol && (
          <Text style={styles.footerRole} numberOfLines={1}>
            {roleLabel(user.rol)}
          </Text>
        )}
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

/** Pill con color por rol */
function RoleBadge({ rol }: { rol: Rol }) {
  const conf = {
    ADMINISTRADOR: { bg: "#8B5CF6", fg: "#FFFFFF" },
    PROPIETARIO:   { bg: "#059669", fg: "#FFFFFF" },
    CLIENTE:       { bg: "#2563EB", fg: "#FFFFFF" },
  }[rol];
  return (
    <View style={[styles.badge, { backgroundColor: conf.bg }]}>
      <Text style={[styles.badgeText, { color: conf.fg }]}>{roleLabel(rol)}</Text>
    </View>
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
  email: { fontSize: 12, color: "#666", marginBottom: 6 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: "800" },
  footer: { marginTop: 16, paddingHorizontal: 12 },
  footerName: { color: "#888", fontSize: 12, marginBottom: 2 },
  footerRole: { color: "#444", fontSize: 12, marginBottom: 6, fontWeight: "700" },
});
