import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

const DURATION_SECONDS = 5 * 60; // 5 minutos

export default function VerificarCodigo() {
  const router = useRouter();
  const { correo } = useLocalSearchParams<{ correo?: string }>();

  const [codigo, setCodigo] = useState("");
  const [segundos, setSegundos] = useState(DURATION_SECONDS);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Modales
  const [result, setResult] = useState<{
    visible: boolean;
    type: "success" | "error";
    title: string;
    message: string;
    onClose?: () => void;
  }>({ visible: false, type: "success", title: "", message: "" });
  const [confirmReenviar, setConfirmReenviar] = useState(false);
  const [confirmVerificar, setConfirmVerificar] = useState(false);

  // Guardarraíl: si no hay correo, volvemos a la pantalla anterior
  useEffect(() => {
    if (!correo) {
      setResult({
        visible: true,
        type: "error",
        title: "Falta información",
        message: "No se encontró el correo de la solicitud.",
        onClose: () => {
          setResult((s) => ({ ...s, visible: false }));
          router.replace("/autenticacion/recuperar/ingresar-correo");
        },
      });
    }
  }, [correo]);

  // Countdown visual
  useEffect(() => {
    const t = setInterval(() => {
      setSegundos((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const tiempo = useMemo(() => {
    const m = String(Math.floor(segundos / 60)).padStart(2, "0");
    const s = String(segundos % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [segundos]);

  // Validación local: 6 caracteres alfanuméricos
  const valido = /^[A-Za-z0-9]{6}$/.test(codigo);

  async function reenviarCodigo() {
    setConfirmReenviar(false);
    setResending(true);
    try {
      await api("/auth/recovery/enviar-codigo", {
        method: "POST",
        body: { correo },
      });
      setSegundos(DURATION_SECONDS);
      setResult({
        visible: true,
        type: "success",
        title: "Código reenviado",
        message: "Hemos enviado un nuevo código a tu correo.",
        onClose: () => setResult((s) => ({ ...s, visible: false })),
      });
    } catch (e: any) {
      setResult({
        visible: true,
        type: "error",
        title: "No se pudo reenviar",
        message: e?.message || "Intenta nuevamente más tarde.",
        onClose: () => setResult((s) => ({ ...s, visible: false })),
      });
    } finally {
      setResending(false);
    }
  }

  async function verificarCodigo() {
    setConfirmVerificar(false);
    setLoading(true);
    try {
      const resp = await api("/auth/recovery/verificar-codigo", {
        method: "POST",
        body: { correo, codigo },
      });
      // resp: { ok:true, resetToken }
      setResult({
        visible: true,
        type: "success",
        title: "Código verificado",
        message: "Ahora define tu nueva contraseña.",
        onClose: () => {
          setResult((s) => ({ ...s, visible: false }));
          router.push({
            pathname: "./nueva-contrasena",
            params: { correo: String(correo), token: String(resp.resetToken), codigo },
          });
        },
      });
    } catch (e: any) {
      setResult({
        visible: true,
        type: "error",
        title: "Código inválido",
        message: e?.message || "Verifica e intenta nuevamente.",
        onClose: () => setResult((s) => ({ ...s, visible: false })),
      });
    } finally {
      setLoading(false);
    }
  }

  const disableReenviar = segundos > 0 || resending;

  return (
    <KeyboardAvoidingView
      style={estilos.contenedor}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={estilos.card}>
        <Text style={estilos.titulo}>Verificar código</Text>
        <Text style={estilos.parrafo}>
          Enviamos un código a <Text style={{ fontWeight: "bold" }}>{correo}</Text>.{"\n"}
          Tiempo restante: <Text style={{ fontWeight: "bold" }}>{tiempo}</Text>
        </Text>

        <TextInput
          style={[
            estilos.campo,
            codigo.length > 0 && !valido ? estilos.error : null,
          ]}
          placeholder="Ingresa el código (6 caracteres)"
          autoCapitalize="characters"
          value={codigo}
          onChangeText={(t) => setCodigo(t.replace(/\s/g, ""))}
          maxLength={6}
        />
        {codigo.length > 0 && !valido ? (
          <Text style={estilos.textoError}>
            Debe ser alfanumérico, 6 caracteres.
          </Text>
        ) : null}

        <TouchableOpacity
          style={[
            estilos.boton,
            {
              backgroundColor:
                valido && !loading ? Colores.primario : "#A0C4FF",
            },
          ]}
          disabled={!valido || loading}
          onPress={() => setConfirmVerificar(true)}
        >
          {loading ? (
            <ActivityIndicator color={Colores.textoClaro} />
          ) : (
            <Text style={estilos.textoBoton}>VERIFICAR CÓDIGO</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setConfirmReenviar(true)}
          disabled={disableReenviar}
          style={estilos.enlaceBtn}
        >
          <Text
            style={[
              estilos.enlace,
              { opacity: disableReenviar ? 0.4 : 1 },
            ]}
          >
            Reenviar código
          </Text>
        </TouchableOpacity>
      </View>

      {/* Confirmaciones */}
      <ConfirmModal
        visible={confirmReenviar}
        title="Reenviar código"
        message={`¿Enviar un nuevo código a ${correo}?`}
        cancelText="No"
        confirmText="Reenviar"
        onCancel={() => setConfirmReenviar(false)}
        onConfirm={reenviarCodigo}
      />

      <ConfirmModal
        visible={confirmVerificar}
        title="Confirmar verificación"
        message="¿Verificar el código ingresado?"
        cancelText="Cancelar"
        confirmText="Verificar"
        onCancel={() => setConfirmVerificar(false)}
        onConfirm={verificarCodigo}
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
    fontSize: 20,
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
    letterSpacing: 2,
    textAlign: "center",
  },
  textoError: { color: Colores.error, marginBottom: 10, textAlign: "center" },
  error: { borderColor: Colores.error },
  boton: { padding: 14, borderRadius: 12, marginTop: 6 },
  textoBoton: {
    color: Colores.textoClaro,
    fontWeight: "bold",
    textAlign: "center",
  },
  enlaceBtn: { marginTop: 14, alignItems: "center" },
  enlace: { color: Colores.primarioOscuro, fontWeight: "600" },
});
