import { Ionicons } from "@expo/vector-icons";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { api } from "../../../components/api";
import ConfirmModal from "../../../components/modals/ConfirmModal";
import ResultModal from "../../../components/modals/ResultModal";
import { AuthUser, getToken, getUser } from "../../../utils/authStorage";

/* 🎨 Colores base */
const Colores = {
  primario: "#0066FF",
  primarioOscuro: "#0033A0",
  verde: "#2A9D8F",
  fondo: "#F4F7FB",
  textoClaro: "#FFFFFF",
  borde: "#E0E0E0",
  error: "#FF4B4B",
  naranja: "#FB8C00",
  inactivoFondo: "#FFEAEA",
};

const TIPOS: Array<"POOL" | "CARAMBOLA" | "SNOOKER" | "MIXTO"> = ["POOL", "CARAMBOLA", "SNOOKER", "MIXTO"];
const decimalValido = /^\d+(\.\d+)?$/;
const MAX_IMAGE_BYTES = 500 * 1024;

/* ---------- Tipos ---------- */
type EstadoMesa = "DISPONIBLE" | "OCUPADO" | "INACTIVO";
type ImgServer = { id: number; uri: string; toDelete?: boolean };
type ImgNueva = { uri: string; isNew: true }; // uri es un dataURI base64
type ImgItem = ImgServer | ImgNueva;

type Touched = Partial<Record<"numero" | "tipo" | "precio" | "descripcion", boolean>>;

type MesaForm = {
  id?: number;
  numero: string;
  tipo: "" | (typeof TIPOS)[number];
  precio: string;
  descripcion: string;
  estado?: EstadoMesa;
  inactiva?: boolean;
  fotos: ImgItem[];
  touched: Touched;
  editable: boolean;
  isNew?: boolean;
  _original?: {
    numero: string;
    tipo: string;
    precio: string;
    descripcion: string;
    serverFotoIds: number[];
  };
};

/* ---------- Utils ---------- */
function normalizeDecimal(input: string) {
  let v = input.replace(",", ".").replace(/[^0-9.]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  return v;
}

async function pickCompressedDataURI(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.status !== "granted") {
    Alert.alert("Permiso denegado", "Debes permitir el acceso a la galería.");
    return null;
  }

  const mediaTypes: any =
    (ImagePicker as any).MediaType?.Images ??
    (ImagePicker as any).MediaTypeOptions?.Images ??
    ImagePicker.MediaTypeOptions.Images;

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes,
    quality: 1,
    base64: false,
    allowsEditing: false,
  } as any);
  if (res.canceled) return null;

  const a = res.assets[0];
  let width = Math.min(a.width || 1600, 1600);
  let quality = 0.8;

  for (let i = 0; i < 5; i++) {
    const r = await manipulateAsync(
      a.uri,
      [{ resize: { width } }],
      { compress: quality, format: SaveFormat.JPEG, base64: true }
    );
    const b64 = r.base64 || "";
    const bytes = Math.ceil((b64.length * 3) / 4);
    if (bytes <= MAX_IMAGE_BYTES) return `data:image/jpeg;base64,${b64}`;
    width = Math.floor(width * 0.85);
    quality = Math.max(0.4, quality - 0.12);
  }

  Alert.alert("Imagen demasiado pesada", "No se pudo comprimir por debajo de 500 KB. Elige otra imagen.");
  return null;
}

function slugifyName(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function isDirty(m: MesaForm) {
  if (m.isNew) {
    return !!(m.numero || m.tipo || m.precio || m.descripcion || m.fotos.length);
  }
  if (!m._original) return false;
  const baseChanged =
    m.numero !== m._original.numero ||
    m.tipo !== m._original.tipo ||
    m.precio !== m._original.precio ||
    m.descripcion !== m._original.descripcion;

  const newCount = m.fotos.filter((f): f is ImgNueva => "isNew" in f && f.isNew).length;
  const deleted = m.fotos.some((f) => "id" in f && !!f.toDelete);

  return baseChanged || newCount > 0 || deleted;
}

/* ---------- Validaciones (idénticas al registro) ---------- */
const valMesa = (m: MesaForm) => ({
  numero: !!m.numero && /^\d+$/.test(m.numero) && parseInt(m.numero, 10) >= 1,
  tipo: m.tipo !== "",
  precio: !!m.precio && decimalValido.test(m.precio) && parseFloat(m.precio) >= 0,
});

/* ================= Componente ================= */
export default function GestionMesas() {
  const [usuario, setUsuario] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mesas, setMesas] = useState<MesaForm[]>([]);

  // Modal de tipo – índice de mesa abierta
  const [modalTipoIdx, setModalTipoIdx] = useState<number | null>(null);

  // Confirmaciones (no incluye Quitar de nueva mesa)
  const [confirm, setConfirm] = useState<
    | null
    | { tipo: "pdf" }
    | { tipo: "editar"; idx: number }
    | { tipo: "guardar"; idx: number }
    | { tipo: "eliminar"; idx: number }
    | { tipo: "inhabilitar"; idx: number }
    | { tipo: "habilitar"; idx: number }
  >(null);

  const [result, setResult] = useState<{ type: "success" | "error"; title: string; msg: string } | null>(null);

  /* ---- cargar auth + mesas ---- */
  useEffect(() => {
    (async () => {
      try {
        const [t, u] = await Promise.all([getToken(), getUser()]);
        setUsuario(u);
        setToken(t);
        await cargarMesas(t || undefined);
      } catch (e: any) {
        setResult({ type: "error", title: "Error", msg: e?.message || "No se pudo inicializar." });
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const cargarMesas = async (tk?: string) => {
    try {
      const json = await api("/mesas/listar", { token: tk });
      const arr: MesaForm[] = (json.data || []).map((x: any) => {
        const fotos: ImgItem[] = (x.imagenes || []).map((im: any) => ({ id: im.id_imagen, uri: im.url_imagen }));
        const inactiva = (x.estado as EstadoMesa) === "INACTIVO";
        const m: MesaForm = {
          id: x.id_mesa,
          numero: String(x.numero_mesa ?? ""),
          tipo: String(x.tipo_mesa ?? "") as any,
          precio: String(x.precio_hora ?? ""),
          descripcion: x.descripcion ?? "",
          estado: x.estado as EstadoMesa,
          inactiva,
          fotos,
          touched: {},
          editable: false,
          isNew: false,
        };
        m._original = {
          numero: m.numero,
          tipo: m.tipo,
          precio: m.precio,
          descripcion: m.descripcion,
          serverFotoIds: fotos
            .filter((f): f is ImgServer => "id" in f)
            .map((f) => f.id),
        };
        return m;
      });
      setMesas(arr);
    } catch (e: any) {
      setMesas([]);
      setResult({ type: "error", title: "Error", msg: e?.message || "No se pudo obtener las mesas." });
    }
  };

  /* ---- helpers UI ---- */
  const updateMesa = (i: number, patch: Partial<MesaForm>) =>
    setMesas((prev) => {
      const c = [...prev];
      c[i] = { ...c[i], ...patch };
      return c;
    });

  const setMesaTouched = (i: number, k: keyof Touched) =>
    setMesas((prev) => {
      const c = [...prev];
      c[i].touched = { ...(c[i].touched || {}), [k]: true };
      return c;
    });

  const addMesa = () =>
    setMesas((arr) => [
      ...arr,
      {
        numero: "",
        tipo: "",
        precio: "",
        descripcion: "",
        fotos: [],
        touched: {},
        editable: true,
        isNew: true,
        inactiva: false,
      },
    ]);

  const pickMesaImage = async (idx: number) => {
    const dataUri = await pickCompressedDataURI();
    if (!dataUri) return;
    setMesas((prev) => {
      const c = [...prev];
      c[idx].fotos.push({ uri: dataUri, isNew: true }); // guardamos dataURI base64
      return c;
    });
  };

  const toggleOrRemoveImage = (i: number, j: number) =>
    setMesas((prev) => {
      const c = [...prev];
      const f = c[i].fotos[j];
      if ("isNew" in f && f.isNew) {
        c[i].fotos = c[i].fotos.filter((_, k) => k !== j); // quitar nuevas
      } else if ("id" in f) {
        c[i].fotos[j] = { ...f, toDelete: !f.toDelete }; // marcar/desmarcar borrar server
      }
      return c;
    });

  /* ---- Modal Tipo (igual que registro) ---- */
  const openTipo = (idx: number) => setModalTipoIdx(idx);
  const selectTipo = (tipo: MesaForm["tipo"]) => {
    setMesas((prev) => {
      if (modalTipoIdx === null) return prev;
      const arr = [...prev];
      if (!arr[modalTipoIdx]) return prev;
      arr[modalTipoIdx] = { ...arr[modalTipoIdx], tipo };
      return arr;
    });
    if (modalTipoIdx !== null) setMesaTouched(modalTipoIdx, "tipo");
    setModalTipoIdx(null);
  };

  /* ---- API acciones ---- */
  const guardarMesa = async (idx: number) => {
    setConfirm(null);
    const m = mesas[idx];

    (["numero", "tipo", "precio"] as const).forEach((k) => setMesaTouched(idx, k));
    const v = valMesa(m);
    if (!v.numero || !v.tipo || !v.precio) {
      setResult({ type: "error", title: "Campos obligatorios", msg: "Revisa número, tipo y precio." });
      return;
    }

    try {
      if (m.isNew) {
        // ✅ El backend acepta string[] (dataURI) o { base64: string }[]
        const body = {
          numero_mesa: parseInt(m.numero, 10),
          tipo_mesa: m.tipo,
          precio_hora: parseFloat(m.precio),
          descripcion: m.descripcion || null,
          imagenes: m.fotos
            .filter((f): f is ImgNueva => "isNew" in f && f.isNew)
            .map((f) => ({ base64: f.uri })), // <<—— ENVIAMOS ESTRICTO { base64 }
        };
        await api("/mesas/agregar", { method: "POST", body, token: token || undefined });
      } else {
        // ✅ Editar: agregar N base64 y eliminar M ids en una sola request
        const body: any = {
          numero_mesa: parseInt(m.numero, 10),
          tipo_mesa: m.tipo,
          precio_hora: parseFloat(m.precio),
          descripcion: m.descripcion || null,
          agregar_imagenes: m.fotos
            .filter((f): f is ImgNueva => "isNew" in f && f.isNew)
            .map((f) => ({ base64: f.uri })), // <<—— ENVIAMOS ESTRICTO { base64 }
          eliminar_imagen_ids: m.fotos
            .filter((f): f is ImgServer => "id" in f && !!f.toDelete)
            .map((f) => f.id),
        };
        await api(`/mesas/modificar/${m.id}`, { method: "PATCH", body, token: token || undefined });
      }

      await cargarMesas(token || undefined);
      setResult({ type: "success", title: "Guardado", msg: m.isNew ? "Mesa creada." : "Cambios guardados." });
    } catch (e: any) {
      setResult({ type: "error", title: "Error", msg: e?.message || "No se pudo guardar." });
    }
  };

  const eliminarMesa = async (idx: number) => {
    setConfirm(null);
    const m = mesas[idx];
    try {
      await api(`/mesas/eliminar/${m.id}?tipo=LOGICO`, { method: "DELETE", token: token || undefined });
      await cargarMesas(token || undefined);
      setResult({ type: "success", title: "Eliminada", msg: `Mesa ${m.numero} inactivada.` });
    } catch (e: any) {
      setResult({ type: "error", title: "Error", msg: e?.message || "No se pudo eliminar." });
    }
  };

  const inhabilitarMesa = async (idx: number) => {
    setConfirm(null);
    const m = mesas[idx];
    try {
      await api(`/mesas/cambiarEstado/${m.id}`, {
        method: "PATCH",
        body: { nuevoEstado: "INACTIVO" as EstadoMesa },
        token: token || undefined,
      });
      await cargarMesas(token || undefined);
      setResult({ type: "success", title: "Estado", msg: "Mesa inhabilitada." });
    } catch (e: any) {
      setResult({ type: "error", title: "Error", msg: e?.message || "No se pudo inhabilitar." });
    }
  };

  const habilitarMesa = async (idx: number) => {
    setConfirm(null);
    try {
      await api(`/mesas/cambiarEstado/${mesas[idx].id}`, {
        method: "PATCH",
        body: { nuevoEstado: "DISPONIBLE" as EstadoMesa },
        token: token || undefined,
      });
      await cargarMesas(token || undefined);
      setResult({ type: "success", title: "Estado", msg: "Mesa habilitada." });
    } catch (e: any) {
      setResult({ type: "error", title: "Error", msg: e?.message || "No se pudo habilitar." });
    }
  };

  /* ---- PDF ---- */
  const exportarPDF = async () => {
    setConfirm(null);
    try {
      const propietario = usuario?.nombreCompleto || "Propietario";
      const titulo = `Mesas — Propietario: ${propietario}`;
      const rows = mesas
        .map(
          (m) => `
          <tr>
            <td style="border:1px solid #ccc;padding:6px;text-align:center;">${m.numero}</td>
            <td style="border:1px solid #ccc;padding:6px;">${m.tipo}</td>
            <td style="border:1px solid #ccc;padding:6px;text-align:right;">${Number(m.precio || 0).toFixed(2)}</td>
            <td style="border:1px solid #ccc;padding:6px;">${m.descripcion || ""}</td>
          </tr>`
        )
        .join("");

      const html = `
        <html>
          <head>
            <meta charset="utf-8"/>
            <style>
              body { font-family: -apple-system,Segoe UI,Roboto,Arial; padding: 24px; }
              h1 { font-size: 20px; margin: 0 0 16px; }
              table { width: 100%; border-collapse: collapse; }
              th { text-align: left; border:1px solid #ccc; background:#f4f6f8; padding:8px; }
            </style>
          </head>
          <body>
            <h1>${titulo}</h1>
            <table>
              <thead>
                <tr>
                  <th style="width:10%">N°</th>
                  <th style="width:20%">Tipo</th>
                  <th style="width:15%">Precio (Bs)</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      const safeName = `mesas-${slugifyName(propietario)}.pdf`;
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: safeName });
      }
      setResult({ type: "success", title: "PDF", msg: `Exportado: ${safeName}` });
    } catch (e: any) {
      setResult({ type: "error", title: "PDF", msg: e?.message || "No se pudo generar el PDF." });
    }
  };

  /* ---- render ---- */
  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colores.fondo }}>
        <ActivityIndicator size="large" color={Colores.primario} />
        <Text style={{ marginTop: 8, color: Colores.primarioOscuro, fontWeight: "600" }}>Cargando mesas…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colores.fondo }} contentContainerStyle={estilos.scroll}>
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>Gestión de Mesas</Text>

        {/* Exportar PDF */}
        <TouchableOpacity style={estilos.btnPdf} onPress={() => setConfirm({ tipo: "pdf" })}>
          <Ionicons name="document-text-outline" size={18} color={Colores.primario} />
          <Text style={{ color: Colores.primario, fontWeight: "700" }}>Exportar mesas en PDF</Text>
        </TouchableOpacity>

        {/* Agregar nueva mesa */}
        <TouchableOpacity style={estilos.btnAdd} onPress={addMesa}>
          <Ionicons name="add-circle-outline" size={18} color={Colores.primario} />
          <Text style={{ color: Colores.primario, fontWeight: "700" }}>Agregar nueva mesa</Text>
        </TouchableOpacity>

        {/* Listado */}
        {mesas.map((m, idx) => {
          const editable = m.isNew ? true : m.editable && !m.inactiva;
          const fondo = m.inactiva ? Colores.inactivoFondo : "#fff";
          const v = valMesa(m);
          const dirty = isDirty(m);
          const showSave = !m.inactiva && ((m.isNew && dirty) || (!m.isNew && m.editable && dirty));

          return (
            <View key={m.id ?? `new-${idx}`} style={[estilos.cardMesa, { backgroundColor: fondo }]}>
              {/* ACCIONES ENCIMA, CENTRADAS */}
              <View style={{ alignItems: "center", marginBottom: 8 }}>
                <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                  {m.isNew ? (
                    // Quitar nueva mesa SIN confirmación
                    <TouchableOpacity
                      onPress={() => setMesas((arr) => arr.filter((_, i) => i !== idx))}
                      style={stylesActionBtn()}
                    >
                      <Ionicons name="close-circle-outline" size={18} color={Colores.error} />
                      <Text style={[estilos.btnHeaderTxt, { color: Colores.error }]}>Quitar</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      {!m.inactiva && (
                        <TouchableOpacity
                          onPress={() => setConfirm({ tipo: "editar", idx })}
                          style={stylesActionBtn()}
                        >
                          <Ionicons name="pencil-outline" size={18} color={Colores.primario} />
                          <Text style={[estilos.btnHeaderTxt, { color: Colores.primario }]}>
                            {m.editable ? "Terminar" : "Editar"}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {!m.inactiva && (
                        <TouchableOpacity
                          onPress={() => setConfirm({ tipo: "inhabilitar", idx })}
                          style={stylesActionBtn()}
                        >
                          <Ionicons name="ban-outline" size={18} color={Colores.naranja} />
                          <Text style={[estilos.btnHeaderTxt, { color: Colores.naranja }]}>Inhabilitar</Text>
                        </TouchableOpacity>
                      )}

                      {m.inactiva && (
                        <TouchableOpacity
                          onPress={() => setConfirm({ tipo: "habilitar", idx })}
                          style={stylesActionBtn()}
                        >
                          <Ionicons name="checkmark-circle-outline" size={18} color={Colores.verde} />
                          <Text style={[estilos.btnHeaderTxt, { color: Colores.verde }]}>Habilitar</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => setConfirm({ tipo: "eliminar", idx })}
                        style={stylesActionBtn()}
                      >
                        <Ionicons name="trash-outline" size={18} color={Colores.error} />
                        <Text style={[estilos.btnHeaderTxt, { color: Colores.error }]}>Eliminar</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>

              {/* Título */}
              <View style={estilos.headerMesa}>
                <Text style={estilos.textoNegrita}>Mesa {m.numero || idx + 1}</Text>
              </View>

              {/* Número */}
              <Text style={estilos.label}>Número *</Text>
              <TextInput
                style={[estilos.input, m.touched.numero && !v.numero && estilos.inputError]}
                editable={editable}
                value={m.numero}
                keyboardType="number-pad"
                onChangeText={(t) => updateMesa(idx, { numero: t.replace(/[^0-9]/g, "") })}
                onBlur={() => setMesaTouched(idx, "numero")}
              />
              {m.touched.numero && !v.numero && (
                <Text style={estilos.textoError}>Nro. de mesa debe ser entero ≥ 1.</Text>
              )}

              {/* Tipo con Modal */}
              <Text style={estilos.label}>Tipo *</Text>
              <TouchableOpacity
                style={[estilos.input, estilos.select, m.touched.tipo && !v.tipo && estilos.inputError]}
                onPress={() => editable && openTipo(idx)}
                activeOpacity={0.9}
                disabled={!editable}
              >
                <Text style={{ color: m.tipo ? "#111" : "#888" }}>
                  {m.tipo || "Selecciona un tipo de mesa"}
                </Text>
              </TouchableOpacity>
              {m.touched.tipo && !v.tipo && (
                <Text style={estilos.textoError}>Selecciona un tipo de mesa.</Text>
              )}

              {/* Precio */}
              <Text style={estilos.label}>Precio (Bs) *</Text>
              <TextInput
                style={[estilos.input, m.touched.precio && !v.precio && estilos.inputError]}
                editable={editable}
                keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
                value={m.precio}
                onChangeText={(t) => updateMesa(idx, { precio: normalizeDecimal(t) })}
                onBlur={() => setMesaTouched(idx, "precio")}
              />
              {m.touched.precio && !v.precio && (
                <Text style={estilos.textoError}>Precio por hora debe ser un número ≥ 0.</Text>
              )}

              {/* Descripción */}
              <Text style={estilos.label}>Descripción</Text>
              <TextInput
                style={estilos.input}
                editable={editable}
                value={m.descripcion}
                onChangeText={(t) => updateMesa(idx, { descripcion: t })}
                onBlur={() => setMesaTouched(idx, "descripcion")}
              />

              {/* Fotos */}
              <Text style={estilos.label}>Fotos</Text>
              <View style={estilos.filaImagenes}>
                {m.fotos.map((f, j) => (
                  <View key={j} style={estilos.imgWrap}>
                    <Image
                      source={{ uri: f.uri }}
                      style={[estilos.imgPreview, "id" in f && f.toDelete ? { opacity: 0.35 } : null]}
                    />
                    {editable && (
                      <TouchableOpacity style={estilos.closeBadge} onPress={() => toggleOrRemoveImage(idx, j)}>
                        <Ionicons name={"id" in f && f.toDelete ? "refresh" : "close"} size={14} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {editable && (
                  <TouchableOpacity style={estilos.botonImagen} onPress={() => pickMesaImage(idx)}>
                    <Ionicons name="add" size={22} color={Colores.primario} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Guardar / Guardar cambios */}
              {showSave && (
                <TouchableOpacity
                  style={[estilos.btnGuardarMesa, { backgroundColor: Colores.primario }]}
                  onPress={() => setConfirm({ tipo: "guardar", idx })}
                >
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 8 }}>
                    {m.isNew ? "Guardar" : "Guardar cambios"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* MODAL: seleccionar tipo (formato del registro) */}
      <Modal visible={modalTipoIdx !== null} transparent animationType="fade">
        <View style={estilos.overlay}>
          <Pressable style={estilos.backdrop} onPress={() => setModalTipoIdx(null)} />
          <View style={estilos.modalCard}>
            <Text style={estilos.modalTitle}>Selecciona un tipo de mesa</Text>
            {TIPOS.map((t) => (
              <TouchableOpacity key={t} style={estilos.modalItem} onPress={() => selectTipo(t)}>
                <Text style={{ fontWeight: "600" }}>{t}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[estilos.modalItem, { alignItems: "center" }]}
              onPress={() => setModalTipoIdx(null)}
            >
              <Text style={{ color: "#666" }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirmaciones */}
      <ConfirmModal
        visible={!!confirm && confirm.tipo === "pdf"}
        title="Exportar PDF"
        message="¿Deseas generar el PDF de mesas?"
        cancelText="Cancelar"
        confirmText="Exportar"
        onCancel={() => setConfirm(null)}
        onConfirm={exportarPDF}
      />

      <ConfirmModal
        visible={!!confirm && confirm.tipo === "editar"}
        title="Cambiar edición"
        message="¿Deseas alternar el modo de edición de esta mesa?"
        cancelText="Cancelar"
        confirmText="Confirmar"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm && confirm.tipo === "editar") {
            const { idx } = confirm;
            if (!mesas[idx].inactiva) updateMesa(idx, { editable: !mesas[idx].editable });
            setConfirm(null);
          }
        }}
      />

      <ConfirmModal
        visible={!!confirm && confirm.tipo === "guardar"}
        title="Guardar mesa"
        message="¿Deseas guardar los cambios?"
        cancelText="Cancelar"
        confirmText="Guardar"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm && confirm.tipo === "guardar") guardarMesa(confirm.idx);
        }}
      />

      <ConfirmModal
        visible={!!confirm && confirm.tipo === "eliminar"}
        title="Eliminar (lógico)"
        message="La mesa quedará INACTIVA. ¿Confirmas?"
        cancelText="Cancelar"
        confirmText="Eliminar"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm && confirm.tipo === "eliminar") eliminarMesa(confirm.idx);
        }}
      />

      <ConfirmModal
        visible={!!confirm && confirm.tipo === "inhabilitar"}
        title="Inhabilitar mesa"
        message="¿Deseas inhabilitar esta mesa?"
        cancelText="Cancelar"
        confirmText="Inhabilitar"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm && confirm.tipo === "inhabilitar") inhabilitarMesa(confirm.idx);
        }}
      />

      <ConfirmModal
        visible={!!confirm && confirm.tipo === "habilitar"}
        title="Habilitar mesa"
        message="¿Deseas habilitar esta mesa?"
        cancelText="Cancelar"
        confirmText="Habilitar"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm && confirm.tipo === "habilitar") habilitarMesa(confirm.idx);
        }}
      />

      {/* Resultado */}
      <ResultModal
        visible={!!result}
        type={result?.type || "success"}
        title={result?.title || ""}
        message={result?.msg || ""}
        onClose={() => setResult(null)}
      />
    </ScrollView>
  );
}

/* 🎨 Estilos */
const estilos = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  contenedor: { paddingHorizontal: 20, paddingTop: 24 },
  titulo: { fontSize: 22, fontWeight: "bold", color: Colores.primarioOscuro, marginBottom: 10 },

  btnPdf: {
    backgroundColor: "#E8F0FF",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginBottom: 8,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  btnAdd: {
    backgroundColor: "#E8F0FF",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginBottom: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },

  cardMesa: {
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },

  headerMesa: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  botonesHeader: { flexDirection: "row", gap: 10 },
  btnHeaderTxt: { fontWeight: "bold" },
  textoNegrita: { fontWeight: "bold" },

  label: { fontSize: 13, color: "#111", marginBottom: 6, fontWeight: "600" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 4,
  },
  inputError: { borderColor: Colores.error },
  textoError: { color: Colores.error, fontSize: 12, marginBottom: 8 },

  select: { justifyContent: "center" },

  filaImagenes: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  imgWrap: { width: 60, height: 60, position: "relative" },
  imgPreview: { width: 60, height: 60, borderRadius: 8 },
  closeBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colores.error,
    alignItems: "center",
    justifyContent: "center",
  },
  botonImagen: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: Colores.primario,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  btnGuardarMesa: {
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 8,
    flexDirection: "row",
  },

  // Modal tipo
  overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  backdrop: { ...(StyleSheet.absoluteFillObject as any), backgroundColor: "rgba(0,0,0,0.35)" },
  modalCard: { width: "85%", backgroundColor: "#fff", borderRadius: 14, padding: 16, elevation: 6 },
  modalTitle: { fontWeight: "800", fontSize: 16, marginBottom: 8, color: Colores.primarioOscuro },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
});

/* helpers de estilo */
const stylesActionBtn = () =>
  ({
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colores.borde,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  } as const);
