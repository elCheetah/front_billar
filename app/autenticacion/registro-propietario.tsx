// app/autenticacion/registro-propietario.tsx
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../components/api";
import ConfirmModal from "../../components/modals/ConfirmModal";
import ResultModal from "../../components/modals/ResultModal";
import { saveAuth } from "../../utils/authStorage";

const Colores = {
  primario: "#0066FF",
  primarioOscuro: "#0033A0",
  verde: "#2A9D8F",
  fondo: "#F4F7FB",
  textoClaro: "#FFFFFF",
  borde: "#E0E0E0",
  error: "#FF4B4B",
};

const TIPOS_MESA = ["POOL", "CARAMBOLA", "SNOOKER", "MIXTO"] as const;
type TipoMesa = (typeof TIPOS_MESA)[number];

type MesaForm = {
  nroMesa: string;
  descripcion: string;
  tipo_mesa?: TipoMesa;
  precio_hora: string;
  fotos: string[];
  error?: string;
};

export default function RegistroPropietario() {
  const router = useRouter();

  // ----- Estado: propietario + local -----
  const [form, setForm] = useState({
    primer_apellido: "",
    segundo_apellido: "",
    nombre: "",
    celular: "",
    correo: "",
    password: "",
    confirmar_password: "",
    local_nombre: "",
    local_direccion: "",
    local_ciudad: "",
    gps_url: "",
  });

  // ----- Errores de campos -----
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [imagenesLocal, setImagenesLocal] = useState<string[]>([]);

  // ----- Mesas -----
  const [mesas, setMesas] = useState<MesaForm[]>([
    { nroMesa: "", descripcion: "", tipo_mesa: undefined, precio_hora: "", fotos: [] },
  ]);

  // ----- Modales -----
  const [confirmCancelVisible, setConfirmCancelVisible] = useState(false);
  const [result, setResult] = useState<{ visible: boolean; type: "success" | "error"; title: string; message: string }>({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });
  const [enviando, setEnviando] = useState(false);

  // ----- Validaciones -----
  const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/;
  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const celularValido = /^[0-9]{6,20}$/; // opcional; si hay valor debe cumplir
  const contrasenaValida = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_.])[A-Za-z\d!@#$%^&*_.]{6,}$/;

  // URL con coordenadas (acepta gmaps u otros con lat,lon dentro)
  const gpsUrlValida = (url: string) => {
    try {
      const u = new URL(url);
      const withComma = url.replaceAll("%2C", ",");
      const hasCoords = /-?\d{1,2}\.\d{3,},\s*-?\d{1,3}\.\d{3,}/.test(withComma);
      return ["http:", "https:"].includes(u.protocol) && hasCoords;
    } catch {
      return false;
    }
  };

  const actualizarCampo = (campo: keyof typeof form, valor: string) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    validarCampo(campo, valor);
  };

  const validarCampo = (campo: keyof typeof form, valor: string) => {
    let error = "";

    if (campo === "nombre" || campo === "primer_apellido") {
      if (!valor.trim()) error = "Este campo es obligatorio.";
      else if (!soloLetras.test(valor.trim())) error = "Solo letras permitidas.";
    }

    if (campo === "segundo_apellido") {
      if (valor.trim() && !soloLetras.test(valor.trim())) error = "Solo letras permitidas.";
    }

    if (campo === "correo") {
      if (!correoValido.test(valor.trim())) error = "Correo no válido (ej: usuario@correo.com).";
    }

    if (campo === "password") {
      if (!contrasenaValida.test(valor)) {
        error = "Mín. 6 caracteres, 1 mayúscula, 1 número y 1 símbolo.";
      }
    }

    if (campo === "confirmar_password") {
      if (valor !== form.password) error = "Las contraseñas no coinciden.";
    }

    if (campo === "celular") {
      if (valor.trim() && !celularValido.test(valor.trim())) {
        error = "Celular entre 6 y 20 dígitos.";
      }
    }

    if (campo === "local_nombre") {
      if (!valor.trim()) error = "El nombre del local es obligatorio.";
    }

    if (campo === "local_direccion") {
      if (!valor.trim() || valor.trim().length < 3) error = "Dirección obligatoria (mín. 3).";
    }

    if (campo === "gps_url") {
      if (!gpsUrlValida(valor.trim())) error = "URL con coordenadas inválidas.";
    }

    setErrores((prev) => ({ ...prev, [campo]: error }));
  };

  const validarMesa = (m: MesaForm) => {
    let e = "";
    if (!m.nroMesa.trim() || !/^\d+$/.test(m.nroMesa) || Number(m.nroMesa) < 1) {
      e = "Nro. de mesa debe ser entero ≥ 1.";
    } else if (!m.tipo_mesa) {
      e = "Selecciona un tipo de mesa.";
    } else if (m.precio_hora.trim() === "" || isNaN(Number(m.precio_hora)) || Number(m.precio_hora) < 0) {
      e = "Precio por hora debe ser un número ≥ 0.";
    }
    return e;
  };

  // Duplicados nroMesa (frontend)
  const hayDuplicadosMesa = useMemo(() => {
    const nums = mesas.map((m) => m.nroMesa.trim()).filter(Boolean);
    return nums.some((n, idx) => nums.indexOf(n) !== idx);
  }, [mesas]);

  const formularioValido = useMemo(() => {
    const camposNecesariosOK =
      form.nombre.trim() &&
      form.primer_apellido.trim() &&
      correoValido.test(form.correo.trim()) &&
      contrasenaValida.test(form.password) &&
      form.confirmar_password === form.password &&
      form.local_nombre.trim().length >= 1 &&
      form.local_direccion.trim().length >= 3 &&
      gpsUrlValida(form.gps_url.trim());

    const celularOK = !form.celular.trim() || celularValido.test(form.celular.trim());
    const mesasOK = mesas.length >= 1 && mesas.every((m) => validarMesa(m) === "");
    const sinDuplicados = !hayDuplicadosMesa;

    return Boolean(camposNecesariosOK && celularOK && mesasOK && sinDuplicados);
  }, [form, mesas, hayDuplicadosMesa]);

  // ¿Hay datos escritos? (para confirmar Cancelar)
  const isDirty = useMemo(() => {
    const campos = Object.values(form).some((v) => String(v).trim() !== "");
    const locImgs = imagenesLocal.length > 0;
    const ms = mesas.some(
      (m) =>
        m.nroMesa.trim() ||
        m.descripcion.trim() ||
        m.tipo_mesa ||
        m.precio_hora.trim() ||
        m.fotos.length > 0
    );
    return campos || locImgs || ms;
  }, [form, imagenesLocal, mesas]);

  // ----- Imagenes -----
  const pickImage = async (dest: "local" | { mesaIndex: number }) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (!uri) return;

      if (dest === "local") {
        setImagenesLocal((arr) => [...arr, uri]);
      } else {
        const nuevas = [...mesas];
        nuevas[dest.mesaIndex].fotos.push(uri);
        setMesas(nuevas);
      }
    }
  };

  const removeLocalImage = (i: number) => {
    setImagenesLocal((arr) => arr.filter((_, idx) => idx !== i));
  };
  const removeMesaImage = (mesaIndex: number, i: number) => {
    const nuevas = [...mesas];
    nuevas[mesaIndex].fotos = nuevas[mesaIndex].fotos.filter((_, idx) => idx !== i);
    setMesas(nuevas);
  };

  // Convertir a data URI para la API
  const toDataUri = async (uri: string) => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
    return `data:image/jpeg;base64,${base64}`;
  };

  // Sanitizador de precio: solo dígitos y un punto, máx 2 decimales
  const sanitizeMoney = (txt: string) => {
    let s = txt.replace(/[^0-9.]/g, "");
    const firstDot = s.indexOf(".");
    if (firstDot !== -1) {
      const int = s.slice(0, firstDot).replace(/^0+(?=\d)/, "");
      const dec = s.slice(firstDot + 1).replace(/\./g, "").slice(0, 2);
      s = int + "." + dec;
    } else {
      s = s.replace(/^0+(?=\d)/, "");
    }
    return s;
  };

  // ----- Mesas: agregar / quitar / actualizar -----
  const agregarMesa = () =>
    setMesas((ms) => [...ms, { nroMesa: "", descripcion: "", tipo_mesa: undefined, precio_hora: "", fotos: [] }]);

  const quitarMesa = (index: number) => {
    if (mesas.length === 1) {
      Alert.alert("Aviso", "Debe haber al menos una mesa.");
      return;
    }
    setMesas((ms) => ms.filter((_, i) => i !== index));
  };

  const setMesa = (index: number, patch: Partial<MesaForm>) => {
    setMesas((ms) =>
      ms.map((m, i) => {
        if (i !== index) return m;
        const next = { ...m, ...patch };
        next.error = validarMesa(next);
        return next;
      })
    );
  };

  // ----- Enviar -----
  const onSubmit = async () => {
    if (!formularioValido) {
      // fuerza mensajes de error en cada campo
      Object.entries(form).forEach(([k, v]) => validarCampo(k as keyof typeof form, String(v)));
      setMesas((ms) => ms.map((m) => ({ ...m, error: validarMesa(m) })));
      if (hayDuplicadosMesa) {
        Alert.alert("Revisa las mesas", "Hay números de mesa duplicados.");
      }
      return;
    }

    setEnviando(true);
    try {
      const localImgs = await Promise.all(
        imagenesLocal.map((uri) => toDataUri(uri).then((b64) => ({ base64: b64 })))
      );
      const mesasImgs = await Promise.all(
        mesas.map(async (m) => {
          const arr = await Promise.all(m.fotos.map((uri) => toDataUri(uri).then((b64) => ({ base64: b64 }))));
          return arr;
        })
      );

      const payload = {
        nombre: form.nombre.trim(),
        primer_apellido: form.primer_apellido.trim(),
        segundo_apellido: form.segundo_apellido.trim() || null,
        correo: form.correo.trim(),
        password: form.password,
        confirmar_password: form.confirmar_password,
        celular: form.celular.trim() || null,
        local: {
          nombre: form.local_nombre.trim(),
          direccion: form.local_direccion.trim(),
          ciudad: form.local_ciudad.trim() || undefined,
          gps_url: form.gps_url.trim(),
          imagenes: localImgs.length ? localImgs : undefined,
        },
        mesas: mesas.map((m, i) => ({
          numero_mesa: Number(m.nroMesa),
          tipo_mesa: m.tipo_mesa as TipoMesa,
          precio_hora: Number(m.precio_hora || 0),
          descripcion: m.descripcion.trim() || null,
          imagenes: mesasImgs[i].length ? mesasImgs[i] : undefined,
        })),
      };

      const resp = await api("/registro/propietario", { method: "POST", body: payload });

      const { token, user } = resp;
      await saveAuth(token, user);

      setResult({
        visible: true,
        type: "success",
        title: "Cuenta creada",
        message: "Registro de propietario completado. Iniciaste sesión automáticamente.",
      });
    } catch (e: any) {
      setResult({
        visible: true,
        type: "error",
        title: "No se pudo registrar",
        message: e?.message || "Intenta nuevamente.",
      });
    } finally {
      setEnviando(false);
    }
  };

  const cerrarResultado = async () => {
    setResult((r) => ({ ...r, visible: false }));
    if (result.type === "success") {
      router.replace("/(principal)");
    }
  };

  // ----- Cancelar -----
  const onCancel = () => {
    if (isDirty) {
      setConfirmCancelVisible(true);
    } else {
      router.replace("/autenticacion");
    }
  };

  const confirmarCancel = () => {
    setConfirmCancelVisible(false);
    router.replace("/autenticacion");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colores.fondo }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <ScrollView contentContainerStyle={estilos.scroll}>
        <View style={estilos.contenedor}>
          <Text style={estilos.titulo}>Registrarse como Propietario</Text>

          {/* DATOS DEL PROPIETARIO */}
          <Text style={estilos.subtitulo}>Datos del Propietario</Text>

          <Campo
            label="Nombres *"
            value={form.nombre}
            onChangeText={(v) => actualizarCampo("nombre", v)}
            error={errores.nombre}
          />
          <Campo
            label="Primer Apellido *"
            value={form.primer_apellido}
            onChangeText={(v) => actualizarCampo("primer_apellido", v)}
            error={errores.primer_apellido}
          />
          <Campo
            label="Segundo Apellido (opcional)"
            value={form.segundo_apellido}
            onChangeText={(v) => actualizarCampo("segundo_apellido", v)}
            error={errores.segundo_apellido}
          />
          <Campo
            label="Celular (opcional)"
            keyboardType="phone-pad"
            value={form.celular}
            onChangeText={(v) => actualizarCampo("celular", v)}
            error={errores.celular}
          />
          <Campo
            label="Correo electrónico *"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.correo}
            onChangeText={(v) => actualizarCampo("correo", v)}
            error={errores.correo}
          />

          <Campo
            label="Contraseña *"
            secureTextEntry
            value={form.password}
            onChangeText={(v) => actualizarCampo("password", v)}
            error={errores.password}
          />
          <Campo
            label="Confirmar contraseña *"
            secureTextEntry
            value={form.confirmar_password}
            onChangeText={(v) => actualizarCampo("confirmar_password", v)}
            error={errores.confirmar_password}
          />
          <Text style={estilos.hint}>
            Requisitos: 6+ caracteres, incluye 1 mayúscula, 1 número y 1 símbolo.
          </Text>

          {/* DATOS DEL LOCAL */}
          <Text style={estilos.subtitulo}>Datos del Local</Text>
          <Campo
            label="Nombre del local *"
            value={form.local_nombre}
            onChangeText={(v) => actualizarCampo("local_nombre", v)}
            error={errores.local_nombre}
          />
          <Campo
            label="Dirección *"
            value={form.local_direccion}
            onChangeText={(v) => actualizarCampo("local_direccion", v)}
            error={errores.local_direccion}
          />
          <Campo
            label="Ciudad (opcional)"
            value={form.local_ciudad}
            onChangeText={(v) => actualizarCampo("local_ciudad", v)}
            error={errores.local_ciudad}
          />
          <Campo
            label="URL con coordenadas (Google Maps) *"
            placeholder="https://maps.google.com/?q=-17.3895,-66.1567"
            autoCapitalize="none"
            value={form.gps_url}
            onChangeText={(v) => actualizarCampo("gps_url", v)}
            error={errores.gps_url}
          />

          {/* IMÁGENES DEL LOCAL */}
          <Text style={estilos.textoAzul}>Imágenes del Local (opcional)</Text>
          <View style={estilos.filaImagenes}>
            {imagenesLocal.map((img, i) => (
              <View key={`${img}-${i}`} style={{ position: "relative" }}>
                <Image source={{ uri: img }} style={estilos.imgPreview} />
                <TouchableOpacity style={estilos.btnDel} onPress={() => removeLocalImage(i)}>
                  <Text style={{ color: "#fff", fontWeight: "800" }}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={estilos.botonImagen} onPress={() => pickImage("local")}>
              <Text style={estilos.textoMas}>＋</Text>
            </TouchableOpacity>
          </View>

          {/* MESAS */}
          <Text style={estilos.subtitulo}>Mesas (mínimo 1)</Text>
          <TouchableOpacity style={estilos.botonCrearMesa} onPress={agregarMesa}>
            <Text style={estilos.textoAzul}>＋ Agregar mesa</Text>
          </TouchableOpacity>

          {hayDuplicadosMesa && (
            <Text style={[estilos.textoError, { marginBottom: 8 }]}>
              Hay números de mesa duplicados. Corrige antes de continuar.
            </Text>
          )}

          {mesas.map((mesa, index) => {
            // ❗️Mostrar error de precio SOLO si el usuario ya escribió algo:
            const precioTocadoInvalido =
              mesa.precio_hora.length > 0 &&
              (isNaN(Number(mesa.precio_hora)) || Number(mesa.precio_hora) < 0);

            return (
              <View key={index} style={estilos.cardMesa}>
                <View style={estilos.headerMesa}>
                  <Text style={estilos.textoNegrita}>Mesa {index + 1}</Text>
                  <TouchableOpacity onPress={() => quitarMesa(index)}>
                    <Text style={estilos.textoRojo}>🗑️ Quitar</Text>
                  </TouchableOpacity>
                </View>

                <Campo
                  label="Número de mesa *"
                  keyboardType="number-pad"
                  value={mesa.nroMesa}
                  onChangeText={(t) => setMesa(index, { nroMesa: t.replace(/\D/g, "") })}
                />

                {/* Select de tipo_mesa */}
                <Select
                  label="Tipo de mesa *"
                  value={mesa.tipo_mesa}
                  options={TIPOS_MESA}
                  onChange={(v) => setMesa(index, { tipo_mesa: v })}
                />

                <Campo
                  label="Precio por hora (Bs) *"
                  keyboardType="decimal-pad"
                  value={mesa.precio_hora}
                  onChangeText={(t) => setMesa(index, { precio_hora: sanitizeMoney(t) })}
                  error={precioTocadoInvalido ? "Precio por hora debe ser un número ≥ 0." : undefined}
                />

                <Campo
                  label="Descripción (opcional)"
                  value={mesa.descripcion}
                  onChangeText={(t) => setMesa(index, { descripcion: t })}
                />

                {/* Mensaje de bloque si la mesa es inválida (aparece cuando el usuario interactúa o al intentar enviar) */}
                {mesa.error ? <Text style={estilos.textoError}>{mesa.error}</Text> : null}

                <Text style={[estilos.textoAzul, { marginTop: 8 }]}>Fotos de la mesa (opcional)</Text>
                <View style={estilos.filaImagenes}>
                  {mesa.fotos.map((f, i) => (
                    <View key={`${f}-${i}`} style={{ position: "relative" }}>
                      <Image source={{ uri: f }} style={estilos.imgPreview} />
                      <TouchableOpacity style={estilos.btnDel} onPress={() => removeMesaImage(index, i)}>
                        <Text style={{ color: "#fff", fontWeight: "800" }}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={estilos.botonImagen} onPress={() => pickImage({ mesaIndex: index })}>
                    <Text style={estilos.textoMas}>＋</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* Botones */}
          <View style={{ gap: 10, marginTop: 8 }}>
            <TouchableOpacity
              style={[
                estilos.botonRegistrar,
                { backgroundColor: formularioValido && !enviando ? Colores.primario : "#A0C4FF" },
              ]}
              disabled={!formularioValido || enviando}
              onPress={onSubmit}
            >
              <Text style={estilos.textoLleno}>{enviando ? "ENVIANDO..." : "REGISTRARSE"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[estilos.botonRegistrar, { backgroundColor: "#fff", borderWidth: 1, borderColor: Colores.borde }]}
              onPress={onCancel}
            >
              <Text style={[estilos.textoLleno, { color: "#333" }]}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Confirmar Cancelar */}
      <ConfirmModal
        visible={confirmCancelVisible}
        title="¿Cancelar registro?"
        message="Perderás los datos ingresados. ¿Deseas salir?"
        onCancel={() => setConfirmCancelVisible(false)}
        onConfirm={confirmarCancel}
        confirmText="Sí, salir"
        cancelText="Seguir aquí"
      />

      {/* Resultado */}
      <ResultModal
        visible={result.visible}
        type={result.type}
        title={result.title}
        message={result.message}
        onClose={cerrarResultado}
        buttonText="Aceptar"
      />
    </KeyboardAvoidingView>
  );
}

/** ---------- Componentes UI simples ---------- */
function Campo({
  label,
  error,
  ...rest
}: {
  label: string;
  error?: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={estilos.label}>{label}</Text>
      <TextInput
        style={[estilos.campo, error ? estilos.campoError : null]}
        placeholderTextColor="#9AA3AF"
        {...rest}
      />
      {!!error && <Text style={estilos.textoError}>{error}</Text>}
    </View>
  );
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={estilos.label}>{label}</Text>

      <TouchableOpacity
        style={[estilos.campo, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.8}
      >
        <Text style={{ color: value ? "#111" : "#9AA3AF" }}>
          {value ?? "Selecciona una opción"}
        </Text>
        <Text>▾</Text>
      </TouchableOpacity>

      {open && (
        <View style={estilos.dropdown}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => {
                onChange(opt);
                setOpen(false);
              }}
              style={estilos.dropdownItem}
            >
              <Text style={{ color: "#111" }}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

/** ---------- Estilos ---------- */
const estilos = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: Colores.fondo, paddingBottom: 40 },
  contenedor: { paddingHorizontal: 24, paddingVertical: 30 },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: Colores.primarioOscuro,
    marginBottom: 20,
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colores.verde,
    marginTop: 20,
    marginBottom: 10,
  },
  label: { marginBottom: 6, color: "#222", fontWeight: "700" },
  campo: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colores.borde,
    padding: 12,
    borderRadius: 10,
  },
  campoError: { borderColor: Colores.error },
  textoError: { color: Colores.error, fontSize: 13, marginTop: 6 },
  hint: { color: "#666", marginTop: -6, marginBottom: 12, fontSize: 12 },

  filaImagenes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  botonImagen: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: Colores.primario,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  imgPreview: { width: 64, height: 64, borderRadius: 8 },
  textoMas: { fontSize: 28, color: Colores.primario },
  btnDel: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    backgroundColor: "#0008",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  textoAzul: { color: Colores.primario, fontWeight: "600", marginBottom: 6 },
  textoRojo: { color: Colores.error, fontWeight: "bold" },
  textoNegrita: { fontWeight: "bold", marginBottom: 5 },

  botonCrearMesa: {
    backgroundColor: "#E8F0FF",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  cardMesa: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  headerMesa: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  botonRegistrar: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
  },
  textoLleno: {
    color: Colores.textoClaro,
    fontWeight: "bold",
    textAlign: "center",
  },

  dropdown: {
    marginTop: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: 10,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
});
