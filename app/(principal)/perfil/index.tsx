import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { clearAuth, getToken, roleLabel } from "../../../utils/authStorage";

const C = {
  primario: "#0066FF",
  primarioOscuro: "#0033A0",
  fondo: "#F4F7FB",
  texto: "#333",
  borde: "#E0E0E0",
  error: "#FF4B4B",
  gris: "#888",
};

type Perfil = {
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string | null;
  correo: string;
  celular: string | null;
  rol: "CLIENTE" | "PROPIETARIO" | "ADMINISTRADOR";
  fecha_creacion: string;
  foto_url: string | null;
};

const MAX_B = 500 * 1024;

export default function PerfilCliente() {
  const [usuario, setUsuario] = useState<Perfil | null>(null);
  const [original, setOriginal] = useState<Perfil | null>(null);

  const [editable, setEditable] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);

  // Foto
  const [fotoNuevaDataUri, setFotoNuevaDataUri] = useState<string | null>(null); // DATA URI
  const [eliminarFoto, setEliminarFoto] = useState(false); // solo marca; se aplica al guardar
  const [confirm, setConfirm] = useState<null | "guardar" | "cerrar" | "eliminarFoto">(null);

  const [result, setResult] = useState<{ type: "success" | "error"; title: string; msg: string } | null>(null);

  // ---- Cargar perfil (mismo patrón que mi-qr.tsx) ----
  const fetchPerfil = async () => {
    try {
      setCargando(true);
      const token = await getToken();
      const res = await api("/perfil", { method: "GET", token: token || undefined });
      setUsuario(res.data as Perfil);
      setOriginal(res.data as Perfil);
      setEliminarFoto(false);
      setFotoNuevaDataUri(null);
      setErrores({});
    } catch (e: any) {
      setResult({ type: "error", title: "No se pudo cargar", msg: String(e?.message || "Intenta nuevamente.") });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchPerfil();
  }, []);

  // ---- Validaciones ----
  const validar = (campo: keyof Perfil | "segundo_apellido" | "celular", valor: string) => {
    let msg = "";
    if (["nombre", "primer_apellido", "segundo_apellido"].includes(campo)) {
      if (!valor.trim()) msg = "Campo requerido.";
      else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(valor)) msg = "Solo letras.";
      else if (!/^[A-ZÁÉÍÓÚÑ]/.test(valor.trim())) msg = "Inicia con mayúscula.";
    }
    if (campo === "celular") {
      if (!valor.trim()) msg = "Campo requerido.";
      else if (!/^[0-9]{6,20}$/.test(valor)) msg = "6 a 20 dígitos.";
    }
    setErrores((p) => ({ ...p, [campo]: msg }));
    return !msg;
  };

  const handleChange = (campo: keyof Perfil, valor: string) => {
    setUsuario((prev) => (prev ? { ...prev, [campo]: valor } : prev));
    validar(campo, valor);
  };

  // ---- Imagen (siempre DATA URI) ----
  const seleccionarImagen = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      setResult({ type: "error", title: "Permiso denegado", msg: "Autoriza la galería para cambiar la foto." });
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
    });

    if (res.canceled || !res.assets?.length) return;

    const a = res.assets[0];
    const base64 = a.base64 || "";
    const bytes = a.fileSize ? a.fileSize : Math.ceil((base64.length * 3) / 4);
    if (bytes > MAX_B) {
      setResult({ type: "error", title: "Archivo grande", msg: "Máximo 500 KB." });
      return;
    }
    const dataUri = `data:image/jpeg;base64,${base64}`;
    setFotoNuevaDataUri(dataUri);
    setEliminarFoto(false); // si selecciona nueva, cancela eliminación
  };

  // ---- Preview de foto ----
  const previewFoto = useMemo<string | null>(() => {
    if (eliminarFoto) return null;
    if (fotoNuevaDataUri) return fotoNuevaDataUri;
    return usuario?.foto_url || null;
  }, [eliminarFoto, fotoNuevaDataUri, usuario?.foto_url]);

  // ---- Cambios ----
  const hayCambiosTexto =
    !!usuario &&
    !!original &&
    (usuario.nombre !== original.nombre ||
      usuario.primer_apellido !== original.primer_apellido ||
      (usuario.segundo_apellido || "") !== (original.segundo_apellido || "") ||
      (usuario.celular || "") !== (original.celular || ""));

  const hayCambiosFoto =
    eliminarFoto || (!!fotoNuevaDataUri && fotoNuevaDataUri !== "" && fotoNuevaDataUri !== original?.foto_url);

  const hayErrores = Object.values(errores).some((m) => !!m);
  const puedeGuardar = (hayCambiosTexto || hayCambiosFoto) && !hayErrores;

  // ---- Guardar ----
  const guardarCambios = async () => {
    try {
      setConfirm(null);
      const token = await getToken();

      // 1) texto
      if (hayCambiosTexto && usuario) {
        const body: any = {
          nombre: usuario.nombre,
          primer_apellido: usuario.primer_apellido,
          segundo_apellido: usuario.segundo_apellido ?? "",
          celular: usuario.celular ?? "",
        };
        const campos: (keyof Perfil)[] = ["nombre", "primer_apellido", "segundo_apellido", "celular"];
        for (const c of campos) {
          if (!validar(c, String((body as any)[c] ?? ""))) {
            setResult({ type: "error", title: "Datos inválidos", msg: "Revisa los campos con error." });
            return;
          }
        }
        await api("/perfil", { method: "PUT", token: token || undefined, body });
      }

      // 2) foto (solo se aplica aquí; la X solo marca)
      if (eliminarFoto && original?.foto_url) {
        await api("/perfil/foto", { method: "DELETE", token: token || undefined });
      } else if (fotoNuevaDataUri) {
        await api("/perfil/foto", {
          method: "PUT",
          token: token || undefined,
          body: { imagen: { base64: fotoNuevaDataUri } },
        });
      }

      setResult({ type: "success", title: "Guardado", msg: "Perfil actualizado." });
      await fetchPerfil();
      setEditable(false);
    } catch (e: any) {
      setResult({ type: "error", title: "Error al guardar", msg: String(e?.message || "Intenta nuevamente.") });
    }
  };

  const cerrarSesion = async () => {
    await clearAuth();
    setResult({ type: "success", title: "Sesión cerrada", msg: "Vuelve a iniciar sesión." });
  };

  // ---- Render ----
  if (cargando)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primario} />
        <Text style={{ color: C.primarioOscuro, marginTop: 8 }}>Cargando perfil…</Text>
      </View>
    );

  return (
    <ScrollView style={styles.container}>
      {/* Foto */}
      <View style={styles.fotoWrapper}>
        <View style={styles.fotoContainer}>
          {previewFoto ? (
            <Image source={{ uri: previewFoto }} style={styles.fotoPerfil} />
          ) : (
            <View style={[styles.fotoPerfil, styles.placeholder]}>
              <Ionicons name="person-circle-outline" size={54} color={C.gris} />
              <Text style={{ color: C.gris, fontSize: 12 }}>Sin foto</Text>
            </View>
          )}

          {/* Cámara: solo en edición y si no está marcada la eliminación */}
          {editable && !eliminarFoto && (
            <TouchableOpacity style={styles.botonCam} onPress={seleccionarImagen}>
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          )}

          {/* X roja: solo marca/cancela eliminar; se aplica al guardar */}
          {editable && (previewFoto || usuario?.foto_url) && (
            <TouchableOpacity style={styles.botonX} onPress={() => setConfirm("eliminarFoto")}>
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Encabezado: Editar arriba, Rol abajo */}
      <View style={styles.rolHeader}>
        <TouchableOpacity style={styles.btnEditar} onPress={() => setEditable((p) => !p)}>
          <Ionicons name="create-outline" size={16} color={C.primarioOscuro} />
          <Text style={styles.txtEditar}>Editar</Text>
        </TouchableOpacity>

        <View style={styles.rolContainer}>
          <Text style={styles.rolTexto}>{roleLabel(usuario?.rol).toUpperCase()}</Text>
        </View>
      </View>

      {/* Datos: label arriba, valor/entrada debajo */}
      <View style={styles.card}>
        <CampoStack
          label="Nombre"
          value={usuario?.nombre || ""}
          editable={editable}
          error={errores.nombre}
          onChangeText={(v) => handleChange("nombre", v)}
        />
        <CampoStack
          label="Primer apellido"
          value={usuario?.primer_apellido || ""}
          editable={editable}
          error={errores.primer_apellido}
          onChangeText={(v) => handleChange("primer_apellido", v)}
        />
        <CampoStack
          label="Segundo apellido"
          value={usuario?.segundo_apellido || ""}
          editable={editable}
          error={errores.segundo_apellido}
          onChangeText={(v) => handleChange("segundo_apellido", v)}
        />
        <CampoStack label="Correo" value={usuario?.correo || ""} editable={false} />
        <CampoStack
          label="Celular"
          value={usuario?.celular || ""}
          editable={editable}
          error={errores.celular}
          onChangeText={(v) => handleChange("celular", v)}
          keyboardType="number-pad"
        />

        <Text style={styles.fecha}>Miembro desde: {usuario?.fecha_creacion || "-"}</Text>
      </View>

      {/* Guardar solo si hay cambios y sin errores */}
      {puedeGuardar && (
        <TouchableOpacity style={styles.btnGuardar} onPress={() => setConfirm("guardar")}>
          <Ionicons name="save-outline" size={20} color="#fff" />
          <Text style={styles.txtGuardar}>Guardar cambios</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.btnSalir} onPress={() => setConfirm("cerrar")}>
        <Ionicons name="log-out-outline" size={20} color={C.error} />
        <Text style={styles.txtSalir}>Cerrar sesión</Text>
      </TouchableOpacity>

      {/* Confirmaciones */}
      <ConfirmModal
        visible={confirm === "guardar"}
        title="Guardar cambios"
        message="Se actualizará tu perfil."
        onCancel={() => setConfirm(null)}
        onConfirm={guardarCambios}
        confirmText="Guardar"
      />
      <ConfirmModal
        visible={confirm === "cerrar"}
        title="Cerrar sesión"
        message="¿Seguro que quieres salir?"
        onCancel={() => setConfirm(null)}
        onConfirm={cerrarSesion}
        confirmText="Salir"
      />
      <ConfirmModal
        visible={confirm === "eliminarFoto"}
        title={eliminarFoto ? "Cancelar eliminación" : "Eliminar foto"}
        message={
          eliminarFoto
            ? "Se mantendrá la foto. No se eliminará al guardar."
            : "Se marcará para eliminar. Se borrará al guardar."
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          setEliminarFoto((p) => !p); // solo marca/cancela
          if (!eliminarFoto) setFotoNuevaDataUri(null); // si marco eliminar, descarto nueva
        }}
        confirmText={eliminarFoto ? "Mantener" : "Marcar eliminar"}
      />

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

/* ===== Campo apilado: label arriba, valor/entrada debajo ===== */
function CampoStack({
  label,
  value,
  editable,
  onChangeText,
  error,
  keyboardType,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChangeText?: (v: string) => void;
  error?: string;
  keyboardType?: "default" | "number-pad" | "email-address";
}) {
  return (
    <View style={styles.campo}>
      <Text style={styles.label}>{label}</Text>
      {editable ? (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || "default"}
        />
      ) : (
        <Text style={styles.valor}>{value || "-"}</Text>
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

/* ===== Estilos ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.fondo, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.fondo },

  fotoWrapper: { alignItems: "center", marginBottom: 10 },
  fotoContainer: { width: 132, height: 132, position: "relative" },
  fotoPerfil: { width: 132, height: 132, borderRadius: 66, borderWidth: 2, borderColor: C.primario },
  placeholder: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.borde,
    alignItems: "center",
    justifyContent: "center",
  },
  botonCam: {
    position: "absolute",
    right: 6,
    bottom: 6,
    backgroundColor: C.primario,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  botonX: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: C.error,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  rolHeader: { alignItems: "center", marginBottom: 10 },
  btnEditar: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  txtEditar: { color: C.primarioOscuro, fontWeight: "600" },
  rolContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8F0FF",
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  rolTexto: { fontWeight: "bold", color: C.primarioOscuro, letterSpacing: 1 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: C.borde,
    marginBottom: 20,
  },

  // Campo apilado
  campo: { marginBottom: 12 },
  label: { fontWeight: "600", color: C.primarioOscuro, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: C.borde,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  valor: { color: C.texto, paddingVertical: 6 },
  error: { color: C.error, fontSize: 12, marginTop: 2 },

  fecha: { textAlign: "right", color: "#666", marginTop: 10 },

  btnGuardar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.primario,
    paddingVertical: 10,
    borderRadius: 10,
  },
  txtGuardar: { color: "#fff", fontWeight: "700", marginLeft: 6 },

  btnSalir: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
  txtSalir: { color: C.error, fontWeight: "700", marginLeft: 6 },
});