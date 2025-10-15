import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../components/api";
import ConfirmModal from "../../../components/modals/ConfirmModal";
import ResultModal from "../../../components/modals/ResultModal";

const Colores = {
  primario: "#0066FF",
  primarioOscuro: "#0033A0",
  fondo: "#F4F7FB",
  textoClaro: "#FFFFFF",
  borde: "#E0E0E0",
  error: "#FF4B4B",
};

export default function IngresarCorreo() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modales
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [result, setResult] = useState<{
    visible: boolean;
    type: "success" | "error";
    title: string;
    message: string;
    onClose?: () => void;
  }>({ visible: false, type: "success", title: "", message: "" });

  const correoValido = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()),
    [correo]
  );

  async function enviarCodigo() {
    setConfirmVisible(false);
    setLoading(true);
    try {
      await api("/auth/recovery/enviar-codigo", {
        method: "POST",
        body: { correo: correo.trim() },
      });

      setResult({
        visible: true,
        type: "success",
        title: "Código enviado",
        message:
          "Si el correo está registrado, te enviamos un código de verificación. Revisa también la carpeta de spam.",
        onClose: () => {
          setResult((s) => ({ ...s, visible: false }));
          router.push({
            pathname: "./verificar-codigo",
            params: { correo: correo.trim() },
          });
        },
      });
    } catch (e: any) {
      setResult({
        visible: true,
        type: "error",
        title: "No se pudo enviar",
        message: e?.message || "Ocurrió un error inesperado.",
        onClose: () => setResult((s) => ({ ...s, visible: false })),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={estilos.contenedor}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={estilos.card}>
        <Text style={estilos.titulo}>Restablecer contraseña</Text>
        <Text style={estilos.parrafo}>
          Ingresa tu correo. Te enviaremos un código de verificación (revisa
          también la bandeja de spam).
        </Text>

        <TextInput
          style={[
            estilos.campo,
            touched && !correoValido ? estilos.error : null,
          ]}
          placeholder="Correo electrónico"
          keyboardType="email-address"
          autoCapitalize="none"
          value={correo}
          onChangeText={setCorreo}
          onBlur={() => setTouched(true)}
          editable={!loading}
        />
        {touched && !correoValido ? (
          <Text style={estilos.textoError}>
            Correo inválido (ej. usuario@correo.com)
          </Text>
        ) : null}

        <TouchableOpacity
          style={[
            estilos.boton,
            {
              backgroundColor:
                correoValido && !loading ? Colores.primario : "#A0C4FF",
            },
          ]}
          disabled={!correoValido || loading}
          onPress={() => setConfirmVisible(true)}
        >
          {loading ? (
            <ActivityIndicator color={Colores.textoClaro} />
          ) : (
            <Text style={estilos.textoBoton}>ENVIAR CÓDIGO</Text>
          )}
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={confirmVisible}
        title="Confirmar envío"
        message={`¿Enviar código a ${correo.trim()}?`}
        cancelText="Cancelar"
        confirmText="Enviar"
        onCancel={() => setConfirmVisible(false)}
        onConfirm={enviarCodigo}
      />

      <ResultModal
        visible={result.visible}
        type={result.type}
        title={result.title}
        message={result.message}
        onClose={result.onClose || (() => setResult((s) => ({ ...s, visible: false })))}
      />
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: Colores.fondo,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colores.borde,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colores.primarioOscuro,
    marginBottom: 10,
  },
  parrafo: { color: "#333", marginBottom: 16, lineHeight: 20 },
  campo: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colores.borde,
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  textoError: { color: Colores.error, marginBottom: 10 },
  error: { borderColor: Colores.error },
  boton: {
    padding: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  textoBoton: {
    color: Colores.textoClaro,
    fontWeight: "bold",
    textAlign: "center",
  },
});
