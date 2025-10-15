import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const Colores = {
  primario: "#0066FF",
  primarioOscuro: "#0033A0",
  fondo: "#F4F7FB",
  textoClaro: "#FFFFFF",
  borde: "#E0E0E0",
};

export default function IngresarCorreo() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");

  const correoValido = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()),
    [correo]
  );

  const enviar = () => {
    if (!correoValido) {
      Alert.alert("Correo inválido", "Ingresa un correo electrónico válido.");
      return;
    }
    router.push({
      pathname: "./verificar-codigo",
      params: { correo: correo.trim() },
    });
  };

  return (
    <KeyboardAvoidingView
      style={estilos.contenedor}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={estilos.card}>
        <Text style={estilos.titulo}>Reestablecer Contraseña</Text>
        <Text style={estilos.parrafo}>
          Ingresa tu correo. Te enviaremos un código de verificación (revisa
          también la bandeja de spam).
        </Text>

        <TextInput
          style={[estilos.campo, correo.length > 0 && !correoValido && estilos.error]}
          placeholder="Correo electrónico"
          keyboardType="email-address"
          autoCapitalize="none"
          value={correo}
          onChangeText={setCorreo}
        />

        <TouchableOpacity
          style={[
            estilos.boton,
            { backgroundColor: correoValido ? Colores.primario : "#A0C4FF" },
          ]}
          disabled={!correoValido}
          onPress={enviar}
        >
          <Text style={estilos.textoBoton}>ENVIAR CÓDIGO</Text>
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
    marginBottom: 16,
  },
  error: { borderColor: "#FF4B4B" },
  boton: {
    padding: 14,
    borderRadius: 12,
  },
  textoBoton: {
    color: Colores.textoClaro,
    fontWeight: "bold",
    textAlign: "center",
  },
});
