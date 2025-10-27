// ✅ DATOS DEL LOCAL – versión corregida sin validar coordenadas en front

import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { api } from "../../../components/api";
import ConfirmModal from "../../../components/modals/ConfirmModal";
import ResultModal from "../../../components/modals/ResultModal";
import { AuthUser, getToken, getUser } from "../../../utils/authStorage";

/* 🎨 Colores base (mismos que usas) */
const Colores = {
  primario: "#0066FF",
  primarioOscuro: "#0033A0",
  verde: "#2A9D8F",
  fondo: "#F4F7FB",
  textoClaro: "#FFFFFF",
  borde: "#E0E0E0",
  error: "#FF4B4B",
};

const MAX_IMAGE_BYTES = 500 * 1024;

/* ---------- Tipos ---------- */
type ImgServer = { id: number; uri: string; toDelete?: boolean };
type ImgNueva = { uri: string; isNew: true }; // dataURI base64
type ImgItem = ImgServer | ImgNueva;

type Touched = Partial<Record<"nombre" | "direccion" | "ciudad" | "gps_url", boolean>>;

type LocalForm = {
  id_local?: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  gps_url: string;
  imagenes: ImgItem[];
  touched: Touched;
  editable: boolean;
  _original?: {
    nombre: string;
    direccion: string;
    ciudad: string;
    gps_url: string;
    serverFotoIds: number[];
  };
};

/* ---------- Utils ---------- */

// 🔥 Nueva validación mínima pedida
function isGoogleMapsLink(u: string) {
  const url = u.trim();
  if (!url) return true; // vacío permitido
  if (!/^https?:\/\//i.test(url)) return false;
  return /google\.com\/maps|maps\.app\.goo\.gl/i.test(url);
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

function isDirtyLocal(l: LocalForm) {
  if (!l._original) return false;
  const baseChanged =
    l.nombre !== l._original.nombre ||
    l.direccion !== l._original.direccion ||
    l.ciudad !== l._original.ciudad ||
    l.gps_url !== l._original.gps_url;

  const newCount = l.imagenes.filter((f): f is ImgNueva => "isNew" in f && f.isNew).length;
  const deleted = l.imagenes.some((f) => "id" in f && !!f.toDelete);

  return baseChanged || newCount > 0 || deleted;
}

/* ✅ Validaciones corregidas */
const valLocal = (l: LocalForm) => ({
  nombre: l.nombre.trim().length >= 1,
  direccion: l.direccion.trim().length >= 1,
  ciudad: true, // opcional, el back evalúa
  gps_url: isGoogleMapsLink(l.gps_url),
});

/* ================= Componente ================= */
export default function DatosDelLocal() {
  const [usuario, setUsuario] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const [local, setLocal] = useState<LocalForm>({
    nombre: "",
    direccion: "",
    ciudad: "",
    gps_url: "",
    imagenes: [],
    touched: {},
    editable: false,
  });

  const [confirm, setConfirm] = useState<null | { tipo: "guardar" | "editar" }>(null);
  const [result, setResult] = useState<{ type: "success" | "error"; title: string; msg: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [t, u] = await Promise.all([getToken(), getUser()]);
        setUsuario(u);
        setToken(t);
        await cargarLocal(t || undefined);
      } catch (e: any) {
        setResult({ type: "error", title: "Error", msg: e?.message || "No se pudo inicializar." });
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const cargarLocal = async (tk?: string) => {
    try {
      const json = await api("/local/datos", { token: tk });
      const d = json.data;
      const fotos: ImgItem[] = (d.imagenes || []).map((im: any) => ({ id: im.id_imagen, uri: im.url_imagen }));
      const gpsUrl: string = d.ubicacion?.google_maps_url || "";

      const l: LocalForm = {
        id_local: d.id_local,
        nombre: d.nombre || "",
        direccion: d.direccion || "",
        ciudad: d.ciudad || "",
        gps_url: gpsUrl,
        imagenes: fotos,
        touched: {},
        editable: false,
      };
      l._original = {
        nombre: l.nombre,
        direccion: l.direccion,
        ciudad: l.ciudad,
        gps_url: l.gps_url,
        serverFotoIds: fotos
          .filter((f): f is ImgServer => "id" in f)
          .map((f) => f.id),
      };
      setLocal(l);
    } catch (e: any) {
      setResult({ type: "error", title: "Error", msg: e?.message || "No se pudo obtener los datos del local." });
    }
  };

  /* ---- helpers ---- */
  const setField = (k: keyof Omit<LocalForm, "imagenes" | "touched" | "editable" | "id_local" | "_original">, v: string) =>
    setLocal((prev) => ({ ...prev, [k]: v }));

  const setTouched = (k: keyof Touched) =>
    setLocal((prev) => ({ ...prev, touched: { ...(prev.touched || {}), [k]: true } }));

  const pickLocalImage = async () => {
    const dataUri = await pickCompressedDataURI();
    if (!dataUri) return;
    setLocal((prev) => ({ ...prev, imagenes: [...prev.imagenes, { uri: dataUri, isNew: true }] }));
  };

  const toggleOrRemoveImage = (idx: number) =>
    setLocal((prev) => {
      const c = { ...prev, imagenes: [...prev.imagenes] };
      const f = c.imagenes[idx];
      if ("isNew" in f && f.isNew) {
        c.imagenes = c.imagenes.filter((_, i) => i !== idx); // quitar nuevas
      } else if ("id" in f) {
        c.imagenes[idx] = { ...f, toDelete: !f.toDelete };
      }
      return c;
    });

  const copyGps = async () => {
    const url = local.gps_url.trim();
    if (!url) {
      Alert.alert("GPS", "No hay URL para copiar.");
      return;
    }
    await Clipboard.setStringAsync(url);
    Alert.alert("GPS", "Enlace copiado al portapapeles.");
  };

  /* ---- Guardar ---- */
  const guardar = async () => {
    setConfirm(null);

    const v = valLocal(local);

    if (!v.nombre || !v.direccion || !v.gps_url) {
      setLocal((prev) => ({
        ...prev,
        touched: { nombre: true, direccion: true, ciudad: true, gps_url: true },
      }));
      setResult({ type: "error", title: "Campos inválidos", msg: "Revisa los campos marcados en rojo." });
      return;
    }

    if (!isDirtyLocal(local)) {
      setResult({ type: "success", title: "Sin cambios", msg: "No hay cambios para guardar." });
      return;
    }

    try {
      const body: any = {
        nombre: local.nombre.trim(),
        direccion: local.direccion.trim(),
      };

      if (local.ciudad.trim().length > 0) body.ciudad = local.ciudad.trim();
      if (local.gps_url.trim().length > 0) body.gps_url = local.gps_url.trim();

      body.agregar_imagenes = local.imagenes
        .filter((f): f is ImgNueva => "isNew" in f && f.isNew)
        .map((f) => ({ base64: f.uri }));

      body.eliminar_imagen_ids = local.imagenes
        .filter((f) => "id" in f && !!(f as ImgServer).toDelete)
        .map((f) => (f as ImgServer).id);

      await api("/local/editar", { method: "PUT", body, token: token || undefined });
      await cargarLocal(token || undefined);
      setResult({ type: "success", title: "Guardado", msg: "Datos del local actualizados." });
    } catch (e: any) {
      setResult({ type: "error", title: "Error", msg: e?.message || "No se pudo actualizar el local." });
    }
  };

  /* ---- render ---- */
  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colores.fondo }}>
        <ActivityIndicator size="large" color={Colores.primario} />
        <Text style={{ marginTop: 8, color: Colores.primarioOscuro, fontWeight: "600" }}>Cargando datos…</Text>
      </View>
    );
  }

  const v = valLocal(local);
  const editable = local.editable;
  const dirty = isDirtyLocal(local);
  const showSave = editable && dirty;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colores.fondo }} contentContainerStyle={estilos.scroll}>
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>Datos del local</Text>

        {/* ACCIONES */}
        <View style={{ alignItems: "center", marginBottom: 10 }}>
          <TouchableOpacity onPress={() => setConfirm({ tipo: "editar" })} style={stylesActionBtn()}>
            <Ionicons name="pencil-outline" size={18} color={Colores.primario} />
            <Text style={[estilos.btnHeaderTxt, { color: Colores.primario }]}>
              {editable ? "Terminar" : "Editar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* NOMBRE */}
        <Text style={estilos.label}>Nombre *</Text>
        <TextInput
          style={[estilos.input, local.touched.nombre && !v.nombre && estilos.inputError]}
          editable={editable}
          value={local.nombre}
          onChangeText={(t) => setField("nombre", t)}
          onBlur={() => setTouched("nombre")}
        />
        {local.touched.nombre && !v.nombre && (
          <Text style={estilos.textoError}>Debe tener al menos 1 caracter.</Text>
        )}

        {/* DIRECCIÓN */}
        <Text style={estilos.label}>Dirección *</Text>
        <TextInput
          style={[estilos.input, local.touched.direccion && !v.direccion && estilos.inputError]}
          editable={editable}
          value={local.direccion}
          onChangeText={(t) => setField("direccion", t)}
          onBlur={() => setTouched("direccion")}
        />
        {local.touched.direccion && !v.direccion && (
          <Text style={estilos.textoError}>Debe tener al menos 1 caracter.</Text>
        )}

        {/* CIUDAD */}
        <Text style={estilos.label}>Ciudad (opcional)</Text>
        <TextInput
          style={estilos.input}
          editable={editable}
          value={local.ciudad}
          onChangeText={(t) => setField("ciudad", t)}
          onBlur={() => setTouched("ciudad")}
        />

        {/* GPS URL + copiar */}
        <Text style={estilos.label}>URL de Google Maps (opcional)</Text>
        <View style={{ position: "relative" }}>
          <TextInput
            style={[estilos.input, { paddingRight: 44 }, local.touched.gps_url && !v.gps_url && estilos.inputError]}
            editable={editable}
            value={local.gps_url}
            onChangeText={(t) => setField("gps_url", t)}
            onBlur={() => setTouched("gps_url")}
            placeholder="Pega aquí el enlace de Google Maps"
            autoCapitalize="none"
          />
          <TouchableOpacity style={estilos.copyIcon} onPress={copyGps}>
            <Ionicons name="copy-outline" size={18} color="#444" />
          </TouchableOpacity>
        </View>
        {local.touched.gps_url && !v.gps_url && (
          <Text style={estilos.textoError}>Debe ser un link válido de Google Maps.</Text>
        )}

        {/* IMÁGENES */}
        <Text style={[estilos.label, { marginTop: 6 }]}>Imágenes del local</Text>
        <View style={estilos.filaImagenes}>
          {local.imagenes.map((f, i) => (
            <View key={i} style={estilos.imgWrap}>
              <Image
                source={{ uri: f.uri }}
                style={[estilos.imgPreview, "id" in f && f.toDelete ? { opacity: 0.35 } : null]}
              />
              {editable && (
                <TouchableOpacity style={estilos.closeBadge} onPress={() => toggleOrRemoveImage(i)}>
                  <Ionicons name={"id" in f && f.toDelete ? "refresh" : "close"} size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {editable && (
            <TouchableOpacity style={estilos.botonImagen} onPress={pickLocalImage}>
              <Ionicons name="add" size={22} color={Colores.primario} />
            </TouchableOpacity>
          )}
        </View>

        {/* GUARDAR */}
        {showSave && (
          <TouchableOpacity
            style={[estilos.btnGuardar, { backgroundColor: Colores.primario }]}
            onPress={() => setConfirm({ tipo: "guardar" })}
          >
            <Ionicons name="save-outline" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 8 }}>Guardar cambios</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Confirmación editar */}
      <ConfirmModal
        visible={!!confirm && confirm.tipo === "editar"}
        title="Cambiar edición"
        message="¿Deseas alternar el modo de edición?"
        cancelText="Cancelar"
        confirmText="Confirmar"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setLocal((prev) => ({ ...prev, editable: !prev.editable }));
          setConfirm(null);
        }}
      />

      {/* Confirmación guardar */}
      <ConfirmModal
        visible={!!confirm && confirm.tipo === "guardar"}
        title="Guardar datos del local"
        message="¿Deseas guardar los cambios?"
        cancelText="Cancelar"
        confirmText="Guardar"
        onCancel={() => setConfirm(null)}
        onConfirm={guardar}
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
  contenedor: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 18 },
  titulo: { fontSize: 22, fontWeight: "bold", color: Colores.primarioOscuro, marginBottom: 10 },

  btnHeaderTxt: { fontWeight: "bold" },

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

  copyIcon: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
  },

  filaImagenes: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10, marginTop: 4 },
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

  btnGuardar: {
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 12,
    flexDirection: "row",
  },
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
