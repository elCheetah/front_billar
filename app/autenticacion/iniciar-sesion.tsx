import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
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
  fondo: "#F4F7FB",
  textoClaro: "#FFFFFF",
  borde: "#E0E0E0",
  error: "#FF4B4B",
};

export default function PantallaIniciarSesion() {
  const router = useRouter();

  // form state
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [touchedCorreo, setTouchedCorreo] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // modales
  const [showConfirm, setShowConfirm] = useState(false);
  const [resultModal, setResultModal] = useState<{
    visible: boolean;
    type: "success" | "error";
    title: string;
    message: string;
    onClose?: () => void;
  }>({
    visible: false,
    type: "success",
    title: "",
    message: "",
    onClose: undefined,
  });

  // validaciones
  const correoValido = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()),
    [correo]
  );
  const passwordValida = useMemo(() => password.trim().length >= 6, [password]);

  const errores = {
    correo:
      touchedCorreo && !correoValido
        ? "Correo inválido (ej. usuario@correo.com)."
        : "",
    password:
      touchedPassword && !passwordValida
        ? "La contraseña debe tener al menos 6 caracteres."
        : "",
  };

  const formularioValido = correoValido && passwordValida;

  async function handleLogin() {
    setShowConfirm(false);
    setLoading(true);
    try {
      const resp = await api("/auth/login", {
        method: "POST",
        body: { correo: correo.trim(), password: password.trim() },
      });
      // resp: { ok:true, token, expiresIn, user:{ id, correo, nombreCompleto, rol } }
      await saveAuth(resp.token, resp.user);

      setResultModal({
        visible: true,
        type: "success",
        title: "Bienvenido",
        message: `Hola, ${resp?.user?.nombreCompleto || "usuario"} 👋`,
        onClose: () => {
          setResultModal((s) => ({ ...s, visible: false }));
          router.replace("/(principal)");
        },
      });
    } catch (e: any) {
      setResultModal({
        visible: true,
        type: "error",
        title: "No se pudo iniciar sesión",
        message: e?.message || "Ocurrió un error inesperado.",
        onClose: () => setResultModal((s) => ({ ...s, visible: false })),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Iniciar Sesión</Text>

      <TextInput
        style={[
          estilos.campo,
          touchedCorreo && !correoValido ? estilos.error : null,
        ]}
        placeholder="Correo electrónico"
        keyboardType="email-address"
        autoCapitalize="none"
        value={correo}
        onChangeText={setCorreo}
        onBlur={() => setTouchedCorreo(true)}
        editable={!loading}
      />
      {!!errores.correo && (
        <Text style={estilos.textoError}>{errores.correo}</Text>
      )}

      <TextInput
        style={[
          estilos.campo,
          touchedPassword && !passwordValida ? estilos.error : null,
        ]}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        onBlur={() => setTouchedPassword(true)}
        editable={!loading}
      />
      {!!errores.password && (
        <Text style={estilos.textoError}>{errores.password}</Text>
      )}

      <TouchableOpacity
        onPress={() => router.push("./recuperar/ingresar-correo")}
        disabled={loading}
      >
        <Text style={estilos.enlace}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          estilos.boton,
          {
            backgroundColor:
              formularioValido && !loading ? Colores.primario : "#A0C4FF",
          },
        ]}
        disabled={!formularioValido || loading}
        onPress={() => setShowConfirm(true)}
      >
        {loading ? (
          <ActivityIndicator color={Colores.textoClaro} />
        ) : (
          <Text style={estilos.textoBoton}>INICIAR SESIÓN</Text>
        )}
      </TouchableOpacity>

      {/* Confirmación antes de llamar a la API */}
      <ConfirmModal
        visible={showConfirm}
        title="Confirmar"
        message="¿Deseas iniciar sesión con las credenciales ingresadas?"
        cancelText="Cancelar"
        confirmText="Sí, entrar"
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleLogin}
      />

      {/* Resultado (éxito o error) */}
      <ResultModal
        visible={resultModal.visible}
        type={resultModal.type}
        title={resultModal.title}
        message={resultModal.message}
        onClose={
          resultModal.onClose ||
          (() => setResultModal((s) => ({ ...s, visible: false })))
        }
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: Colores.fondo,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: Colores.primarioOscuro,
    marginBottom: 18,
  },
  campo: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colores.borde,
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  error: { borderColor: Colores.error },
  textoError: { color: Colores.error, alignSelf: "flex-start", marginTop: 6 },
  enlace: {
    color: Colores.primario,
    alignSelf: "flex-end",
    marginVertical: 16,
    fontWeight: "600",
  },
  boton: {
    width: "100%",
    backgroundColor: Colores.primario,
    padding: 14,
    borderRadius: 12,
  },
  textoBoton: {
    color: Colores.textoClaro,
    fontWeight: "bold",
    textAlign: "center",
  },
});
