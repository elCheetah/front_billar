// app/local/mi-qr.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { api } from "../../../components/api";
import ConfirmModal from "../../../components/modals/ConfirmModal";
import ResultModal from "../../../components/modals/ResultModal";
import { getToken } from "../../../utils/authStorage";

const Colores = {
  primario: "#0066FF",
  primarioOscuro: "#0033A0",
  verde: "#2A9D8F",
  fondo: "#F4F7FB",
  textoClaro: "#FFFFFF",
  borde: "#E0E0E0",
  error: "#FF4B4B",
  gris: "#888",
};

const MAX_IMAGE_BYTES = 500 * 1024; // 500 KB

/* ========== Helper: devuelve DATA URI (como en registro-propietario) ========== */
async function pickCompressedSquareDataURI(
  setResult: (r: { type: "success" | "error"; title: string; msg: string } | null) => void
): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.status !== "granted") {
    setResult({
      type: "error",
      title: "Permiso denegado",
      msg: "Autoriza el acceso a la galería para cargar el QR.",
    });
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
    allowsEditing: true,    // recorte manual
    aspect: [1, 1],         // cuadrado
  } as any);
  if (res.canceled) return null;

  const a = res.assets?.[0];
  if (!a?.uri) return null;

  // Asegurar cuadrado centrado si el picker no lo respetara
  let workingUri = a.uri;
  let width = a.width ?? 1200;
  let height = a.height ?? 1200;
  if (width !== height) {
    const size = Math.min(width, height);
    const originX = Math.floor((width - size) / 2);
    const originY = Math.floor((height - size) / 2);
    const cropped = await manipulateAsync(
      workingUri,
      [{ crop: { originX, originY, width: size, height: size } }],
      { compress: 1, format: SaveFormat.JPEG }
    );
    workingUri = cropped.uri;
    width = size;
    height = size;
  }

  // Compresión progresiva -> DATA URI JPEG ≤ 500KB (igual enfoque que tu registro)
  let target = Math.min(width || 1200, 1200);
  let quality = 0.85;
  for (let i = 0; i < 6; i++) {
    const out = await manipulateAsync(
      workingUri,
      [{ resize: { width: target, height: target } }],
      { compress: quality, format: SaveFormat.JPEG, base64: true }
    );
    const b64 = out.base64 || "";
    const bytes = Math.ceil((b64.length * 3) / 4);

    if (bytes <= MAX_IMAGE_BYTES) {
      return `data:image/jpeg;base64,${b64}`; // 👈 DATA URI (como en registro-propietario)
    }
    target = Math.floor(target * 0.9);
    quality = Math.max(0.5, quality - 0.08);
  }

  setResult({
    type: "error",
    title: "Imagen muy pesada",
    msg: "No se pudo comprimir por debajo de 500 KB. Elige otra imagen.",
  });
  return null;
}

/* ============================== Pantalla ============================== */

export default function MiQrLocal() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const [qrUrl, setQrUrl] = useState<string | null>(null);     // QR actual (URL del back)
  const [draftDataUri, setDraftDataUri] = useState<string | null>(null); // borrador local (DATA URI)
  const [pendingDataUri, setPendingDataUri] = useState<string | null>(null); // selección a confirmar

  // Modales
  const [confirmPick, setConfirmPick] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; title: string; msg: string } | null>(null);

  const previewSrc = useMemo(() => draftDataUri ?? qrUrl ?? null, [draftDataUri, qrUrl]);
  const hayCambios = !!draftDataUri;

  /* ---- Cargar QR actual ---- */
  const fetchActual = async () => {
    try {
      setCargando(true);
      const token = await getToken();
      const res = await api("/local/qr", { method: "GET", token: token || undefined });
      setQrUrl(res.qr_url || null);
    } catch (e: any) {
      setResult({ type: "error", title: "No se pudo cargar", msg: String(e?.message || "Intenta nuevamente.") });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchActual();
  }, []);

  /* ---- Acciones ---- */
  const seleccionarQr = async () => {
    const dataUri = await pickCompressedSquareDataURI(setResult);
    if (dataUri) {
      // No guardamos ni aplicamos directo: pedimos confirmación
      setPendingDataUri(dataUri);
      setConfirmPick(true);
    }
  };

  const confirmarUsarSeleccion = () => {
    if (pendingDataUri) {
      setDraftDataUri(pendingDataUri);
      setPendingDataUri(null);
    }
    setConfirmPick(false);
  };
  const cancelarUsarSeleccion = () => {
    setPendingDataUri(null);
    setConfirmPick(false);
  };

  const pedirConfirmGuardar = () => {
    if (!draftDataUri) {
      setResult({ type: "error", title: "Sin cambios", msg: "Selecciona una imagen antes de guardar." });
      return;
    }
    setConfirmSave(true);
  };

  const guardarQr = async () => {
    if (!draftDataUri) return;
    try {
      setConfirmSave(false);
      setGuardando(true);
      const token = await getToken();
      // 👇 Igual que tu registro: el campo se llama "base64" y contiene la DATA URI
      const res = await api("/local/qr", {
        method: "PUT",
        token: token || undefined,
        body: { base64: draftDataUri },
      });
      setQrUrl(res.qr_url || null);
      setDraftDataUri(null);
      setResult({ type: "success", title: "Actualización exitosa", msg: "El QR de cobros fue actualizado." });
    } catch (e: any) {
      setResult({ type: "error", title: "No se pudo actualizar", msg: String(e?.message || "Intenta nuevamente.") });
    } finally {
      setGuardando(false);
    }
  };

  const pedirConfirmEliminar = () => {
    if (!qrUrl) {
      setResult({ type: "error", title: "Sin QR registrado", msg: "No hay un QR para eliminar." });
      return;
    }
    setConfirmDelete(true);
  };

  const eliminarQr = async () => {
    try {
      setConfirmDelete(false);
      setEliminando(true);
      const token = await getToken();
      await api("/local/qr", { method: "DELETE", token: token || undefined });
      setQrUrl(null);
      setDraftDataUri(null);
      setResult({ type: "success", title: "Eliminado", msg: "El QR de cobros fue eliminado." });
    } catch (e: any) {
      setResult({ type: "error", title: "No se pudo eliminar", msg: String(e?.message || "Intenta nuevamente.") });
    } finally {
      setEliminando(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colores.fondo }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.contenedor}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => { /* navega atrás si corresponde */ }}>
              <Ionicons name="arrow-back" size={22} color={Colores.primarioOscuro} />
            </Pressable>
            <Text style={styles.titulo}>QR de cobros</Text>
            <View style={{ width: 22 }} />
          </View>

          {/* Preview */}
          {cargando ? (
            <View style={[styles.qrBox, { alignItems: "center", justifyContent: "center" }]}>
              <ActivityIndicator />
            </View>
          ) : (
            <View style={styles.qrBox}>
              {previewSrc ? (
                <Image source={{ uri: previewSrc }} style={styles.qrImg} />
              ) : (
                <View style={styles.placeholder}>
                  <Ionicons name="image-outline" size={36} color={Colores.gris} />
                  <Text style={styles.placeholderTxt}>Sin QR registrado</Text>
                </View>
              )}
            </View>
          )}

          {/* Botones principales */}
          <View style={styles.row}>
            <TouchableOpacity style={styles.btnSec} onPress={seleccionarQr} disabled={cargando}>
              <Ionicons name="cloud-upload-outline" size={18} color={Colores.primario} />
              <Text style={styles.btnSecTxt}>{previewSrc ? "Cambiar" : "Subir"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnSec, (!qrUrl) && { opacity: 0.5 }]}
              disabled={!qrUrl}
              onPress={pedirConfirmEliminar}
            >
              {eliminando ? (
                <ActivityIndicator />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={18} color={Colores.error} />
                  <Text style={[styles.btnSecTxt, { color: Colores.error }]}>Eliminar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Guardar cambios */}
          {hayCambios && (
            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: Colores.primario }]}
              onPress={pedirConfirmGuardar}
              disabled={guardando}
              activeOpacity={0.9}
            >
              {guardando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={styles.btnPrimaryTxt}>Guardar</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Info profesional */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={18} color={Colores.primario} />
            <Text style={styles.infoTxt}>
              Este QR se utiliza para cobros de reservas en el local. Genere un código desde su entidad financiera
              con vigencia prolongada, guarde la imagen y súbala aquí para facilitar el pago a sus clientes.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirmar usar imagen seleccionada */}
      <ConfirmModal
        visible={confirmPick}
        title="Usar imagen seleccionada"
        message="¿Desea establecer esta imagen como QR pendiente de guardado?"
        cancelText="Cancelar"
        confirmText="Sí, usar"
        onCancel={cancelarUsarSeleccion}
        onConfirm={confirmarUsarSeleccion}
      />

      {/* Confirmar guardar */}
      <ConfirmModal
        visible={confirmSave}
        title="Guardar QR"
        message="Se actualizará el QR de cobros del local."
        cancelText="Cancelar"
        confirmText="Sí, guardar"
        onCancel={() => setConfirmSave(false)}
        onConfirm={guardarQr}
      />

      {/* Confirmar eliminar */}
      <ConfirmModal
        visible={confirmDelete}
        title="Eliminar QR"
        message="¿Desea quitar el QR de cobros del local?"
        cancelText="Cancelar"
        confirmText="Sí, eliminar"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={eliminarQr}
      />

      {/* Resultado */}
      <ResultModal
        visible={!!result}
        type={result?.type === "success" ? "success" : "error"}
        title={result?.title || ""}
        message={result?.msg || ""}
        onClose={() => setResult(null)}
      />
    </View>
  );
}

/* ============================== Estilos ============================== */

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  contenedor: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  backBtn: { padding: 6 },
  titulo: { fontSize: 20, fontWeight: "bold", color: Colores.primarioOscuro },

  qrBox: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: 12,
    overflow: "hidden",
  },
  qrImg: { width: "100%", height: "100%" },
  placeholder: {
    width: "100%",
    height: "100%",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: Colores.borde,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  placeholderTxt: { color: Colores.gris },

  row: { flexDirection: "row", gap: 10, marginTop: 12 },
  btnSec: {
    flex: 1,
    height: 44,
    backgroundColor: "#E8F0FF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colores.borde,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  btnSecTxt: { color: Colores.primario, fontWeight: "600" },

  btnPrimary: {
    marginTop: 12,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  btnPrimaryTxt: { color: "#fff", fontWeight: "bold" },

  infoCard: {
    marginTop: 14,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colores.borde,
    flexDirection: "row",
    gap: 8,
  },
  infoTxt: { flex: 1, color: "#333", fontSize: 12 },
});
