// app/(principal)/admin/propietarios.tsx
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

/** === Colores base (mismo set) === */
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
  correo: string; // para búsqueda, NO se muestra
  estado: "ACTIVO" | "SUSPENDIDO";
  nombre_local?: string | null; // <- NUEVO: viene desde listarPropietarios()
};

type ApiList = { ok: true; total: number; usuarios: UsuarioListadoDTO[] };

type Filtro = "TODOS" | "ACTIVOS" | "SUSPENDIDOS";
const PAGE_SIZE = 15 as const;

export default function Propietarios() {
  /** === Estado principal === */
  const [ownersAll, setOwnersAll] = useState<UsuarioListadoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** === Controles UI === */
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [page, setPage] = useState(1);

  /** === Modal simple (igual que clientes base) === */
  const [modalVisible, setModalVisible] = useState(false);
  const [ownerSel, setOwnerSel] = useState<UsuarioListadoDTO | null>(null);

  /** === Confirma / Resultado / Busy === */
  const [confirm, setConfirm] = useState<{
    visible: boolean;
    accion?: "activar" | "suspender";
    target?: UsuarioListadoDTO | null;
    nombreLocal?: string | null;
  }>({
    visible: false,
    target: null,
    nombreLocal: null,
  });

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

  /** === Carga desde el back === */
  const fetchOwners = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = (await api("/listaUsuarios/propietarios")) as ApiList;
      setOwnersAll(res.usuarios);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo obtener la lista de propietarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  /** === Filtro + búsqueda === */
  const ownersFiltrados = useMemo(() => {
    let base = ownersAll;
    if (filtro === "ACTIVOS") base = base.filter((o) => o.estado === "ACTIVO");
    if (filtro === "SUSPENDIDOS") base = base.filter((o) => o.estado === "SUSPENDIDO");

    const q = busqueda.trim().toLowerCase();
    if (q) {
      base = base.filter(
        (o) =>
          o.nombre_completo.toLowerCase().includes(q) ||
          (o.celular ?? "").toLowerCase().includes(q)
      );
    }
    return base;
  }, [ownersAll, filtro, busqueda]);

  // paginación
  const totalPages = Math.max(1, Math.ceil(ownersFiltrados.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageSlice = useMemo(
    () => ownersFiltrados.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
    [ownersFiltrados, pageSafe]
  );

  useEffect(() => {
    setPage(1);
  }, [filtro, busqueda]);

  /** === Acciones === */
  const abrirModal = (o: UsuarioListadoDTO) => {
    setOwnerSel(o);
    setModalVisible(true);
  };

  const abrirConfirm = (o: UsuarioListadoDTO) => {
    setOwnerSel(o);
    const accion = o.estado === "ACTIVO" ? "suspender" : "activar";
    setConfirm({
      visible: true,
      target: o,
      accion,
      nombreLocal: o.nombre_local ?? null, // <- usa el nombre del local del listado
    });
  };

  const cambiarEstado = async () => {
    if (!confirm.target || !confirm.accion) return;

    setConfirm({ visible: false, target: null, nombreLocal: null });
    setBusy({
      visible: true,
      msg: confirm.accion === "suspender" ? "Suspendiendo cuenta…" : "Activando cuenta…",
    });

    try {
      const url =
        confirm.accion === "suspender"
          ? `/listaUsuarios/suspender/${confirm.target.id_usuario}`
          : `/listaUsuarios/activar/${confirm.target.id_usuario}`;

      // Esperamos: { ok, message, id_usuario, estado, nombre_local }
      const resp = (await api(url, { method: "PATCH" })) as {
        ok: boolean;
        message: string;
        id_usuario: number;
        estado: "ACTIVO" | "INACTIVO";
        nombre_local?: string | null;
      };

      // actualizar en memoria (estado del usuario)
      setOwnersAll((prev) =>
        prev.map((o) =>
          o.id_usuario === confirm.target!.id_usuario
            ? {
                ...o,
                estado: resp.estado === "ACTIVO" ? "ACTIVO" : "SUSPENDIDO",
                // si back devolvió nombre_local, lo guardamos para futuras aperturas
                nombre_local: resp.nombre_local ?? o.nombre_local ?? null,
              }
            : o
        )
      );

      const nombreLocalPatch = resp.nombre_local ?? confirm.nombreLocal ?? null;

      setResult({
        visible: true,
        type: "success",
        title: "Operación exitosa",
        message:
          confirm.accion === "suspender"
            ? `La cuenta del propietario fue suspendida.${
                nombreLocalPatch ? ` Su local "${nombreLocalPatch}" también fue suspendido.` : " Su local también fue suspendido."
              }`
            : `La cuenta del propietario fue activada.${
                nombreLocalPatch ? ` Su local "${nombreLocalPatch}" fue reactivado.` : " Su local fue reactivado."
              }`,
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

  /** === Renders principales (idéntico look) === */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colores.azul} />
        <Text style={{ color: Colores.grisTxtSec, marginTop: 8 }}>Cargando propietarios…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.titulo}>Lista de Propietarios</Text>
        <Text style={{ color: Colores.rojo, marginBottom: 10 }}>{error}</Text>
        <TouchableOpacity style={styles.reloadBtn} onPress={fetchOwners}>
          <Ionicons name="refresh" size={18} color={Colores.blanco} />
          <Text style={styles.reloadTxt}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={styles.titulo}>Lista de Propietarios</Text>

      {/* Buscador */}
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

      {/* Tabla (mismo formato, sin correo) */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerText, { flex: 2 }]}>Nombre del Propietario</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>Celular</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>Estado</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>Acción</Text>
      </View>

      {pageSlice.map((o) => (
        <View key={o.id_usuario} style={styles.dataRow}>
          <Text style={[styles.dataText, { flex: 2, textAlign: "left" }]}>{o.nombre_completo}</Text>
          <Text style={[styles.dataText, { flex: 1 }]}>{o.celular ?? "-"}</Text>
          <Text
            style={[
              styles.dataText,
              { flex: 1, color: o.estado === "ACTIVO" ? Colores.verde : Colores.rojo, fontWeight: "bold" },
            ]}
          >
            {o.estado}
          </Text>

          <View style={{ flex: 1 }}>
            {o.estado === "ACTIVO" ? (
              <TouchableOpacity
                style={[styles.accionBtn, { backgroundColor: Colores.rojo }]}
                onPress={() => abrirConfirm(o)}
              >
                <Text style={styles.accionTxt}>Suspender</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.accionBtn, { backgroundColor: Colores.azul }]}
                onPress={() => abrirConfirm(o)}
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

      {/* Modal simple (igual que clientes, solo cambia etiqueta) */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Cambiar estado</Text>
            <Text style={styles.modalText}>
              Propietario: <Text style={{ fontWeight: "bold" }}>{ownerSel?.nombre_completo}</Text>
            </Text>
            <Text style={styles.modalText}>
              Estado actual:{' '}
              <Text
                style={{
                  color: ownerSel?.estado === "ACTIVO" ? Colores.verde : Colores.rojo,
                  fontWeight: "bold",
                }}
              >
                {ownerSel?.estado}
              </Text>
            </Text>

            {/* Nombre de su local si existe (del listado) */}
            {ownerSel?.nombre_local ? (
              <Text style={styles.modalText}>
                Local asociado:{' '}
                <Text style={{ fontWeight: "bold" }}>{ownerSel.nombre_local}</Text>
              </Text>
            ) : null}

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colores.verde }]}
                onPress={() => {
                  setModalVisible(false);
                  if (ownerSel) abrirConfirm({ ...ownerSel, estado: "SUSPENDIDO" } as any);
                }}
              >
                <Text style={styles.modalBtnText}>Activar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colores.rojo }]}
                onPress={() => {
                  setModalVisible(false);
                  if (ownerSel) abrirConfirm({ ...ownerSel, estado: "ACTIVO" } as any);
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

      {/* Confirmación (con detalle del local si existe) */}
      <ConfirmModal
        visible={confirm.visible}
        title={confirm.accion === "suspender" ? "Confirmar suspensión" : "Confirmar activación"}
        message={
          confirm.accion === "suspender"
            ? `Se suspenderá la cuenta del propietario.\n${
                confirm.nombreLocal
                  ? `Su local: "${confirm.nombreLocal}" también será suspendido.`
                  : "Su local también será suspendido."
              }\n¿Desea continuar?`
            : `Se activará la cuenta del propietario.\n${
                confirm.nombreLocal
                  ? `Su local: "${confirm.nombreLocal}" también será activado.`
                  : "Su local también será activado."
              }\n¿Desea continuar?`
        }
        onCancel={() => setConfirm({ visible: false, target: null, nombreLocal: null })}
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
            <Text style={{ marginTop: 10, color: Colores.grisTxtSec, fontWeight: "700" }}>
              {busy.msg}
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/** === Chip de filtro (igual) === */
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

/** === Estilos (idénticos a clientes) === */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colores.blanco,
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

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
