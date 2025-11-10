// app/(principal)/admin/locales.tsx
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../../components/api";
import ConfirmModal from "../../../../components/modals/ConfirmModal";
import ResultModal from "../../../../components/modals/ResultModal";

/** === Colores base === */
const Colores = {
  azul: "#0052FF",
  blanco: "#FFFFFF",
  grisClaro: "#F5F6FA",
  negro: "#000000",
  borde: "#DDE1F1",
  texto: "#333333",
  rojo: "#E53935",
  verde: "#28A745",
  grisTxtSec: "#6B7280",
};

/** === Tipos del back === */
type LocalListadoDTO = {
  id_local: number;
  nombre_local: string;
  direccion: string;
  estado: "ACTIVO" | "SUSPENDIDO";
  id_duenio: number;
  nombre_duenio: string;
  celular_duenio: string | null;
};
type ApiListLocales = { ok: true; total: number; locales: LocalListadoDTO[] };
type Filtro = "TODOS" | "ACTIVOS" | "SUSPENDIDOS";
const PAGE_SIZE = 15 as const;

export default function Locales() {
  /** Estado */
  const [localesAll, setLocalesAll] = useState<LocalListadoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Controles UI */
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [page, setPage] = useState(1);

  /** Confirmación / Resultado / Busy */
  const [confirm, setConfirm] = useState<{
    visible: boolean;
    accion?: "activar" | "suspender";
    target?: LocalListadoDTO | null;
  }>({ visible: false, target: null });

  const [busy, setBusy] = useState<{ visible: boolean; msg: string }>({
    visible: false,
    msg: "",
  });

  const [result, setResult] = useState<{
    visible: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({ visible: false, type: "success", title: "", message: "" });

  /** Fetch */
  const fetchLocales = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = (await api("/listaLocales")) as ApiListLocales;
      setLocalesAll(res.locales);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo obtener la lista de locales.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocales();
  }, [fetchLocales]);

  /** Filtro + búsqueda */
  const localesFiltrados = useMemo(() => {
    let base = localesAll;
    if (filtro === "ACTIVOS") base = base.filter((l) => l.estado === "ACTIVO");
    if (filtro === "SUSPENDIDOS") base = base.filter((l) => l.estado === "SUSPENDIDO");

    const q = busqueda.trim().toLowerCase();
    if (q) {
      base = base.filter(
        (l) =>
          l.nombre_local.toLowerCase().includes(q) ||
          l.direccion.toLowerCase().includes(q) ||
          l.nombre_duenio.toLowerCase().includes(q) ||
          (l.celular_duenio ?? "").toLowerCase().includes(q)
      );
    }
    return base;
  }, [localesAll, filtro, busqueda]);

  // paginación
  const totalPages = Math.max(1, Math.ceil(localesFiltrados.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageSlice = useMemo(
    () => localesFiltrados.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
    [localesFiltrados, pageSafe]
  );
  useEffect(() => {
    setPage(1);
  }, [filtro, busqueda]);

  /** Acciones */
  const abrirConfirm = (l: LocalListadoDTO) => {
    const accion = l.estado === "ACTIVO" ? "suspender" : "activar";
    setConfirm({ visible: true, target: l, accion });
  };

  const cambiarEstado = async () => {
    if (!confirm.target || !confirm.accion) return;

    setConfirm({ visible: false, target: null });
    setBusy({
      visible: true,
      msg: confirm.accion === "suspender" ? "Suspendiendo local…" : "Activando local…",
    });

    try {
      const url =
        confirm.accion === "suspender"
          ? `/listaLocales/suspender/${confirm.target.id_local}`
          : `/listaLocales/activar/${confirm.target.id_local}`;

      // Back devuelve: { ok, message, id_local, estado: "ACTIVO"|"INACTIVO", id_duenio }
      const resp = (await api(url, { method: "PATCH" })) as {
        ok: boolean;
        message: string;
        id_local: number;
        estado: "ACTIVO" | "INACTIVO";
        id_duenio: number;
      };

      // Actualizar estado en memoria
      setLocalesAll((prev) =>
        prev.map((l) =>
          l.id_local === resp.id_local
            ? { ...l, estado: resp.estado === "ACTIVO" ? "ACTIVO" : "SUSPENDIDO" }
            : l
        )
      );

      const l = confirm.target;
      setResult({
        visible: true,
        type: "success",
        title: "Operación exitosa",
        message:
          confirm.accion === "suspender"
            ? `Se suspendió el local:\n• Local: "${l.nombre_local}"\n• Dirección: ${l.direccion}\n• Dueño: ${l.nombre_duenio}\n• Celular: ${l.celular_duenio ?? "-"}\n\nEl dueño también fue suspendido.`
            : `Se activó el local:\n• Local: "${l.nombre_local}"\n• Dirección: ${l.direccion}\n• Dueño: ${l.nombre_duenio}\n• Celular: ${l.celular_duenio ?? "-"}\n\nEl dueño también fue activado.`,
      });
    } catch (e: any) {
      setResult({
        visible: true,
        type: "error",
        title: "No se pudo completar la acción",
        message: String(e?.message || "Inténtalo nuevamente."),
      });
    } finally {
      setBusy({ visible: false, msg: "" });
    }
  };

  /** Renders */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colores.azul} />
        <Text style={{ color: Colores.grisTxtSec, marginTop: 8 }}>Cargando locales…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.titulo}>Lista de Locales</Text>
        <Text style={{ color: Colores.rojo, marginBottom: 10 }}>{error}</Text>
        <TouchableOpacity style={styles.reloadBtn} onPress={fetchLocales}>
          <Ionicons name="refresh" size={18} color={Colores.blanco} />
          <Text style={styles.reloadTxt}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={styles.titulo}>Lista de Locales</Text>

      {/* Buscador */}
      <Text style={styles.searchLabel}>Buscador:</Text>
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Buscar por local, dirección o dueño…"
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {/* Filtros */}
      <View style={styles.filtersRow}>
        <FilterChip
          label="Todos"
          active={filtro === "TODOS"}
          onPress={() => setFiltro("TODOS")}
          icon={<Ionicons name="list" size={16} color={filtro === "TODOS" ? Colores.blanco : Colores.azul} />}
        />
        <FilterChip
          label="Activos"
          active={filtro === "ACTIVOS"}
          onPress={() => setFiltro("ACTIVOS")}
          icon={<Ionicons name="checkmark-circle" size={16} color={filtro === "ACTIVOS" ? Colores.blanco : Colores.verde} />}
        />
        <FilterChip
          label="Suspendidos"
          active={filtro === "SUSPENDIDOS"}
          onPress={() => setFiltro("SUSPENDIDOS")}
          icon={<MaterialIcons name="block" size={16} color={filtro === "SUSPENDIDOS" ? Colores.blanco : Colores.rojo} />}
        />
      </View>

      {/* Tabla: Local | Dirección | Estado | Acción */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerText, { flex: 2 }]}>Nombre del local</Text>
        <Text style={[styles.headerText, { flex: 2 }]}>Dirección</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>Estado</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>Acción</Text>
      </View>

      {pageSlice.map((l) => (
        <View key={l.id_local} style={styles.dataRow}>
          <Text style={[styles.dataText, { flex: 2, textAlign: "left",flexShrink: 1, fontWeight: "bold"  }]}>
            {l.nombre_local}
          </Text>
          <Text style={[styles.dataText, { flex: 2, textAlign: "left" }]}>
            {l.direccion}
          </Text>

          {/* Estado (texto, sin íconos) */}
          <Text
            style={[
              styles.dataText,
              {
                flex: 1,
                color: l.estado === "ACTIVO" ? Colores.verde : Colores.rojo,
                fontWeight: "bold",
              },
            ]}
          >
            {l.estado}
          </Text>

          {/* Acción */}
          <View style={{ flex: 1 }}>
            {l.estado === "ACTIVO" ? (
              <TouchableOpacity
                style={[styles.accionBtn, { backgroundColor: Colores.rojo }]}
                onPress={() => abrirConfirm(l)}
              >
                <Text style={styles.accionTxt}>Suspender</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.accionBtn, { backgroundColor: Colores.azul }]}
                onPress={() => abrirConfirm(l)}
              >
                <Text style={styles.accionTxt}>Activar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      {/* Paginación */}
      <View style={styles.pagination}>
        <TouchableOpacity
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          disabled={pageSafe === 1}
          style={[styles.pageBtn, pageSafe === 1 && { backgroundColor: "#CAD6FF" }]}
        >
          <Text style={[styles.pageBtnTxt, pageSafe === 1 && { color: "#FFF" }]}>{'<'}</Text>
        </TouchableOpacity>

        <Text style={styles.pageNumber}>
          {pageSafe} / {totalPages}
        </Text>

        <TouchableOpacity
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={pageSafe === totalPages}
          style={[styles.pageBtn, pageSafe === totalPages && { backgroundColor: "#CAD6FF" }]}
        >
          <Text style={[styles.pageBtnTxt, pageSafe === totalPages && { color: "#FFF" }]}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Confirmación con DETALLES (activar/suspender) */}
      <ConfirmModal
        visible={confirm.visible}
        title={confirm.accion === "suspender" ? "Confirmar suspensión" : "Confirmar activación"}
        message={
          confirm.target
            ? `${confirm.accion === "suspender" ? "Se suspenderá" : "Se activará"} el local:\n` +
              `• Local: "${confirm.target.nombre_local}"\n` +
              `• Dirección: ${confirm.target.direccion}\n` +
              `• Dueño: ${confirm.target.nombre_duenio}\n` +
              `• Celular: ${confirm.target.celular_duenio ?? "-"}\n\n` +
              `El dueño también será ${confirm.accion === "suspender" ? "suspendido" : "activado"}.\n¿Desea continuar?`
            : ""
        }
        onCancel={() => setConfirm({ visible: false, target: null })}
        onConfirm={cambiarEstado}
        confirmText={confirm.accion === "suspender" ? "Suspender" : "Activar"}
        cancelText="Cancelar"
      />

      {/* Resultado */}
      <ResultModal
        visible={result.visible}
        type={result.type}
        title={result.title}
        message={result.message}
        onClose={() => setResult((r) => ({ ...r, visible: false }))}
      />

      {/* Busy */}
      <Modal visible={busy.visible} transparent animationType="fade">
        <View style={styles.busyOverlay}>
          <View style={styles.busyBox}>
            <ActivityIndicator size="large" color={Colores.azul} />
            <Text style={{ marginTop: 10, color: Colores.grisTxtSec, fontWeight: "700" }}>
              {busy.msg}
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/** Chip de filtro */
function FilterChip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        active ? { backgroundColor: Colores.azul } : { backgroundColor: Colores.grisClaro },
      ]}
    >
      {icon}
      <Text style={[styles.chipTxt, { color: active ? Colores.blanco : Colores.azul }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Estilos */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colores.blanco,
    padding: 16,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },

  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colores.azul,
    marginBottom: 14,
    textAlign: "center",
  },
  searchLabel: {
    fontWeight: "bold",
    color: Colores.negro,
    marginBottom: 6,
  },
  searchBar: {
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: Colores.grisClaro,
  },
  searchInput: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
  },

  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  chipTxt: { fontWeight: "bold", fontSize: 13 },

  headerRow: {
    flexDirection: "row",
    backgroundColor: Colores.grisClaro,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colores.borde,
  },
  headerText: {
    fontWeight: "bold",
    color: Colores.azul,
    textAlign: "center",
    fontSize: 14,
  },
  dataRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colores.borde,
    alignItems: "center",
  },
  dataText: {
    color: Colores.texto,
    fontSize: 14,
    textAlign: "center",
  },
  accionBtn: {
    borderRadius: 6,
    paddingVertical: 5,
    marginHorizontal: 4,
  },
  accionTxt: {
    color: Colores.blanco,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 13,
  },

  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    alignItems: "center",
  },
  pageBtn: {
    backgroundColor: Colores.azul,
    borderRadius: 6,
    marginHorizontal: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pageBtnTxt: {
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 16,
  },
  pageNumber: {
    fontWeight: "bold",
    color: Colores.azul,
    fontSize: 16,
    minWidth: 70,
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: Colores.blanco,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontWeight: "bold",
    color: Colores.azul,
    fontSize: 18,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: Colores.texto,
    marginVertical: 3,
    textAlign: "center",
  },
  modalBtns: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    borderRadius: 8,
    marginHorizontal: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  modalBtnText: {
    color: Colores.blanco,
    fontWeight: "bold",
  },
  modalCerrar: {
    marginTop: 14,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  modalCerrarTxt: {
    color: Colores.blanco,
    fontWeight: "bold",
  },

  reloadBtn: {
    backgroundColor: Colores.azul,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  reloadTxt: { color: Colores.blanco, fontWeight: "bold" },

  busyOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  busyBox: {
    width: "80%",
    backgroundColor: Colores.blanco,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
});
