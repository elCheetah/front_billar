// app/autenticacion/registro-cliente.tsx
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../../components/api";
import ConfirmModal from "../../components/modals/ConfirmModal";
import ResultModal from "../../components/modals/ResultModal";
import { saveAuth } from "../../utils/authStorage";

const Colores = {
  primario: "#0066FF",
  primarioOscuro: "#0033A0",
  fondo: "#F4F7FB",
  textoClaro: "#FFFFFF",
  borde: "#E0E0E0",
  error: "#FF4B4B",
};

const REGEX_SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Igual que el back: 6+, mayúscula, minúscula, número, especial, sin espacios
const REGEX_PASSWORD = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*_.])[A-Za-z\d!@#$%^&*_.]{6,}$/;

export default function RegistroCliente() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [primerApellido, setPrimerApellido] = useState("");
  const [segundoApellido, setSegundoApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [celular, setCelular] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Modales
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState<{ show: boolean; ok: boolean; msg: string }>({
    show: false, ok: true, msg: "",
  });

  // Errores por campo
  const errores = useMemo(() => {
    return {
      nombre:
        !nombre.trim() ? "El nombre es obligatorio." :
        !REGEX_SOLO_LETRAS.test(nombre.trim()) ? "Solo letras y espacios." : "",

      primerApellido:
        !primerApellido.trim() ? "El primer apellido es obligatorio." :
        !REGEX_SOLO_LETRAS.test(primerApellido.trim()) ? "Solo letras y espacios." : "",

      segundoApellido:
        segundoApellido.trim() && !REGEX_SOLO_LETRAS.test(segundoApellido.trim())
          ? "Solo letras y espacios." : "",

      correo:
        !correo.trim() ? "El correo es obligatorio." :
        !REGEX_EMAIL.test(correo.trim()) ? "Correo no válido." : "",

      celular:
        celular.trim() && !/^\d{8,20}$/.test(celular.trim())
          ? "Debe tener 8 dígitos." : "",

      password:
        !password ? "La contraseña es obligatoria." :
        !REGEX_PASSWORD.test(password) ? "Mín. 6, mayúscula, minúscula, número y símbolo." : "",

      confirmarPassword:
        !confirmarPassword ? "Repite la contraseña." :
        confirmarPassword !== password ? "Las contraseñas no coinciden." : "",
    };
  }, [nombre, primerApellido, segundoApellido, correo, celular, password, confirmarPassword]);

  const formularioValido = useMemo(
    () => Object.values(errores).every((e) => e === ""),
    [errores]
  );

  const handleSubmit = async () => {
    setConfirmVisible(false);
    setLoading(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        primer_apellido: primerApellido.trim(),
        segundo_apellido: segundoApellido.trim() || null,
        correo: correo.trim(),
        password,
        confirmar_password: confirmarPassword,
        celular: celular.trim() || null,
      };

      const res = await api("/registro/cliente", { method: "POST", body: payload });

      // Guarda token + user y redirige
      await saveAuth(res.token, res.user);

      setResultVisible({ show: true, ok: true, msg: "Registro exitoso. ¡Bienvenido/a!" });
      setTimeout(() => {
        setResultVisible({ show: false, ok: true, msg: "" });
        router.replace("/(principal)");
      }, 900);
    } catch (e: any) {
      setResultVisible({ show: true, ok: false, msg: e?.message || "No se pudo completar el registro." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={estilos.scroll}>
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>Registro de Cliente</Text>

        {/* Nombre */}
        <TextInput
          style={[estilos.campo, touched.nombre && errores.nombre ? estilos.error : null]}
          placeholder="Nombres"
          value={nombre}
          onChangeText={setNombre}
          onBlur={() => setTouched((t) => ({ ...t, nombre: true }))}
        />
        {touched.nombre && !!errores.nombre && <Text style={estilos.txtError}>{errores.nombre}</Text>}

        {/* Primer apellido */}
        <TextInput
          style={[estilos.campo, touched.primerApellido && errores.primerApellido ? estilos.error : null]}
          placeholder="Primer Apellido"
          value={primerApellido}
          onChangeText={setPrimerApellido}
          onBlur={() => setTouched((t) => ({ ...t, primerApellido: true }))}
        />
        {touched.primerApellido && !!errores.primerApellido && <Text style={estilos.txtError}>{errores.primerApellido}</Text>}

        {/* Segundo apellido */}
        <TextInput
          style={[estilos.campo, touched.segundoApellido && errores.segundoApellido ? estilos.error : null]}
          placeholder="Segundo Apellido (opcional)"
          value={segundoApellido}
          onChangeText={setSegundoApellido}
          onBlur={() => setTouched((t) => ({ ...t, segundoApellido: true }))}
        />
        {touched.segundoApellido && !!errores.segundoApellido && <Text style={estilos.txtError}>{errores.segundoApellido}</Text>}

        {/* Correo */}
        <TextInput
          style={[estilos.campo, touched.correo && errores.correo ? estilos.error : null]}
          placeholder="Correo electrónico"
          keyboardType="email-address"
          autoCapitalize="none"
          value={correo}
          onChangeText={setCorreo}
          onBlur={() => setTouched((t) => ({ ...t, correo: true }))}
        />
        {touched.correo && !!errores.correo && <Text style={estilos.txtError}>{errores.correo}</Text>}

        {/* Celular */}
        <TextInput
          style={[estilos.campo, touched.celular && errores.celular ? estilos.error : null]}
          placeholder="Celular (opcional)"
          keyboardType="number-pad"
          value={celular}
          onChangeText={setCelular}
          onBlur={() => setTouched((t) => ({ ...t, celular: true }))}
        />
        {touched.celular && !!errores.celular && <Text style={estilos.txtError}>{errores.celular}</Text>}

        {/* Password */}
        <TextInput
          style={[estilos.campo, touched.password && errores.password ? estilos.error : null]}
          placeholder="Contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
        />
        {touched.password && !!errores.password && <Text style={estilos.txtError}>{errores.password}</Text>}

        {/* Confirmar password */}
        <TextInput
          style={[estilos.campo, touched.confirmarPassword && errores.confirmarPassword ? estilos.error : null]}
          placeholder="Confirmar contraseña"
          secureTextEntry
          value={confirmarPassword}
          onChangeText={setConfirmarPassword}
          onBlur={() => setTouched((t) => ({ ...t, confirmarPassword: true }))}
        />
        {touched.confirmarPassword && !!errores.confirmarPassword && (
          <Text style={estilos.txtError}>{errores.confirmarPassword}</Text>
        )}

        {/* Botón */}
        <TouchableOpacity
          style={[
            estilos.botonLleno,
            { backgroundColor: formularioValido ? Colores.primario : "#A0C4FF" },
          ]}
          disabled={!formularioValido || loading}
          onPress={() => setConfirmVisible(true)}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={estilos.textoLleno}>REGISTRARSE</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={estilos.enlace}>Volver al inicio de sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Modales */}
      <ConfirmModal
        visible={confirmVisible}
        title="Confirmar registro"
        message="Se creará tu cuenta y se iniciará sesión automáticamente."
        onCancel={() => setConfirmVisible(false)}
        onConfirm={handleSubmit}
      />

      <ResultModal
        visible={resultVisible.show}
        type={resultVisible.ok ? "success" : "error"}
        title={resultVisible.ok ? "¡Listo!" : "Ups…"}
        message={resultVisible.msg}
        onClose={() => setResultVisible({ show: false, ok: true, msg: "" })}
      />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: "center", backgroundColor: Colores.fondo },
  contenedor: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingVertical: 40 },
  titulo: { fontSize: 28, fontWeight: "bold", color: Colores.primarioOscuro, marginBottom: 30 },
  campo: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colores.borde,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  error: { borderColor: Colores.error },
  txtError: { alignSelf: "flex-start", color: Colores.error, marginBottom: 8 },
  botonLleno: { width: "100%", padding: 14, borderRadius: 12, marginTop: 10, alignItems: "center" },
  textoLleno: { color: Colores.textoClaro, fontWeight: "bold" },
  enlace: { marginTop: 20, color: Colores.primarioOscuro, fontWeight: "bold" },
});
