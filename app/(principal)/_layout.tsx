// app/(principal)/_layout.tsx
import { Feather } from "@expo/vector-icons";
import { DrawerContentComponentProps, DrawerContentScrollView } from "@react-navigation/drawer";
import { usePathname, useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

import AvatarCircle from "../../components/AvatarCircle";
import { AuthUser, Rol, clearAuth, getToken, getUser, roleLabel } from "../../utils/authStorage";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function LayoutPrincipal() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    (async () => {
      const [token, u] = await Promise.all([getToken(), getUser()]);
      if (!token || !u) {
        (router.replace as (p: any) => void)("/autenticacion");
        return;
      }
      setUser(u);
    })();
  }, []);

  return (
    <>
      <StatusBar style="dark" backgroundColor="#0A0A0A" />
      <Drawer
        screenOptions={{
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#0066FF" },
          headerTintColor: "#FFFFFF",
          headerRight: () =>
            user ? (
              <TouchableOpacity
                style={{ marginRight: 14 }}
                onPress={() => (router.push as (p: any) => void)("/(principal)/perfil")}
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
              (router.replace as (p: any) => void)("/autenticacion");
            }}
          />
        )}
      >
        {/* === CLIENTE === */}
        <Drawer.Screen name="inicio/index" options={{ title: "Inicio" }} />
        <Drawer.Screen name="reservas/index" options={{ title: "Mis Reservas" }} />
        <Drawer.Screen name="perfil/index" options={{ title: "Mi Perfil" }} />

        {/* === PROPIETARIO === */}
        <Drawer.Screen name="propietario/panel" options={{ title: "Panel Propietario" }} />
        <Drawer.Screen name="propietario/solicitudes" options={{ title: "Solicitudes de Reserva" }} />

        {/* === ADMIN === */}
        <Drawer.Screen name="admin/resumen" options={{ title: "Resumen Admin" }} />
      </Drawer>
    </>
  );
}

/* ========== CUSTOM DRAWER ========== */
type CustomDrawerProps = DrawerContentComponentProps & {
  user: AuthUser | null;
  onLogout: () => void | Promise<void>;
};

function CustomDrawerContent({ user, onLogout, navigation }: CustomDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const rol = user?.rol;

  const [openMisReservas, setOpenMisReservas] = useState(false);

  const go = useCallback(
    (to: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      (router.push as (p: any) => void)(to);
      navigation.closeDrawer();
    },
    [router, navigation]
  );

  // Ruta inicial según rol
  const rutaInicio: string = useMemo(() => {
    if (rol === "ADMINISTRADOR") return "/(principal)/admin/resumen";
    if (rol === "PROPIETARIO") return "/(principal)/propietario/panel";
    return "/(principal)/inicio"; // Cliente
  }, [rol]);

  useEffect(() => {
    if (!pathname) return;
    setOpenMisReservas(pathname.includes("/cliente/reservas/"));
  }, [pathname]);

  return (
    <DrawerContentScrollView contentContainerStyle={styles.scroll}>
      {/* === Header === */}
      <View style={styles.header}>
        <Text style={styles.welcome}>
          <Text style={{ fontWeight: "800" }}>Bienvenido</Text>
        </Text>
        <Text style={styles.name} numberOfLines={1}>
          {user?.nombreCompleto || "Invitado"}
        </Text>

        <View style={styles.roleAvatarRow}>
          {rol ? (
            <View style={[styles.badge, { backgroundColor: badgeByRol[rol].bg }]}>
              <Text style={[styles.badgeText, { color: badgeByRol[rol].fg }]}>{roleLabel(rol)}</Text>
            </View>
          ) : (
            <View />
          )}

          <TouchableOpacity style={styles.avatarButton} onPress={() => go("/(principal)/perfil")}>
            <AvatarCircle name={user?.nombreCompleto || ""} size={44} />
          </TouchableOpacity>
        </View>
      </View>

      {/* === Menú === */}
      <View style={styles.menu}>
        {/* Inicio */}
        <NavItem label="Inicio" icon="home" active={pathname === rutaInicio} onPress={() => go(rutaInicio)} />

        {/* CLIENTE */}
        {rol === "CLIENTE" && (
          <>
            <NavParent
              label="Mis Reservas"
              icon="calendar"
              open={openMisReservas}
              onToggle={() => setOpenMisReservas(!openMisReservas)}
            />
            {openMisReservas && (
              <SubMenu>
                <SubItem
                  label="Pendientes"
                  active={pathname.endsWith("/cliente/reservas/pendientes")}
                  onPress={() => go("/(principal)/cliente/reservas/pendientes")}
                />
                <SubItem
                  label="Confirmadas"
                  active={pathname.endsWith("/cliente/reservas/confirmadas")}
                  onPress={() => go("/(principal)/cliente/reservas/confirmadas")}
                />
              </SubMenu>
            )}

            <NavItem
              label="Historial de Reservas"
              icon="book-open"
              active={pathname.endsWith("/cliente/historial")}
              onPress={() => go("/(principal)/cliente/historial")}
            />
          </>
        )}

        {/* PROPIETARIO */}
        {rol === "PROPIETARIO" && (
          <>
            <NavItem
              label="Solicitudes de Reserva"
              icon="inbox"
              active={pathname.endsWith("/propietario/solicitudes")}
              onPress={() => go("/(principal)/propietario/solicitudes")}
            />
            <NavItem
              label="Panel de Control"
              icon="grid"
              active={pathname.endsWith("/propietario/panel")}
              onPress={() => go("/(principal)/propietario/panel")}
            />
          </>
        )}

        {/* ADMIN */}
        {rol === "ADMINISTRADOR" && (
          <NavItem
            label="Resumen General"
            icon="bar-chart"
            active={pathname.endsWith("/admin/resumen")}
            onPress={() => go("/(principal)/admin/resumen")}
          />
        )}

        {/* Perfil */}
        <NavItem
          label="Mi Perfil"
          icon="user"
          active={pathname.endsWith("/perfil")}
          onPress={() => go("/(principal)/perfil")}
        />
      </View>

      {/* === Cerrar sesión === */}
      <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
        <Feather name="log-out" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

/* === Componentes de navegación === */
function NavItem({ label, icon, onPress, active }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.item, active && styles.itemActive]}>
      <Feather name={icon} size={18} color={active ? "#0B5FFF" : "#222"} />
      <Text style={[styles.itemText, active && styles.itemTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function NavParent({ label, icon, open, onToggle }: any) {
  return (
    <TouchableOpacity onPress={onToggle} style={styles.item}>
      <Feather name={icon} size={18} color="#222" />
      <Text style={styles.itemText}>{label}</Text>
      <Feather
        name={open ? "chevron-up" : "chevron-down"}
        size={18}
        color="#777"
        style={{ marginLeft: "auto" }}
      />
    </TouchableOpacity>
  );
}

function SubMenu({ children }: any) {
  return <View style={styles.submenu}>{children}</View>;
}

function SubItem({ label, onPress, active }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.subItem, active && styles.subItemActive]}>
      <View style={[styles.bullet, active && styles.bulletActive]} />
      <Text style={[styles.subItemText, active && styles.subItemTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* === Estilos === */
const badgeByRol: Record<Rol, { bg: string; fg: string }> = {
  ADMINISTRADOR: { bg: "#8B5CF6", fg: "#FFFFFF" },
  PROPIETARIO: { bg: "#059669", fg: "#FFFFFF" },
  CLIENTE: { bg: "#2563EB", fg: "#FFFFFF" },
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  header: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomColor: "#EEE",
    borderBottomWidth: 1,
  },
  welcome: { color: "#222" },
  name: { color: "#0033A0", marginTop: 2 },
  roleAvatarRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontWeight: "800" },
  avatarButton: { padding: 4, marginLeft: 12 },
  menu: { paddingTop: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemText: { marginLeft: 10, color: "#222", fontWeight: "600" },
  itemActive: { backgroundColor: "#E9F0FF" },
  itemTextActive: { color: "#0B5FFF" },
  submenu: { paddingLeft: 24, paddingBottom: 6 },
  subItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingRight: 16,
  },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#999", marginRight: 10 },
  bulletActive: { backgroundColor: "#0B5FFF" },
  subItemText: { color: "#333", fontWeight: "600" },
  subItemActive: { backgroundColor: "#EDF4FF", borderRadius: 8 },
  subItemTextActive: { color: "#0B5FFF" },
  logoutBtn: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: "#FF4B4B",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  logoutText: { color: "#fff", fontWeight: "800" },
});
