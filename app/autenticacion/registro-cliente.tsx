import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function RegistroCliente() {
  const router = useRouter();

  const manejarRegistro = () => {
    // Aquí luego conectarás con tu backend
    router.replace("/(principal)"); // redirige al menú principal tras registrarse
  };

  return (
    <ScrollView contentContainerStyle={estilos.scroll}>
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>Registro de Cliente</Text>

        <TextInput style={estilos.campo} placeholder="Primer Apellido" />
        <TextInput style={estilos.campo} placeholder="Segundo Apellido" />
        <TextInput style={estilos.campo} placeholder="Nombres" />
        <TextInput style={estilos.campo} placeholder="Correo electrónico" keyboardType="email-address" />
        <TextInput style={estilos.campo} placeholder="Contraseña" secureTextEntry />
        <TextInput style={estilos.campo} placeholder="Confirmar contraseña" secureTextEntry />

        <TouchableOpacity style={estilos.botonLleno} onPress={manejarRegistro}>
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
  botonLleno: {
    width: "100%",
    backgroundColor: Colores.primario,
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
