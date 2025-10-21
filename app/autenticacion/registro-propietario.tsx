// app/autenticacion/registro-propietario.tsx
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
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

import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import { api } from "../../components/api";
import ConfirmModal from "../../components/modals/ConfirmModal";
import ResultModal from "../../components/modals/ResultModal";
import { saveAuth } from "../../utils/authStorage";

type TipoMesa = "POOL" | "CARAMBOLA" | "SNOOKER" | "MIXTO";
const TIPOS: TipoMesa[] = ["POOL", "CARAMBOLA", "SNOOKER", "MIXTO"];

const Colores = {
  primario: "#0066FF",
  primarioOscuro: "#0033A0",
  verde: "#2A9D8F",
  fondo: "#F4F7FB",
  textoClaro: "#FFFFFF",
  borde: "#E0E0E0",
  error: "#FF4B4B",
};

const MAX_IMAGE_BYTES = 500 * 1024; // 500 KB

// Reglas
const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/;
const empiezaConMayuscula = /^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚáéíóúÑ\s]*$/;
const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const celularValido = /^[0-9]{6,20}$/;
const urlGpsValida = /^https?:\/\/.+/;
const passRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_.])[A-Za-z\d!@#$%^&*_.]{6,}$/;
const decimalValido = /^\d+(\.\d+)?$/;

function normalizeDecimal(input: string) {
  let v = input.replace(",", ".").replace(/[^0-9.]/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  return v;
}

type Touched<T> = { [K in keyof T]?: boolean };

type MesaForm = {
  numero: string;
  tipo: TipoMesa | "";
  precio: string;
  descripcion: string;
  fotos: string[]; // dataURI
  touched: Touched<{
    numero: string;
    tipo: string;
    precio: string;
    descripcion: string;
  }>;
};

// Selección + compresión <= 500KB (compat con versiones de expo-image-picker)
async function pickCompressedDataURI(
  setResult: (r: { type: "success" | "error"; title: string; msg: string } | null) => void
): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.status !== "granted") {
    setResult({
      type: "error",
      title: "Permiso denegado",
      msg: "Necesitas permitir el acceso a la galería para subir imágenes.",
    });
    return null;
  }

  // Compatibilidad: usa MediaType si existe; si no, usa MediaTypeOptions (deprecated)
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
    if (bytes <= MAX_IMAGE_BYTES) {
      return `data:image/jpeg;base64,${b64}`;
    }
    width = Math.floor(width * 0.85);
    quality = Math.max(0.4, quality - 0.12);
  }

  setResult({
    type: "error",
    title: "Imagen demasiado pesada",
    msg: "No se pudo comprimir por debajo de 500 KB. Elige otra imagen más liviana.",
  });
  return null;
}

export default function RegistroPropietario() {
  const router = useRouter();

  // Propietario
  const [prop, setProp] = useState({
    primerAp: "",
    segundoAp: "",
    nombres: "",
    celular: "",
    correo: "",
    contrasena: "",
    confirmarContrasena: "",
  });
  const [tProp, setTProp] = useState<Touched<typeof prop>>({});

  // Local
  const [local, setLocal] = useState({
    nombre: "",
    direccion: "",
    ciudad: "",
    gpsUrl: "",
  });
  const [tLocal, setTLocal] = useState<Touched<typeof local>>({});
  const [imgsLocal, setImgsLocal] = useState<string[]>([]);

  // Mesas
  const [mesas, setMesas] = useState<MesaForm[]>([
    { numero: "", tipo: "", precio: "", descripcion: "", fotos: [], touched: {} },
  ]);

  // Índice de la mesa cuyo modal de "tipo" está abierto
  const [modalTipoIdx, setModalTipoIdx] = useState<number | null>(null);

  // Modales
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; title: string; msg: string } | null>(null);

  // Helpers estado
  const setPropField = (k: keyof typeof prop, v: string) => setProp({ ...prop, [k]: v });
  const setPropTouched = (k: keyof typeof prop) => setTProp({ ...tProp, [k]: true });
  const setLocalField = (k: keyof typeof local, v: string) => setLocal({ ...local, [k]: v });
  const setLocalTouched = (k: keyof typeof local) => setTLocal({ ...tLocal, [k]: true });
  const updateMesa = (i: number, patch: Partial<MesaForm>) => {
    setMesas((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], ...patch };
      return copy;
    });
  };
  const setMesaTouched = (i: number, k: keyof MesaForm["touched"]) => {
    setMesas((prev) => {
      const copy = [...prev];
      copy[i].touched = { ...(copy[i].touched || {}), [k]: true };
      return copy;
    });
  };

  // Validaciones
  const valProp = {
    primerAp: prop.primerAp.trim() !== "" && soloLetras.test(prop.primerAp) && empiezaConMayuscula.test(prop.primerAp),
    segundoAp:
      prop.segundoAp.trim() === "" ||
      (soloLetras.test(prop.segundoAp) && empiezaConMayuscula.test(prop.segundoAp)),
    nombres: prop.nombres.trim() !== "" && soloLetras.test(prop.nombres) && empiezaConMayuscula.test(prop.nombres),
    correo: correoValido.test(prop.correo.trim()),
    celular: prop.celular.trim() === "" || celularValido.test(prop.celular.trim()),
    contrasena: passRegex.test(prop.contrasena),
    confirmarContrasena: prop.confirmarContrasena === prop.contrasena && prop.contrasena.length > 0,
  };

  const valLocal = {
    nombre: local.nombre.trim().length >= 2,
    direccion: local.direccion.trim().length >= 3,
    ciudad:
      local.ciudad.trim() === "" ||
      (soloLetras.test(local.ciudad) && empiezaConMayuscula.test(local.ciudad)),
    gpsUrl: urlGpsValida.test(local.gpsUrl.trim()),
  };

  const valMesa = (m: MesaForm) => ({
    numero: !!m.numero && /^\d+$/.test(m.numero) && parseInt(m.numero, 10) >= 1,
    tipo: m.tipo !== "",
    precio: !!m.precio && decimalValido.test(m.precio) && parseFloat(m.precio) >= 0,
  });

  const formValido =
    Object.values(valProp).every(Boolean) &&
    Object.values(valLocal).every(Boolean) &&
    mesas.length > 0 &&
    mesas.every((m) => {
      const v = valMesa(m);
      return v.numero && v.tipo && v.precio;
    });

  const hayDatos =
    Object.values(prop).some((v) => v.trim() !== "") ||
    Object.values(local).some((v) => v.trim() !== "") ||
    imgsLocal.length > 0 ||
    mesas.some(
      (m) => m.numero || m.tipo || m.precio || m.descripcion || m.fotos.length
    );

  // Imágenes
  const pickLocalImage = async () => {
    const dataUri = await pickCompressedDataURI(setResult);
    if (dataUri) setImgsLocal((arr) => [...arr, dataUri]);
  };
  const removeLocalImage = (idx: number) => {
    setImgsLocal((arr) => arr.filter((_, i) => i !== idx));
  };

  const pickMesaImage = async (idx: number) => {
    const dataUri = await pickCompressedDataURI(setResult);
    if (!dataUri) return;
    setMesas((prev) => {
      const copy = [...prev];
      copy[idx].fotos.push(dataUri);
      return copy;
    });
  };
  const removeMesaImage = (idxMesa: number, idxFoto: number) => {
    setMesas((prev) => {
      const copy = [...prev];
      copy[idxMesa].fotos = copy[idxMesa].fotos.filter((_, i) => i !== idxFoto);
      return copy;
    });
  };

  // Abrir / seleccionar tipo (usa setState funcional para evitar valores obsoletos)
  const openTipo = (idx: number) => setModalTipoIdx(idx);
  const selectTipo = (tipo: TipoMesa) => {
    setMesas((prev) => {
      if (modalTipoIdx === null) return prev;
      const copy = [...prev];
      if (!copy[modalTipoIdx]) return prev;
      copy[modalTipoIdx] = { ...copy[modalTipoIdx], tipo };
      return copy;
    });
    if (modalTipoIdx !== null) setMesaTouched(modalTipoIdx, "tipo");
    setModalTipoIdx(null);
  };

  // Envío
  const submit = async () => {
    const marcarTodo = () => {
      setTProp({
        primerAp: true,
        segundoAp: true,
        nombres: true,
        correo: true,
        celular: true,
        contrasena: true,
        confirmarContrasena: true,
      });
      setTLocal({ nombre: true, direccion: true, ciudad: true, gpsUrl: true });
      setMesas((arr) =>
        arr.map((m) => ({
          ...m,
          touched: { numero: true, tipo: true, precio: true, descripcion: true },
        }))
      );
    };

    if (!formValido) {
      marcarTodo();
      setResult({
        type: "error",
        title: "Faltan datos",
        msg: "Revisa los campos marcados en rojo.",
      });
      return;
    }

    const payload = {
      nombre: prop.nombres.trim(),
      primer_apellido: prop.primerAp.trim(),
      segundo_apellido: prop.segundoAp.trim() || null,
      correo: prop.correo.trim(),
      password: prop.contrasena,
      confirmar_password: prop.confirmarContrasena,
      celular: prop.celular.trim() || null,
      local: {
        nombre: local.nombre.trim(),
        direccion: local.direccion.trim(),
        ciudad: local.ciudad.trim() || null,
        gps_url: local.gpsUrl.trim(),
        imagenes: imgsLocal.map((b64) => ({ base64: b64 })),
      },
      mesas: mesas.map((m) => ({
        numero_mesa: parseInt(m.numero, 10),
        tipo_mesa: m.tipo as TipoMesa,
        precio_hora: parseFloat(m.precio),
        descripcion: m.descripcion.trim() || null,
        imagenes: m.fotos.map((b64) => ({ base64: b64 })),
      })),
    };

    try {
      setProcessing(true);
      const res = await api("/registro/propietario", { method: "POST", body: payload });
      await saveAuth(res.token, res.user);
      setResult({
        type: "success",
        title: "Registro completo",
        msg: "Tu cuenta de propietario se creó correctamente.",
      });
    } catch (e: any) {
      setResult({
        type: "error",
        title: "No se pudo registrar",
        msg: String(e?.message || "Inténtalo nuevamente."),
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitPress = () => {
    if (!formValido) {
      setResult({
        type: "error",
        title: "Datos incompletos",
        msg: "Completa todos los campos obligatorios.",
      });
      return;
    }
    setShowSubmitConfirm(true);
  };

  const cerrarResult = () => {
    if (result?.type === "success") {
      setResult(null);
      router.replace("/(principal)");
      return;
    }
    setResult(null);
  };

  const cancelar = () => {
    if (!hayDatos) router.back();
    else setShowCancelConfirm(true);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colores.fondo }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <ScrollView contentContainerStyle={estilos.scroll} keyboardShouldPersistTaps="handled">
        <View style={estilos.contenedor}>
          <Text style={estilos.titulo}>Registro de Propietario</Text>

          {/* PROPIETARIO */}
          <Text style={estilos.subtitulo}>Datos del propietario</Text>

          <Text style={estilos.label}>Primer apellido *</Text>
          <TextInput
            style={[estilos.campo, tProp.primerAp && !valProp.primerAp && estilos.inputError]}
            placeholder="Escribe tu primer apellido"
            autoCapitalize="words"
            value={prop.primerAp}
            onChangeText={(v) => setPropField("primerAp", v)}
            onBlur={() => setPropTouched("primerAp")}
          />
          {tProp.primerAp && !valProp.primerAp && (
            <Text style={estilos.textoError}>Solo letras. Debe iniciar con mayúscula.</Text>
          )}

          <Text style={estilos.label}>Segundo apellido (opcional)</Text>
          <TextInput
            style={[estilos.campo, tProp.segundoAp && !valProp.segundoAp && estilos.inputError]}
            placeholder="Escribe tu segundo apellido"
            autoCapitalize="words"
            value={prop.segundoAp}
            onChangeText={(v) => setPropField("segundoAp", v)}
            onBlur={() => setPropTouched("segundoAp")}
          />
          {tProp.segundoAp && !valProp.segundoAp && (
            <Text style={estilos.textoError}>Solo letras. Debe iniciar con mayúscula.</Text>
          )}

          <Text style={estilos.label}>Nombres *</Text>
          <TextInput
            style={[estilos.campo, tProp.nombres && !valProp.nombres && estilos.inputError]}
            placeholder="Escribe tus nombres"
            autoCapitalize="words"
            value={prop.nombres}
            onChangeText={(v) => setPropField("nombres", v)}
            onBlur={() => setPropTouched("nombres")}
          />
          {tProp.nombres && !valProp.nombres && (
            <Text style={estilos.textoError}>Solo letras. Debe iniciar con mayúscula.</Text>
          )}

          <Text style={estilos.label}>Celular (opcional)</Text>
          <TextInput
            style={[estilos.campo, tProp.celular && !valProp.celular && estilos.inputError]}
            placeholder="Escribe tu número de celular"
            keyboardType="number-pad"
            value={prop.celular}
            onChangeText={(v) => setPropField("celular", v.replace(/[^0-9]/g, ""))}
            onBlur={() => setPropTouched("celular")}
          />
          {tProp.celular && !valProp.celular && (
            <Text style={estilos.textoError}>Debe tener entre 6 y 20 dígitos.</Text>
          )}

          <Text style={estilos.label}>Correo electrónico *</Text>
          <TextInput
            style={[estilos.campo, tProp.correo && !valProp.correo && estilos.inputError]}
            placeholder="Escribe tu correo electrónico"
            keyboardType="email-address"
            autoCapitalize="none"
            value={prop.correo}
            onChangeText={(v) => setPropField("correo", v)}
            onBlur={() => setPropTouched("correo")}
          />
          {tProp.correo && !valProp.correo && <Text style={estilos.textoError}>Correo no válido.</Text>}

          <Text style={estilos.label}>Contraseña *</Text>
          <TextInput
            style={[estilos.campo, tProp.contrasena && !valProp.contrasena && estilos.inputError]}
            placeholder="Mín. 6 caracteres, 1 mayúscula, 1 número y 1 símbolo"
            secureTextEntry
            value={prop.contrasena}
            onChangeText={(v) => setPropField("contrasena", v)}
            onBlur={() => setPropTouched("contrasena")}
          />
          {tProp.contrasena && !valProp.contrasena && (
            <Text style={estilos.textoError}>No cumple los requisitos de seguridad.</Text>
          )}

          <Text style={estilos.label}>Confirmar contraseña *</Text>
          <TextInput
            style={[
              estilos.campo,
              tProp.confirmarContrasena && !valProp.confirmarContrasena && estilos.inputError,
            ]}
            placeholder="Repite tu contraseña"
            secureTextEntry
            value={prop.confirmarContrasena}
            onChangeText={(v) => setPropField("confirmarContrasena", v)}
            onBlur={() => setPropTouched("confirmarContrasena")}
          />
          {tProp.confirmarContrasena && !valProp.confirmarContrasena && (
            <Text style={estilos.textoError}>Las contraseñas no coinciden.</Text>
          )}

          {/* LOCAL */}
          <Text style={estilos.subtitulo}>Datos del local</Text>

          <Text style={estilos.label}>Nombre del local *</Text>
          <TextInput
            style={[estilos.campo, tLocal.nombre && !valLocal.nombre && estilos.inputError]}
            placeholder="Escribe el nombre del local"
            autoCapitalize="words"
            value={local.nombre}
            onChangeText={(v) => setLocalField("nombre", v)}
            onBlur={() => setLocalTouched("nombre")}
          />
          {tLocal.nombre && !valLocal.nombre && <Text style={estilos.textoError}>Mínimo 2 caracteres.</Text>}

          <Text style={estilos.label}>Dirección *</Text>
          <TextInput
            style={[estilos.campo, tLocal.direccion && !valLocal.direccion && estilos.inputError]}
            placeholder="Escribe la dirección"
            value={local.direccion}
            onChangeText={(v) => setLocalField("direccion", v)}
            onBlur={() => setLocalTouched("direccion")}
          />
          {tLocal.direccion && !valLocal.direccion && <Text style={estilos.textoError}>Mínimo 3 caracteres.</Text>}

          <Text style={estilos.label}>Ciudad (opcional)</Text>
          <TextInput
            style={[estilos.campo, tLocal.ciudad && !valLocal.ciudad && estilos.inputError]}
            placeholder="Escribe la ciudad"
            autoCapitalize="words"
            value={local.ciudad}
            onChangeText={(v) => setLocalField("ciudad", v)}
            onBlur={() => setLocalTouched("ciudad")}
          />
          {tLocal.ciudad && !valLocal.ciudad && (
            <Text style={estilos.textoError}>Solo letras. Debe iniciar con mayúscula.</Text>
          )}

          <Text style={estilos.label}>URL de Google Maps *</Text>
          <TextInput
            style={[estilos.campo, tLocal.gpsUrl && !valLocal.gpsUrl && estilos.inputError]}
            placeholder="Pega aquí el enlace de Google Maps del local"
            autoCapitalize="none"
            value={local.gpsUrl}
            onChangeText={(v) => setLocalField("gpsUrl", v)}
            onBlur={() => setLocalTouched("gpsUrl")}
          />
          {tLocal.gpsUrl && !valLocal.gpsUrl && (
            <Text style={estilos.textoError}>Debe ser una URL válida (http/https).</Text>
          )}

          <Text style={estilos.textoAzul}>Imágenes del local (opcional)</Text>
          <View style={estilos.filaImagenes}>
            {imgsLocal.map((img, i) => (
              <View key={`loc-${i}`} style={estilos.imgWrap}>
                <Image source={{ uri: img }} style={estilos.imgPreview} />
                <TouchableOpacity style={estilos.closeBadge} onPress={() => removeLocalImage(i)}>
                  <Text style={estilos.closeText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={estilos.botonImagen} onPress={pickLocalImage}>
              <Text style={estilos.textoMas}>＋</Text>
            </TouchableOpacity>
          </View>

          {/* MESAS */}
          <Text style={estilos.subtitulo}>Mesas (mínimo 1)</Text>
          <TouchableOpacity
            style={estilos.botonCrearMesa}
            onPress={() =>
              setMesas((arr) => [
                ...arr,
                { numero: "", tipo: "", precio: "", descripcion: "", fotos: [], touched: {} },
              ])
            }
          >
            <Text style={estilos.textoAzul}>＋ Agregar mesa</Text>
          </TouchableOpacity>

          {mesas.map((m, idx) => {
            const v = valMesa(m);
            return (
              <View key={idx} style={estilos.cardMesa}>
                <View style={estilos.headerMesa}>
                  <Text style={estilos.textoNegrita}>Mesa {idx + 1}</Text>
                  {mesas.length > 1 && (
                    <TouchableOpacity onPress={() => setMesas(mesas.filter((_, i) => i !== idx))}>
                      <Text style={estilos.textoRojo}>🗑️ Quitar</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={estilos.label}>Número de mesa *</Text>
                <TextInput
                  style={[estilos.campo, m.touched.numero && !v.numero && estilos.inputError]}
                  placeholder="Escribe el número de mesa"
                  keyboardType="number-pad"
                  value={m.numero}
                  onChangeText={(t) => updateMesa(idx, { numero: t.replace(/[^0-9]/g, "") })}
                  onBlur={() => setMesaTouched(idx, "numero")}
                />
                {m.touched.numero && !v.numero && (
                  <Text style={estilos.textoError}>Nro. de mesa debe ser entero ≥ 1.</Text>
                )}

                <Text style={estilos.label}>Tipo de mesa *</Text>
                <TouchableOpacity
                  style={[estilos.campo, estilos.select, m.touched.tipo && !v.tipo && estilos.inputError]}
                  onPress={() => openTipo(idx)}
                  activeOpacity={0.9}
                >
                  <Text style={{ color: m.tipo ? "#111" : "#888" }}>
                    {m.tipo || "Selecciona un tipo de mesa"}
                  </Text>
                </TouchableOpacity>
                {m.touched.tipo && !v.tipo && (
                  <Text style={estilos.textoError}>Selecciona un tipo de mesa.</Text>
                )}

                <Text style={estilos.label}>Precio por hora (Bs) *</Text>
                <TextInput
                  style={[estilos.campo, m.touched.precio && !v.precio && estilos.inputError]}
                  placeholder="Escribe el precio por hora"
                  keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
                  value={m.precio}
                  onChangeText={(t) => updateMesa(idx, { precio: normalizeDecimal(t) })}
                  onBlur={() => setMesaTouched(idx, "precio")}
                />
                {m.touched.precio && !v.precio && (
                  <Text style={estilos.textoError}>Precio por hora debe ser un número ≥ 0.</Text>
                )}

                <Text style={estilos.label}>Descripción (opcional)</Text>
                <TextInput
                  style={estilos.campo}
                  placeholder="Escribe una breve descripción"
                  value={m.descripcion}
                  onChangeText={(t) => updateMesa(idx, { descripcion: t })}
                  onBlur={() => setMesaTouched(idx, "descripcion")}
                />

                <Text style={estilos.textoAzul}>Fotos de la mesa (opcional)</Text>
                <View style={estilos.filaImagenes}>
                  {m.fotos.map((f, i) => (
                    <View key={`mesa-${idx}-${i}`} style={estilos.imgWrap}>
                      <Image source={{ uri: f }} style={estilos.imgPreview} />
                      <TouchableOpacity style={estilos.closeBadge} onPress={() => removeMesaImage(idx, i)}>
                        <Text style={estilos.closeText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={estilos.botonImagen} onPress={() => pickMesaImage(idx)}>
                    <Text style={estilos.textoMas}>＋</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* BOTONES */}
          <TouchableOpacity
            style={[estilos.botonRegistrar, { backgroundColor: formValido ? Colores.primario : "#A0C4FF" }]}
            disabled={!formValido}
            onPress={handleSubmitPress}
          >
            <Text style={estilos.textoLleno}>REGISTRARSE</Text>
          </TouchableOpacity>

          <TouchableOpacity style={estilos.botonCancelar} onPress={cancelar}>
            <Text style={estilos.textoCancelar}>CANCELAR</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL – seleccionar tipo de mesa */}
      <Modal visible={modalTipoIdx !== null} transparent animationType="fade">
        <View style={estilos.overlay}>
          {/* Fondo clickable para cerrar */}
          <Pressable style={estilos.backdrop} onPress={() => setModalTipoIdx(null)} />
          {/* Tarjeta del modal */}
          <View style={estilos.modalCard}>
            <Text style={estilos.modalTitle}>Selecciona un tipo de mesa</Text>
            {TIPOS.map((t) => (
              <TouchableOpacity key={t} style={estilos.modalItem} onPress={() => selectTipo(t)}>
                <Text style={{ fontWeight: "600" }}>
                  {t}
                </Text>
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

      {/* Confirmar cancelar */}
      <ConfirmModal
        visible={showCancelConfirm}
        title="Cancelar registro"
        message="¿Seguro que deseas cancelar? Perderás los datos ingresados."
        cancelText="Seguir editando"
        confirmText="Sí, salir"
        onCancel={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          setShowCancelConfirm(false);
          router.back();
        }}
      />

      {/* Confirmar enviar */}
      <ConfirmModal
        visible={showSubmitConfirm}
        title="Confirmar datos"
        message="¿Estás seguro de registrar esta información?"
        cancelText="Revisar"
        confirmText="Sí, registrar"
        onCancel={() => setShowSubmitConfirm(false)}
        onConfirm={() => {
          setShowSubmitConfirm(false);
          submit();
        }}
      />

      {/* Registrando… */}
      <View
        pointerEvents={processing ? "auto" : "none"}
        style={[estilos.loadingWrap, { display: processing ? "flex" : "none" }]}
      >
        <View style={estilos.loadingCard}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 10, fontWeight: "700" }}>Registrando…</Text>
        </View>
      </View>

      {/* Resultado */}
      <ResultModal
        visible={!!result}
        type={result?.type === "success" ? "success" : "error"}
        title={result?.title || ""}
        message={result?.msg || ""}
        onClose={cerrarResult}
      />
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  scroll: { paddingBottom: 32 },
  contenedor: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  titulo: { fontSize: 22, fontWeight: "bold", textAlign: "center", color: Colores.primarioOscuro, marginBottom: 14 },
  subtitulo: { fontSize: 16, fontWeight: "bold", color: Colores.verde, marginTop: 18, marginBottom: 8 },
  label: { fontSize: 13, color: "#111", marginBottom: 6, fontWeight: "600" },

  campo: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colores.borde,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  inputError: { borderColor: Colores.error },
  textoError: { color: Colores.error, fontSize: 12, marginBottom: 8 },
  textoAzul: { color: Colores.primario, fontWeight: "600", marginBottom: 6 },

  filaImagenes: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 },
  botonImagen: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: Colores.primario,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
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
    elevation: 2,
  },
  closeText: { color: "#fff", fontWeight: "900", lineHeight: 20, fontSize: 16 },
  textoMas: { fontSize: 28, color: Colores.primario },

  botonCrearMesa: { backgroundColor: "#E8F0FF", borderRadius: 10, padding: 10, alignItems: "center", marginBottom: 10 },
  cardMesa: { backgroundColor: "#fff", borderWidth: 1, borderColor: Colores.borde, borderRadius: 10, padding: 12, marginBottom: 16 },

  headerMesa: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  textoNegrita: { fontWeight: "bold" },
  textoRojo: { color: Colores.error, fontWeight: "bold" },

  // Select (campo)
  select: { justifyContent: "center" },

  // Modal select tipo
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalCard: { width: "85%", backgroundColor: "#fff", borderRadius: 14, padding: 16, elevation: 6 },
  modalTitle: { fontWeight: "800", fontSize: 16, marginBottom: 8, color: Colores.primarioOscuro },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },

  botonRegistrar: { width: "100%", padding: 14, borderRadius: 12, marginTop: 10 },
  botonCancelar: { width: "100%", padding: 14, borderRadius: 12, marginTop: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: Colores.borde },
  textoLleno: { color: Colores.textoClaro, fontWeight: "bold", textAlign: "center" },
  textoCancelar: { color: "#222", fontWeight: "bold", textAlign: "center" },

  loadingWrap: {
    position: "absolute",
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  loadingCard: { width: "70%", backgroundColor: "#fff", borderRadius: 14, padding: 18, alignItems: "center" },
});
