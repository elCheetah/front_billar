// app/(principal)/propietario/dashboard.tsx
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { api } from "../../../components/api";
import { getToken } from "../../../utils/authStorage";

/** ===== Colores ===== */
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
  grisBorde: "#DDE1F1",
  negro: "#0B132B",
};

/** ===== Utilidades fecha (zona bolivia UTC-4 no se simula aquí; el back ya controla) ===== */
const hoy0 = new Date(); hoy0.setHours(0,0,0,0);
const toISO = (d: Date) => {
  const z = new Date(d); z.setHours(0,0,0,0);
  return z.toISOString().slice(0,10);
};

/** ===== Tipos respuesta backend ===== */
type Kpi = { cantidad: number; porcentaje: number };
type Resumen = {
  fecha: string; // YYYY-MM-DD (hoy)
  reservas: {
    total: Kpi;
    pendientes: Kpi;
    confirmadas: Kpi;
    canceladas: Kpi;
    finalizadas: Kpi;
  };
  mesas: {
    total: Kpi;
    libres: Kpi;
    ocupadas: Kpi;
    inactivas: Kpi;
  };
};

type FilaReserva = { horario: string; duracionHoras: number };
type RespConfirmadas = { ok: boolean; fecha: string; reservas: FilaReserva[] };

/** ===== Componente ===== */
export default function DashboardPropietario() {
  // Estado general
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resumen (hoy) del backend
  const [resumen, setResumen] = useState<Resumen | null>(null);

  // Fecha SOLO para la tabla
  const [fechaTabla, setFechaTabla] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [warnPast, setWarnPast] = useState<string | null>(null);
  const isoTabla = useMemo(() => toISO(fechaTabla), [fechaTabla]);

  // Lista confirmadas por fecha (desde el backend)
  const [listaConfirmadas, setListaConfirmadas] = useState<FilaReserva[]>([]);
  const [loadingTabla, setLoadingTabla] = useState(false);
  const [errorTabla, setErrorTabla] = useState<string | null>(null);

  /** ===== Fetchers ===== */
  const fetchResumen = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken();
      const r = (await api("/dashboardPropietario/resumen", {token: token || undefined })) as { ok: boolean } & Resumen;
      setResumen({
        fecha: r.fecha,
        reservas: r.reservas,
        mesas: r.mesas,
      });
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar el resumen.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConfirmadas = useCallback(async (fechaISO: string) => {
    try {
      setErrorTabla(null);
      setLoadingTabla(true);
      const token = await getToken();
      const r = (await api(`/dashboardPropietario/reservas-confirmadas?fecha=${fechaISO}`, { token: token || undefined })) as RespConfirmadas;
      setListaConfirmadas(r.reservas ?? []);
    } catch (e: any) {
      setErrorTabla(e?.message ?? "No se pudo cargar las reservas confirmadas.");
      setListaConfirmadas([]);
    } finally {
      setLoadingTabla(false);
    }
  }, []);

  /** ===== Ciclo de vida ===== */
  useEffect(() => {
    setLoading(true);
    fetchResumen();
  }, [fetchResumen]);

  // cargar tabla por fecha (inicial = hoy)
  useEffect(() => {
    fetchConfirmadas(isoTabla);
  }, [isoTabla, fetchConfirmadas]);

  /** ===== Handlers ===== */
  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchResumen(), fetchConfirmadas(isoTabla)]).finally(() =>
      setRefreshing(false)
    );
  };

  const onChangeDateTabla = (_: any, d?: Date) => {
    if (!d) return setShowPicker(false);
    const ds = new Date(d); ds.setHours(0,0,0,0);
    if (ds.getTime() < hoy0.getTime()) {
      setWarnPast("La fecha debe ser mayor o igual a hoy.");
      setFechaTabla(new Date(hoy0));
    } else {
      setWarnPast(null);
      setFechaTabla(ds);
    }
    if (Platform.OS !== "ios") setShowPicker(false);
  };

  /** ===== Render: estado global ===== */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colores.azul} />
        <Text style={{ color: Colores.grisTexto, marginTop: 8 }}>Cargando…</Text>
      </View>
    );
  }
  if (error || !resumen) {
    return (
      <View style={styles.center}>
        <Text style={styles.errTitle}>No se pudo cargar el dashboard</Text>
        <Text style={styles.errMsg}>{error ?? "Intenta nuevamente."}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchResumen(); }}>
          <Ionicons name="refresh" size={18} color={Colores.blanco} />
          <Text style={styles.retryTxt}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /** ===== Derivados (solo para mostrar) ===== */
  const R = resumen.reservas;
  const M = resumen.mesas;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <Text style={styles.title}>Resumen</Text>

      {/* ===== KPIs de Reservas (del backend, hoy) ===== */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Reservas — Estado del día</Text>
        <Text style={styles.sectionSub}>Fecha: {resumen.fecha}</Text>
      </View>

      <View style={styles.row}>
        <StatCard
          title="Pendientes"
          value={R.pendientes.cantidad}
          subtitle={`${R.pendientes.porcentaje}%`}
          icon={<MaterialIcons name="hourglass-empty" size={26} color={Colores.azulMedio} />}
          bubbleBg={Colores.azulClaro}
          bubbleBorder={Colores.azulMedio}
          titleColor={Colores.azulMedio}
        />
        <StatCard
          title="Confirmadas"
          value={R.confirmadas.cantidad}
          subtitle={`${R.confirmadas.porcentaje}%`}
          icon={<Ionicons name="checkmark-done" size={26} color={Colores.verde} />}
          bubbleBg={Colores.verdeClaro}
          bubbleBorder={Colores.verde}
          titleColor={Colores.verde}
        />
      </View>

      <View style={styles.row}>
        <StatCard
          title="Canceladas"
          value={R.canceladas.cantidad}
          subtitle={`${R.canceladas.porcentaje}%`}
          icon={<MaterialIcons name="cancel" size={26} color={Colores.naranja} />}
          bubbleBg={Colores.naranjaClaro}
          bubbleBorder={Colores.naranja}
          titleColor={Colores.naranja}
        />
        <StatCard
          title="Finalizadas"
          value={R.finalizadas.cantidad}
          subtitle={`${R.finalizadas.porcentaje}%`}
          icon={<Ionicons name="flag" size={26} color={Colores.azulMedio} />}
          bubbleBg={Colores.azulClaro}
          bubbleBorder={Colores.azulMedio}
          titleColor={Colores.azulMedio}
        />
      </View>

      <View style={styles.row}>
        <StatCard
          title="Total del día"
          value={R.total.cantidad}
          subtitle={`${R.total.porcentaje}%`}
          icon={<Ionicons name="calendar" size={24} color={Colores.azulMedio} />}
          bubbleBg={Colores.azulClaro}
          bubbleBorder={Colores.azulMedio}
          titleColor={Colores.azulMedio}
        />
      </View>

      {/* ===== Mesas (4 cards: Total, Libres, Ocupadas, Inactivas) ===== */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Mesas — Estado actual</Text>
      </View>
      <View style={styles.row}>
        <StatCard
          title="Total"
          value={M.total.cantidad}
          subtitle={`${M.total.porcentaje}%`}
          icon={<MaterialIcons name="table-restaurant" size={26} color={Colores.azulMedio} />}
          bubbleBg={Colores.azulClaro}
          bubbleBorder={Colores.azulMedio}
          titleColor={Colores.azulMedio}
        />
        <StatCard
          title="Libres"
          value={M.libres.cantidad}
          subtitle={`${M.libres.porcentaje}%`}
          icon={<MaterialIcons name="event-available" size={26} color={Colores.verde} />}
          bubbleBg={Colores.verdeClaro}
          bubbleBorder={Colores.verde}
          titleColor={Colores.verde}
        />
      </View>
      <View style={styles.row}>
        <StatCard
          title="Ocupadas"
          value={M.ocupadas.cantidad}
          subtitle={`${M.ocupadas.porcentaje}%`}
          icon={<MaterialIcons name="event-seat" size={26} color={Colores.azulMedio} />}
          bubbleBg={Colores.azulClaro}
          bubbleBorder={Colores.azulMedio}
          titleColor={Colores.azulMedio}
        />
        <StatCard
          title="Inactivas"
          value={M.inactivas.cantidad}
          subtitle={`${M.inactivas.porcentaje}%`}
          icon={<MaterialIcons name="block" size={26} color={Colores.rojo} />}
          bubbleBg="#FFE8E9"
          bubbleBorder={Colores.rojo}
          titleColor={Colores.rojo}
        />
      </View>

      {/* ===== Tabla: Confirmadas por fecha (selector encima) ===== */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Reservas confirmadas por fecha</Text>
      </View>

      {/* Selector de fecha (afecta SOLO la tabla) */}
      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>Fecha:</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker(true)}>
          <Ionicons name="calendar" size={18} color={Colores.azulMedio} />
          <Text style={styles.dateBtnTxt}>{isoTabla}</Text>
        </TouchableOpacity>
      </View>
      {warnPast ? <Text style={styles.warnTxt}>{warnPast}</Text> : null}

      {showPicker && (
        <DateTimePicker
          value={fechaTabla}
          mode="date"
          display="default"
          minimumDate={hoy0}
          onChange={onChangeDateTabla}
        />
      )}

      {/* Tabla */}
      <View style={[styles.table, { marginTop: 6 }]}>
        <View style={styles.thead}>
          <Text style={[styles.th, { flex: 2 }]}>Horario</Text>
          <Text style={[styles.th, { flex: 1 }]}>Duración</Text>
        </View>

        {loadingTabla ? (
          <View style={styles.tloader}>
            <ActivityIndicator size="small" color={Colores.azul} />
            <Text style={{ color: Colores.grisTexto, marginTop: 6 }}>Cargando reservas…</Text>
          </View>
        ) : errorTabla ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTxt}>{errorTabla}</Text>
          </View>
        ) : listaConfirmadas.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTxt}>No existen reservas confirmadas para la fecha seleccionada.</Text>
          </View>
        ) : (
          listaConfirmadas.map((r, idx) => (
            <View key={`${r.horario}-${idx}`} style={styles.trow}>
              <Text style={[styles.td, { flex: 2 }]}>{r.horario}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{r.duracionHoras.toFixed(2)} h</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

/** ====== Card KPI ====== */
function StatCard({
  title,
  value,
  subtitle,
  icon,
  bubbleBg,
  bubbleBorder,
  titleColor,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  bubbleBg: string;
  bubbleBorder: string;
  titleColor: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBubble, { backgroundColor: bubbleBg, borderColor: bubbleBorder }]}>
          {icon}
        </View>
        <Text style={[styles.cardTitle, { color: titleColor }]}>{title}</Text>
      </View>
      <Text style={styles.kpi}>{value}</Text>
      {!!subtitle && <Text style={styles.subKpi}>{subtitle}</Text>}
    </View>
  );
}

/** ====== Estilos ====== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colores.grisFondo, padding: 14 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errTitle: { fontSize: 16, fontWeight: "800", color: Colores.rojo },
  errMsg: { color: Colores.grisTexto, marginTop: 4, textAlign: "center" },
  retryBtn: {
    marginTop: 10, backgroundColor: Colores.azul, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 16, flexDirection: "row", gap: 8, alignItems: "center",
  },
  retryTxt: { color: Colores.blanco, fontWeight: "bold" },

  title: {
    fontSize: 20,
    fontWeight: "900",
    color: Colores.azulMedio,
    textAlign: "center",
    marginBottom: 10,
  },

  sectionTitleRow: { marginTop: 8, marginBottom: 6 },
  sectionTitle: { fontSize: 15, fontWeight: "900", color: Colores.negro },
  sectionSub: { color: Colores.grisTexto, marginTop: 2 },

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
    flex: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  iconBubble: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  cardTitle: { fontWeight: "900", fontSize: 15 },

  kpi: { fontSize: 28, fontWeight: "900", color: Colores.negro, marginTop: 4 },
  subKpi: { color: Colores.grisTexto, marginTop: 4 },

  /** Fecha SOLO para la tabla */
  dateRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  dateLabel: { fontWeight: "900", color: Colores.azulMedio },
  dateBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: Colores.grisBorde, paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 10, backgroundColor: Colores.blanco,
  },
  dateBtnTxt: { fontWeight: "800", color: Colores.azulMedio },
  warnTxt: { color: Colores.rojo, marginBottom: 8, fontWeight: "700" },

  /** Tabla */
  table: {
    borderWidth: 1, borderColor: Colores.grisBorde, borderRadius: 10,
    overflow: "hidden", backgroundColor: Colores.blanco,
  },
  thead: { flexDirection: "row", backgroundColor: Colores.azulClaro, paddingVertical: 10, paddingHorizontal: 8 },
  th: { fontWeight: "900", color: Colores.azulMedio, textAlign: "center" },
  tloader: { alignItems: "center", paddingVertical: 16 },
  trow: {
    flexDirection: "row", paddingVertical: 10, paddingHorizontal: 8,
    borderTopWidth: 1, borderTopColor: Colores.grisBorde, alignItems: "center",
  },
  td: { color: Colores.negro, textAlign: "center" },
  emptyBox: {
    borderWidth: 1, borderColor: Colores.grisBorde, borderRadius: 10,
    paddingVertical: 16, paddingHorizontal: 12, backgroundColor: Colores.blanco,
  },
  emptyTxt: { color: Colores.grisTexto, textAlign: "center" },
});
