import { useRouter } from "expo-router";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Colores } from "../../constants/Colores";

export default function PantallaIniciarSesion() {
  const router = useRouter();

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Iniciar Sesión</Text>

      <TextInput
        style={estilos.campo}
        placeholder="Correo electrónico"
        keyboardType="email-address"
      />
      <TextInput
        style={estilos.campo}
        placeholder="Contraseña"
        secureTextEntry
      />

      <TouchableOpacity
        onPress={() => router.push("/autenticacion/recuperar/paso1-correo")}
      >
        <Text style={estilos.enlace}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={estilos.boton}>
        <Text style={estilos.textoBoton}>INICIAR SESIÓN</Text>
      </TouchableOpacity>
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
    marginBottom: 32,
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
  enlace: {
    color: Colores.primario,
    alignSelf: "flex-end",
    marginBottom: 20,
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
