import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function RegistroPropietario() {
  const router = useRouter();

  // Estados de campos
  const [nombreLocal, setNombreLocal] = useState("");
  const [direccion, setDireccion] = useState("");
  const [nombrePropietario, setNombrePropietario] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");

  // Validaciones
  const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/;
  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const telefonoValido = /^[0-9]{8,}$/; // mínimo 8 dígitos, solo números

  const formularioValido =
    soloLetras.test(nombreLocal.trim()) &&
    direccion.trim().length >= 5 &&
    soloLetras.test(nombrePropietario.trim()) &&
    correoValido.test(correo.trim()) &&
    telefonoValido.test(telefono.trim()) &&
    contrasena.length >= 6 &&
    contrasena === confirmarContrasena;

  const manejarRegistro = () => {
    if (!formularioValido) return;
    router.replace("/(principal)");
  };

  return (
    <ScrollView contentContainerStyle={estilos.scroll}>
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>Registro de Propietario</Text>

        <TextInput
          style={[estilos.campo, !soloLetras.test(nombreLocal.trim()) && nombreLocal !== "" ? estilos.error : null]}
          placeholder="Nombre del local"
          value={nombreLocal}
          onChangeText={setNombreLocal}
        />

        <TextInput
          style={[estilos.campo, direccion.length > 0 && direccion.length < 5 ? estilos.error : null]}
          placeholder="Dirección del local"
          value={direccion}
          onChangeText={setDireccion}
        />

        <TextInput
          style={[estilos.campo, !soloLetras.test(nombrePropietario.trim()) && nombrePropietario !== "" ? estilos.error : null]}
          placeholder="Nombre del propietario"
          value={nombrePropietario}
          onChangeText={setNombrePropietario}
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
          style={[estilos.campo, !telefonoValido.test(telefono.trim()) && telefono !== "" ? estilos.error : null]}
          placeholder="Teléfono (solo números)"
          keyboardType="numeric"
          value={telefono}
          onChangeText={setTelefono}
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
