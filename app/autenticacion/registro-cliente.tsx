import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function RegistroCliente() {
  const router = useRouter();

  const [primerApellido, setPrimerApellido] = useState("");
  const [segundoApellido, setSegundoApellido] = useState("");
  const [nombres, setNombres] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");

  // Validaciones
  const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/;
  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const formularioValido =
    soloLetras.test(primerApellido.trim()) &&
    soloLetras.test(segundoApellido.trim()) &&
    soloLetras.test(nombres.trim()) &&
    correoValido.test(correo.trim()) &&
    contrasena.length >= 6 &&
    contrasena === confirmarContrasena;

  const manejarRegistro = () => {
    if (!formularioValido) return;
    router.replace("/(principal)");
  };

  return (
    <ScrollView contentContainerStyle={estilos.scroll}>
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>Registro de Cliente</Text>

        <TextInput
          style={[estilos.campo, !soloLetras.test(primerApellido.trim()) && primerApellido !== "" ? estilos.error : null]}
          placeholder="Primer Apellido"
          value={primerApellido}
          onChangeText={setPrimerApellido}
        />

        <TextInput
          style={[estilos.campo, !soloLetras.test(segundoApellido.trim()) && segundoApellido !== "" ? estilos.error : null]}
          placeholder="Segundo Apellido"
          value={segundoApellido}
          onChangeText={setSegundoApellido}
        />

        <TextInput
          style={[estilos.campo, !soloLetras.test(nombres.trim()) && nombres !== "" ? estilos.error : null]}
          placeholder="Nombres"
          value={nombres}
          onChangeText={setNombres}
        />

        <TextInput
          style={[estilos.campo, !correoValido.test(correo.trim()) && correo !== "" ? estilos.error : null]}
          placeholder="Correo electrónico"
          keyboardType="email-address"
          autoCapitalize="none"
          value={correo}
          onChangeText={setCorreo}
        />

        <TextInput
          style={[estilos.campo, contrasena.length > 0 && contrasena.length < 6 ? estilos.error : null]}
          placeholder="Contraseña"
          secureTextEntry={true}
          value={contrasena}
          onChangeText={setContrasena}
        />

        <TextInput
          style={[estilos.campo, contrasena !== confirmarContrasena && confirmarContrasena !== "" ? estilos.error : null]}
          placeholder="Confirmar contraseña"
          secureTextEntry={true}
          value={confirmarContrasena}
          onChangeText={setConfirmarContrasena}
        />

        <TouchableOpacity
          style={[estilos.botonLleno, { backgroundColor: formularioValido ? Colores.primario : "#A0C4FF" }]}
          disabled={!formularioValido}
          onPress={manejarRegistro}
        >
          <Text style={estilos.textoLleno}>REGISTRARSE</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={estilos.enlace}>Volver al inicio de sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const Colores = {
  primario: "#0066FF",
  primarioOscuro: "#0033A0",
  fondo: "#F4F7FB",
  textoClaro: "#FFFFFF",
  borde: "#E0E0E0",
  error: "#FF4B4B",
};

const estilos = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: Colores.fondo,
  },
  contenedor: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colores.primarioOscuro,
    marginBottom: 30,
  },
  campo: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colores.borde,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  error: {
    borderColor: Colores.error,
  },
  botonLleno: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  textoLleno: {
    color: Colores.textoClaro,
    fontWeight: "bold",
    textAlign: "center",
  },
  enlace: {
    marginTop: 20,
    color: Colores.primarioOscuro,
    fontWeight: "bold",
  },
});
