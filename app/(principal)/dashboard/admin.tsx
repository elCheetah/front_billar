// app/(principal)/admin/dashboard.tsx
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { api } from "../../../components/api";

/** ===== Tipos que devuelve el back ===== */
type Bloque = {
  total: number;
  activos: number;
  inactivos: number;
  porcentaje_activos: number;
  porcentaje_inactivos: number;
};
type ResumenDashboard = {
  usuarios: Bloque & {
    clientes: Bloque;
    propietarios: Bloque;
  };
  locales: Bloque;
};

const Colores = {
  azul: "#0052FF",
  azulMedio: "#0033CC",
  azulClaro: "#E8F1FF",
  verde: "#28A745",
  verdeClaro: "#DDF5E6",
  naranja: "#FF8C42",
  naranjaClaro: "#FFE8D8",
  rojo: "#DC3545",
  grisFondo: "#F5F9FF",
  grisTexto: "#667085",
  blanco: "#FFFFFF",
  sombra: "rgba(16,24,40,0.08)",
};

export default function DashboardAdmin() {
  const [data, setData] = useState<ResumenDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const res = (await api("/dashboardAdmin/estadisticas")) as {
        ok: boolean;
        data: ResumenDashboard;
      };
      setData(res.data);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar el dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colores.azul} />
        <Text style={{ color: Colores.grisTexto, marginTop: 8 }}>
          Cargando estadísticas…
        </Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errTitle}>No se pudo cargar el dashboard</Text>
        <Text style={styles.errMsg}>{error ?? "Intenta nuevamente."}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <Text style={styles.title}>Dashboard del Administrador</Text>

      {/* === FILA 1: Tarjeta resumen de usuarios === */}
      <View style={styles.row}>
        <StatCardBig
          title="Usuarios totales"
          color={Colores.azulMedio}
          bg={Colores.azulClaro}
          value={data.usuarios.total}
          activos={data.usuarios.activos}
          inactivos={data.usuarios.inactivos}
          pctA={data.usuarios.porcentaje_activos}
          pctI={data.usuarios.porcentaje_inactivos}
          icon={<Ionicons name="people" size={28} color={Colores.azul} />}
        />
      </View>
      {/* === FILA 2: Clientes y Propietarios (cards grandes) === */}
      <View style={styles.row}>
        <StatCardBig
          title="Clientes"
          color={Colores.naranja}
          bg={Colores.naranjaClaro}
          value={data.usuarios.clientes.total}
          activos={data.usuarios.clientes.activos}
          inactivos={data.usuarios.clientes.inactivos}
          pctA={data.usuarios.clientes.porcentaje_activos}
          pctI={data.usuarios.clientes.porcentaje_inactivos}
          icon={
            <MaterialIcons name="person" size={36} color={Colores.naranja} />
          }
        />
      </View>
      <View style={styles.row}>
        <StatCardBig
          title="Propietarios"
          color={Colores.verde}
          bg={Colores.verdeClaro}
          value={data.usuarios.propietarios.total}
          activos={data.usuarios.propietarios.activos}
          inactivos={data.usuarios.propietarios.inactivos}
          pctA={data.usuarios.propietarios.porcentaje_activos}
          pctI={data.usuarios.propietarios.porcentaje_inactivos}
          icon={
            <FontAwesome5 name="user-tie" size={32} color={Colores.verde} />
          }
        />
      </View>

      {/* === FILA 3: Locales (card grande, sin pastel) === */}
      <View style={styles.row}>
        <StatCardBig
          title="Locales"
          color={Colores.azulMedio}
          bg={Colores.azulClaro}
          value={data.locales.total}
          activos={data.locales.activos}
          inactivos={data.locales.inactivos}
          pctA={data.locales.porcentaje_activos}
          pctI={data.locales.porcentaje_inactivos}
          icon={
            <MaterialIcons
              name="storefront"
              size={34}
              color={Colores.azulMedio}
            />
          }
        />
      </View>
    </ScrollView>
  );
}

/** ====== Componentes ====== */
function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBubble}>{icon}</View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.kpi}>{value}</Text>
      {!!subtitle && <Text style={styles.subKpi}>{subtitle}</Text>}
    </View>
  );
}

function StatCardBig({
  title,
  value,
  activos,
  inactivos,
  pctA,
  pctI,
  color,
  bg,
  icon,
}: {
  title: string;
  value: number;
  activos: number;
  inactivos: number;
  pctA: number;
  pctI: number;
  color: string;
  bg: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={[styles.card, { flex: 1 }]}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconBubble,
            { backgroundColor: bg, borderColor: color },
          ]}
        >
          {icon}
        </View>
        <Text style={[styles.cardTitle, { color }]}>{title}</Text>
      </View>

      <Text style={styles.kpi}>{value}</Text>

      <View style={styles.splitRow}>
        <View style={styles.splitCol}>
          <Text style={[styles.splitLabel, { color }]}>Activos</Text>
          <Text style={styles.splitVal}>
            {activos} <Text style={styles.splitPct}>({pctA}%)</Text>
          </Text>
        </View>
        <View style={styles.splitCol}>
          <Text style={[styles.splitLabel, { color }]}>Inactivos</Text>
          <Text style={styles.splitVal}>
            {inactivos} <Text style={styles.splitPct}>({pctI}%)</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

/** ====== Estilos ====== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colores.grisFondo, padding: 14 },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errTitle: { fontSize: 16, fontWeight: "800", color: Colores.rojo },
  errMsg: { color: Colores.grisTexto, marginTop: 4, textAlign: "center" },

  title: {
    fontSize: 20,
    fontWeight: "900",
    color: Colores.azulMedio,
    textAlign: "center",
    marginBottom: 10,
  },

  row: { flexDirection: "row", gap: 12, marginBottom: 12 },

  card: {
    backgroundColor: Colores.blanco,
    borderRadius: 14,
    padding: 14,
    elevation: 3,
    shadowColor: Colores.sombra,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 12,
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colores.azulClaro,
    borderWidth: 1,
    borderColor: Colores.azulMedio,
  },
  cardTitle: { fontWeight: "900", color: Colores.azulMedio, fontSize: 15 },

  kpi: { fontSize: 28, fontWeight: "900", color: "#0B132B", marginTop: 4 },
  subKpi: { color: Colores.grisTexto, marginTop: 4 },

  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 8,
  },
  splitCol: {
    flex: 1,
    backgroundColor: "#F7F9FF",
    borderRadius: 10,
    padding: 10,
  },
  splitLabel: { fontSize: 12, fontWeight: "900" },
  splitVal: { fontSize: 16, fontWeight: "900", color: "#0B132B", marginTop: 2 },
  splitPct: { fontSize: 12, color: Colores.grisTexto },
});
