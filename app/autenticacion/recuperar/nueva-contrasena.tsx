import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const Colores = {
  primario: "#0066FF",
  primarioOscuro: "#0033A0",
  fondo: "#F4F7FB",
  textoClaro: "#FFFFFF",
  borde: "#E0E0E0",
};

export default function NuevaContrasena() {
  const router = useRouter();
  const { correo } = useLocalSearchParams<{ correo?: string; token?: string }>();

  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_.])[A-Za-z\d!@#$%^&*_.]{6,}$/;
  const valida = useMemo(() => regex.test(pass1) && pass1 === pass2, [pass1, pass2]);

  const guardar = () => {
    if (!valida) {
      Alert.alert("Revisa los campos", "La contraseña no cumple con los requisitos o no coincide.");
      return;
    }
    // Luego: POST /auth/reset/cambiar-password { token, password }
    Alert.alert("Listo", "Tu contraseña fue actualizada. Inicia sesión.");
    router.replace("/autenticacion/iniciar-sesion");
  };

  return (
    <KeyboardAvoidingView
      style={estilos.contenedor}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={estilos.card}>
        <Text style={estilos.titulo}>Nueva contraseña</Text>
        <Text style={estilos.parrafo}>
          Estás cambiando la contraseña de{" "}
          <Text style={{ fontWeight: "bold" }}>{correo}</Text>.
        </Text>

        <View style={estilos.inputWrap}>
          <TextInput
            style={[estilos.campo, pass1.length > 0 && !regex.test(pass1) && estilos.error]}
            placeholder="Contraseña"
            secureTextEntry={!show1}
            value={pass1}
            onChangeText={setPass1}
          />
          <TouchableOpacity style={estilos.ojo} onPress={() => setShow1((s) => !s)}>
            <Text>{show1 ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        <View style={estilos.inputWrap}>
          <TextInput
            style={[estilos.campo, pass2.length > 0 && pass1 !== pass2 && estilos.error]}
            placeholder="Confirmar contraseña"
            secureTextEntry={!show2}
            value={pass2}
            onChangeText={setPass2}
          />
          <TouchableOpacity style={estilos.ojo} onPress={() => setShow2((s) => !s)}>
            <Text>{show2 ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={estilos.hint}>
          Mínimo 6 caracteres, incluye 1 mayúscula, 1 número y 1 símbolo.
        </Text>

        <TouchableOpacity
          style={[estilos.boton, { backgroundColor: valida ? Colores.primario : "#A0C4FF" }]}
          disabled={!valida}
          onPress={guardar}
        >
          <Text style={estilos.textoBoton}>GUARDAR CAMBIOS</Text>
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
  inputWrap: { position: "relative" },
  campo: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colores.borde,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
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
  error: { borderColor: "#FF4B4B" },
  hint: { color: "#666", marginBottom: 10, fontSize: 12 },
  boton: { padding: 14, borderRadius: 12, marginTop: 6 },
  textoBoton: {
    color: Colores.textoClaro,
    fontWeight: "bold",
    textAlign: "center",
  },
});
