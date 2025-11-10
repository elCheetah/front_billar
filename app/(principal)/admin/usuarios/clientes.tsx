// app/(principal)/admin/clientes.tsx
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

/** === Colores base (manteniendo tu formato) === */
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

/** === Tipos que devuelve el back === */
type UsuarioListadoDTO = {
  id_usuario: number;
  nombre_completo: string;
  celular: string | null;
  correo: string;
  estado: "ACTIVO" | "SUSPENDIDO";
};

type ApiList = { ok: true; total: number; usuarios: UsuarioListadoDTO[] };

type Filtro = "TODOS" | "ACTIVOS" | "SUSPENDIDOS";
const PAGE_SIZE = 15 as const;

export default function Clientes() {
  /** === Estado principal === */
  const [clientesAll, setClientesAll] = useState<UsuarioListadoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** === Controles de UI (mismo formato + filtros) === */
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [page, setPage] = useState(1);

  /** === Modales === */
  const [modalVisible, setModalVisible] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<UsuarioListadoDTO | null>(null);

  const [confirm, setConfirm] = useState<{
    visible: boolean;
    accion?: "activar" | "suspender";
  }>({ visible: false });

  const [busy, setBusy] = useState<{ visible: boolean; msg: string }>({ visible: false, msg: "" });

  const [result, setResult] = useState<{
    visible: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({ visible: false, type: "success", title: "", message: "" });

  /** === Carga desde el back (1000 o lo que haya) === */
  const fetchClientes = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = (await api("/listaUsuarios/clientes")) as ApiList;
      setClientesAll(res.usuarios);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo obtener la lista de clientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  /** === Filtro + búsqueda === */
  const clientesFiltrados = useMemo(() => {
    let base = clientesAll;

    // filtro estado
    if (filtro === "ACTIVOS") base = base.filter((c) => c.estado === "ACTIVO");
    if (filtro === "SUSPENDIDOS") base = base.filter((c) => c.estado === "SUSPENDIDO");

    // búsqueda simple por nombre/celular/correo
    const q = busqueda.trim().toLowerCase();
    if (q) {
      base = base.filter(
        (c) =>
          c.nombre_completo.toLowerCase().includes(q) ||
          (c.celular ?? "").toLowerCase().includes(q)
      );
    }

    return base;
  }, [clientesAll, filtro, busqueda]);

  // paginación
  const totalPages = Math.max(1, Math.ceil(clientesFiltrados.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageSlice = useMemo(
    () => clientesFiltrados.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
    [clientesFiltrados, pageSafe]
  );

  // reset a página 1 cuando cambien filtro/búsqueda
  useEffect(() => {
    setPage(1);
  }, [filtro, busqueda]);

  /** === Acciones === */
  const abrirModal = (cliente: UsuarioListadoDTO) => {
    setClienteSeleccionado(cliente);
    setModalVisible(true);
  };

  const abrirConfirm = (cliente: UsuarioListadoDTO) => {
    setClienteSeleccionado(cliente);
    setConfirm({
      visible: true,
      accion: cliente.estado === "ACTIVO" ? "suspender" : "activar",
    });
  };

  const cambiarEstado = async () => {
    if (!clienteSeleccionado || !confirm.accion) return;

    setConfirm({ visible: false });
    setBusy({
      visible: true,
      msg: confirm.accion === "suspender" ? "Suspendiendo cuenta…" : "Activando cuenta…",
    });

    try {
      const url =
        confirm.accion === "suspender"
          ? `/listaUsuarios/suspender/${clienteSeleccionado.id_usuario}`
          : `/listaUsuarios/activar/${clienteSeleccionado.id_usuario}`;
      await api(url, { method: "PATCH" });

      // actualizar en memoria
      setClientesAll((prev) =>
        prev.map((c) =>
          c.id_usuario === clienteSeleccionado.id_usuario
            ? { ...c, estado: confirm.accion === "suspender" ? "SUSPENDIDO" : "ACTIVO" }
            : c
        )
      );

      setResult({
        visible: true,
        type: "success",
        title: "Operación exitosa",
        message:
          confirm.accion === "suspender"
            ? "La cuenta del cliente fue suspendida correctamente."
            : "La cuenta del cliente fue activada correctamente.",
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

  /** === Renders principales (formato base) === */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colores.azul} />
        <Text style={{ color: Colores.grisTxtSec, marginTop: 8 }}>Cargando clientes…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.titulo}>Lista de Clientes</Text>
        <Text style={{ color: Colores.rojo, marginBottom: 10 }}>{error}</Text>
        <TouchableOpacity style={styles.reloadBtn} onPress={fetchClientes}>
          <Ionicons name="refresh" size={18} color={Colores.blanco} />
          <Text style={styles.reloadTxt}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={styles.titulo}>Lista de Clientes</Text>

      {/* Buscador (manteniendo tu formato) */}
      <Text style={styles.searchLabel}>Buscador:</Text>
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Buscar por nombre o celular…"
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {/* Filtros (añadido sin deformar el resto) */}
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

      {/* Tabla (mismo formato) */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerText, { flex: 2 }]}>Nombre de Cliente</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>Celular</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>Estado</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>Acción</Text>
      </View>

      {pageSlice.map((c) => (
        <View key={c.id_usuario} style={styles.dataRow}>
          <Text style={[styles.dataText, { flex: 2, textAlign: "left" }]}>{c.nombre_completo}</Text>
          <Text style={[styles.dataText, { flex: 1 }]}>{c.celular ?? "-"}</Text>
          <Text
            style={[
              styles.dataText,
              {
                flex: 1,
                color: c.estado === "ACTIVO" ? Colores.verde : Colores.rojo,
                fontWeight: "bold",
              },
            ]}
          >
            {c.estado}
          </Text>

          <View style={{ flex: 1 }}>
            {c.estado === "ACTIVO" ? (
              <TouchableOpacity
                style={[styles.accionBtn, { backgroundColor: Colores.rojo }]}
                onPress={() => abrirConfirm(c)}
              >
                <Text style={styles.accionTxt}>Suspender</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.accionBtn, { backgroundColor: Colores.azul }]}
                onPress={() => abrirConfirm(c)}
              >
                <Text style={styles.accionTxt}>Activar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      {/* Paginación (mismo look, ahora funcional) */}
      <View style={styles.pagination}>
        <TouchableOpacity
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          disabled={pageSafe === 1}
          style={[styles.pageBtn, pageSafe === 1 && { backgroundColor: "#CAD6FF" }]}
        >
          <Text style={[styles.pageBtnTxt, pageSafe === 1 && { color: "#FFF" }]}>{"<"}</Text>
        </TouchableOpacity>

        <Text style={styles.pageNumber}>
          {pageSafe} / {totalPages}
        </Text>

        <TouchableOpacity
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={pageSafe === totalPages}
          style={[styles.pageBtn, pageSafe === totalPages && { backgroundColor: "#CAD6FF" }]}
        >
          <Text style={[styles.pageBtnTxt, pageSafe === totalPages && { color: "#FFF" }]}>{">"}</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de detalle (tu modal base, lo dejamos igual para “ver/cambiar”) */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Cambiar estado</Text>
            <Text style={styles.modalText}>
              Cliente: <Text style={{ fontWeight: "bold" }}>{clienteSeleccionado?.nombre_completo}</Text>
            </Text>
            <Text style={styles.modalText}>
              Estado actual:{" "}
              <Text
                style={{
                  color: clienteSeleccionado?.estado === "ACTIVO" ? Colores.verde : Colores.rojo,
                  fontWeight: "bold",
                }}
              >
                {clienteSeleccionado?.estado}
              </Text>
            </Text>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colores.verde }]}
                onPress={() => {
                  setModalVisible(false);
                  if (clienteSeleccionado) abrirConfirm({ ...clienteSeleccionado, estado: "SUSPENDIDO" } as any); // solo para reusar confirm
                }}
              >
                <Text style={styles.modalBtnText}>Activar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colores.rojo }]}
                onPress={() => {
                  setModalVisible(false);
                  if (clienteSeleccionado) abrirConfirm({ ...clienteSeleccionado, estado: "ACTIVO" } as any);
                }}
              >
                <Text style={styles.modalBtnText}>Suspender</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalCerrar, { backgroundColor: Colores.azul }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCerrarTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirmación profesional */}
      <ConfirmModal
        visible={confirm.visible}
        title={confirm.accion === "suspender" ? "Confirmar suspensión" : "Confirmar activación"}
        message={
          confirm.accion === "suspender"
            ? `Se suspenderá la cuenta del cliente.\n¿Desea continuar?`
            : `Se activará la cuenta del cliente.\n¿Desea continuar?`
        }
        onCancel={() => setConfirm({ visible: false })}
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

      {/* Busy / Cargando acción */}
      <Modal visible={busy.visible} transparent animationType="fade">
        <View style={styles.busyOverlay}>
          <View style={styles.busyBox}>
            <ActivityIndicator size="large" color={Colores.azul} />
            <Text style={{ marginTop: 10, color: Colores.grisTxtSec, fontWeight: "700" }}>{busy.msg}</Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/** === Chip de filtro (visual simple tipo check) === */
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

/** === Estilos (idéntico formato base, con mínimos añadidos) === */
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
