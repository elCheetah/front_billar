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
      {/* Barra del teléfono visible (oscura) */}
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
        <Drawer.Screen name="index" options={{ title: "Inicio" }} />
      </Drawer>
    </>
  );
}

type CustomDrawerProps = DrawerContentComponentProps & {
  user: AuthUser | null;
  onLogout: () => void | Promise<void>;
};

function CustomDrawerContent({ user, onLogout, navigation }: CustomDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const rol = user?.rol;

  // submenús
  const [openUsuarios, setOpenUsuarios] = useState(false);
  const [openLocales, setOpenLocales] = useState(false);
  const [openGestion, setOpenGestion] = useState(false);
  const [openMisReservas, setOpenMisReservas] = useState(false);

  const go = useCallback(
    (to: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      (router.push as (p: any) => void)(to);
      navigation.closeDrawer();
    },
    [router, navigation]
  );

  // ruta Inicio por rol
  const rutaInicio: string = useMemo(() => {
    if (rol === "ADMINISTRADOR") return "/(principal)/dashboard";
    if (rol === "PROPIETARIO") return "/(principal)/dashboard";
    return "/(principal)/inicio/filtros";
  }, [rol]);

  // mantener submenús desplegados según ruta actual
  useEffect(() => {
    if (!pathname) return;
    setOpenUsuarios(pathname.includes("/admin/usuarios/"));
    setOpenLocales(pathname.includes("/admin/locales/"));
    setOpenGestion(pathname.includes("/propietario/local/"));
    setOpenMisReservas(pathname.includes("/cliente/reservas/"));
  }, [pathname]);

  const toggle = (fn: React.Dispatch<React.SetStateAction<boolean>>) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    fn((v) => !v);
  };

  return (
    <DrawerContentScrollView contentContainerStyle={styles.scroll}>
      {/* Header */}
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

      {/* Menú */}
      <View style={styles.menu}>
        {/* Inicio (todos) */}
        <NavItem label="Inicio" icon="home" active={pathname === rutaInicio} onPress={() => go(rutaInicio)} />

        {/* ADMIN */}
        {rol === "ADMINISTRADOR" && (
          <>
            <NavParent label="Usuarios" icon="users" open={openUsuarios} onToggle={() => toggle(setOpenUsuarios)} />
            {openUsuarios && (
              <SubMenu>
                <SubItem
                  label="Clientes"
                  active={pathname.endsWith("/admin/usuarios/clientes")}
                  onPress={() => go("/(principal)/admin/usuarios/clientes")}
                />
                <SubItem
                  label="Propietarios"
                  active={pathname.endsWith("/admin/usuarios/propietarios")}
                  onPress={() => go("/(principal)/admin/usuarios/propietarios")}
                />
              </SubMenu>
            )}

            <NavParent
              label="Locales Registrados"
              icon="map-pin"
              open={openLocales}
              onToggle={() => toggle(setOpenLocales)}
            />
            {openLocales && (
              <SubMenu>
                <SubItem
                  label="Locales Activos"
                  active={pathname.endsWith("/admin/locales/activos")}
                  onPress={() => go("/(principal)/admin/locales/activos")}
                />
                <SubItem
                  label="Locales Suspendidos"
                  active={pathname.endsWith("/admin/locales/suspendidos")}
                  onPress={() => go("/(principal)/admin/locales/suspendidos")}
                />
              </SubMenu>
            )}
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
              label="Mesas en Uso"
              icon="grid"
              active={pathname.endsWith("/propietario/mesas-uso")}
              onPress={() => go("/(principal)/propietario/mesas-uso")}
            />
            <NavItem
              label="Historial de Reservas"
              icon="calendar"
              active={pathname.endsWith("/propietario/historial")}
              onPress={() => go("/(principal)/historial/historial")}
            />

            <NavParent label="Gestión del Local" icon="settings" open={openGestion} onToggle={() => toggle(setOpenGestion)} />
            {openGestion && (
              <SubMenu>
                <SubItem
                  label="Datos del Local"
                  active={pathname.endsWith("/propietario/local/datos")}
                  onPress={() => go("/(principal)/local/configurarDatosLocal")}
                />
                <SubItem
                  label="Mesas"
                  active={pathname.endsWith("/propietario/local/mesas")}
                  onPress={() => go("/(principal)/local/configurarMesas")}
                />
                <SubItem
                  label="Horarios"
                  active={pathname.endsWith("/propietario/local/horarios")}
                  onPress={() => go("/(principal)/local/configurarHorarios")}
                />
                <SubItem
                  label="Descuentos"
                  active={pathname.endsWith("/propietario/local/descuentos")}
                  onPress={() => go("/(principal)/local/establecerDescuento")}
                />
                <SubItem
                  label="Mi QR de Pago"
                  active={pathname.endsWith("/propietario/local/qr")}
                  onPress={() => go("/(principal)/local/miQR")}
                />
              </SubMenu>
            )}

            <NavItem
              label="Devoluciones"
              icon="rotate-ccw"
              active={pathname.endsWith("/propietario/devoluciones")}
              onPress={() => go("/(principal)/propietario/devoluciones")}
            />
          </>
        )}

        {/* CLIENTE */}
        {rol === "CLIENTE" && (
          <>
            <NavParent
              label="Mis Reservas"
              icon="calendar"
              open={openMisReservas}
              onToggle={() => toggle(setOpenMisReservas)}
            />
            {openMisReservas && (
              <SubMenu>
                <SubItem
                  label="Pendientes"
                  active={pathname.endsWith("/cliente/reservas/pendientes")}
                  onPress={() => go("/(principal)/solicitudes/pendientes")}
                />
                <SubItem
                  label="Confirmadas"
                  active={pathname.endsWith("/cliente/reservas/confirmadas")}
                  onPress={() => go("/(principal)/solicitudes/confirmadas")}
                />
              </SubMenu>
            )}

            <NavItem
              label="Historial de Reservas"
              icon="book-open"
              active={pathname.endsWith("/cliente/historial")}
              onPress={() => go("/(principal)/historial/historial")}
            />
            {/* Cliente: sin “Devoluciones” */}
          </>
        )}

        {/* Mi Perfil (todos) */}
        <NavItem label="Mi Perfil" icon="user" active={pathname.endsWith("/perfil")} onPress={() => go("/(principal)/perfil")} />
      </View>

      {/* Cerrar sesión */}
      <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
        <Feather name="log-out" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

/* ===== componentes UI ===== */

function NavItem({
  label,
  icon,
  onPress,
  active,
}: {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.item, active ? styles.itemActive : null]}>
      <Feather name={icon} size={18} color={active ? "#0B5FFF" : "#222"} />
      <Text style={[styles.itemText, active ? styles.itemTextActive : null]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function NavParent({
  label,
  icon,
  open,
  onToggle,
}: {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity onPress={onToggle} style={styles.item}>
      <Feather name={icon} size={18} color="#222" />
      <Text style={styles.itemText} numberOfLines={1}>
        {label}
      </Text>
      <Feather name={open ? "chevron-up" : "chevron-down"} size={18} color="#777" style={{ marginLeft: "auto" }} />
    </TouchableOpacity>
  );
}

function SubMenu({ children }: { children: React.ReactNode }) {
  return <View style={styles.submenu}>{children}</View>;
}

function SubItem({ label, onPress, active }: { label: string; onPress: () => void; active?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.subItem, active ? styles.subItemActive : null]}>
      <View style={[styles.bullet, active ? styles.bulletActive : null]} />
      <Text style={[styles.subItemText, active ? styles.subItemTextActive : null]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ===== estilos ===== */

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
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
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