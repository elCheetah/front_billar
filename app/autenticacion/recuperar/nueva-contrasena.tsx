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

export default function NuevaContrasena() {
  const router = useRouter();
  // Recibimos correo, token y también el código para mandarlo en el último paso (el backend lo vuelve a verificar)
  const { correo, token, codigo } = useLocalSearchParams<{
    correo?: string;
    token?: string;
    codigo?: string;
  }>();

  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [touched1, setTouched1] = useState(false);
  const [touched2, setTouched2] = useState(false);
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

  // Guardarraíl: si falta correo o token, regresamos a inicio de flujo
  useEffect(() => {
    if (!correo || !token || !codigo) {
      setResult({
        visible: true,
        type: "error",
        title: "Solicitud inválida",
        message: "Falta información para continuar el proceso.",
        onClose: () => {
          setResult((s) => ({ ...s, visible: false }));
          router.replace("/autenticacion/recuperar/ingresar-correo");
        },
      });
    }
  }, [correo, token, codigo]);

  const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_.])[A-Za-z\d!@#$%^&*_.]{6,}$/;
  const valida1 = useMemo(() => regex.test(pass1), [pass1]);
  const valida2 = useMemo(() => pass1 === pass2 && pass2.length > 0, [pass1, pass2]);
  const formularioValido = valida1 && valida2;

  async function guardar() {
    setConfirmVisible(false);
    setLoading(true);
    try {
      await api("/auth/recovery/cambiar-password", {
        method: "POST",
        headers: { "x-reset-token": String(token) },
        body: {
          correo,
          codigo,
          password: pass1,
          confirmar_password: pass2, // <- el backend valida que coincidan
        },
      });

      setResult({
        visible: true,
        type: "success",
        title: "Contraseña actualizada",
        message: "Tu contraseña fue cambiada correctamente. Inicia sesión.",
        onClose: () => {
          setResult((s) => ({ ...s, visible: false }));
          router.replace("/autenticacion/iniciar-sesion");
        },
      });
    } catch (e: any) {
      setResult({
        visible: true,
        type: "error",
        title: "No se pudo actualizar",
        message: e?.message || "Intenta nuevamente.",
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
        <Text style={estilos.titulo}>Nueva contraseña</Text>
        <Text style={estilos.parrafo}>
          Cambiarás la contraseña de{" "}
          <Text style={{ fontWeight: "bold" }}>{correo}</Text>.
        </Text>

        <View style={estilos.inputWrap}>
          <TextInput
            style={[
              estilos.campo,
              touched1 && !valida1 ? estilos.error : null,
            ]}
            placeholder="Contraseña"
            secureTextEntry={!show1}
            value={pass1}
            onChangeText={setPass1}
            onBlur={() => setTouched1(true)}
            editable={!loading}
          />
          <TouchableOpacity
            style={estilos.ojo}
            onPress={() => setShow1((s) => !s)}
          >
            <Text>{show1 ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>
        {touched1 && !valida1 ? (
          <Text style={estilos.textoError}>
            Mínimo 6 caracteres, incluir 1 mayúscula, 1 número y 1 símbolo.
          </Text>
        ) : null}

        <View style={estilos.inputWrap}>
          <TextInput
            style={[
              estilos.campo,
              touched2 && !valida2 ? estilos.error : null,
            ]}
            placeholder="Confirmar contraseña"
            secureTextEntry={!show2}
            value={pass2}
            onChangeText={setPass2}
            onBlur={() => setTouched2(true)}
            editable={!loading}
          />
          <TouchableOpacity
            style={estilos.ojo}
            onPress={() => setShow2((s) => !s)}
          >
            <Text>{show2 ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>
        {touched2 && !valida2 ? (
          <Text style={estilos.textoError}>Las contraseñas no coinciden.</Text>
        ) : null}

        <TouchableOpacity
          style={[
            estilos.boton,
            {
              backgroundColor:
                formularioValido && !loading ? Colores.primario : "#A0C4FF",
            },
          ]}
          disabled={!formularioValido || loading}
          onPress={() => setConfirmVisible(true)}
        >
          {loading ? (
            <ActivityIndicator color={Colores.textoClaro} />
          ) : (
            <Text style={estilos.textoBoton}>GUARDAR CAMBIOS</Text>
          )}
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={confirmVisible}
        title="Confirmar"
        message="¿Deseas actualizar tu contraseña ahora?"
        cancelText="Cancelar"
        confirmText="Actualizar"
        onCancel={() => setConfirmVisible(false)}
        onConfirm={guardar}
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
  parrafo: { color: "#333", marginBottom: 12, lineHeight: 20 },
  inputWrap: { position: "relative" },
  campo: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colores.borde,
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    paddingRight: 44,
  },
  ojo: {
    position: "absolute",
    right: 12,
    top: 10,
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  error: { borderColor: Colores.error },
  textoError: { color: Colores.error, marginBottom: 8 },
  boton: { padding: 14, borderRadius: 12, marginTop: 8 },
  textoBoton: {
    color: Colores.textoClaro,
    fontWeight: "bold",
    textAlign: "center",
  },
});
