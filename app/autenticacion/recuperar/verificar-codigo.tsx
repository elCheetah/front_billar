import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const Colores = {
  primario: "#0066FF",
  primarioOscuro: "#0033A0",
  fondo: "#F4F7FB",
  textoClaro: "#FFFFFF",
  borde: "#E0E0E0",
};

const DURATION_SECONDS = 5 * 60; // 5 minutos

export default function VerificarCodigo() {
  const router = useRouter();
  const { correo } = useLocalSearchParams<{ correo?: string }>();
  const [codigo, setCodigo] = useState("");
  const [segundos, setSegundos] = useState(DURATION_SECONDS);

  // Countdown visual (no bloquea – solo UI)
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

  const valido = /^[A-Za-z0-9]{6}$/.test(codigo);

  const verificar = () => {
    if (!valido) {
      Alert.alert("Código inválido", "Debe tener 6 caracteres (3 números y 3 letras).");
      return;
    }
    if (segundos === 0) {
      Alert.alert("Código vencido", "Vuelve a solicitar un nuevo código.");
      return;
    }
    // Luego: POST /auth/reset/verificar-codigo  (recibirás un token)
    // Por ahora navegamos con params simulados:
    router.push({
      pathname: "./nueva-contrasena",
      params: { correo, token: "token-simulado" },
    });
  };

  const reenviar = () => {
    // Luego: re-llamar a /auth/reset/enviar-codigo
    setSegundos(DURATION_SECONDS);
    Alert.alert("Código reenviado", `Si ${correo} existe, se envió un nuevo código.`);
  };

  return (
    <KeyboardAvoidingView
      style={estilos.contenedor}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={estilos.card}>
        <Text style={estilos.titulo}>Revisar código de verificación</Text>
        <Text style={estilos.parrafo}>
          Enviamos un código a <Text style={{ fontWeight: "bold" }}>{correo}</Text>.{"\n"}
          Tiempo restante: <Text style={{ fontWeight: "bold" }}>{tiempo}</Text>
        </Text>

        <TextInput
          style={[estilos.campo, codigo.length > 0 && !valido && estilos.error]}
          placeholder="Ingresa el código (6 caracteres)"
          autoCapitalize="characters"
          value={codigo}
          onChangeText={(t) => setCodigo(t.replace(/\s/g, ""))}
          maxLength={6}
        />

        <TouchableOpacity
          style={[estilos.boton, { backgroundColor: valido ? Colores.primario : "#A0C4FF" }]}
          disabled={!valido}
          onPress={verificar}
        >
          <Text style={estilos.textoBoton}>VERIFICAR CÓDIGO</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={reenviar} disabled={segundos > 0} style={estilos.enlaceBtn}>
          <Text style={[estilos.enlace, { opacity: segundos > 0 ? 0.4 : 1 }]}>
            Reenviar código
          </Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 16,
    letterSpacing: 2,
    textAlign: "center",
  },
  error: { borderColor: "#FF4B4B" },
  boton: { padding: 14, borderRadius: 12 },
  textoBoton: {
    color: Colores.textoClaro,
    fontWeight: "bold",
    textAlign: "center",
  },
  enlaceBtn: { marginTop: 14, alignItems: "center" },
  enlace: { color: Colores.primarioOscuro, fontWeight: "600" },
});
