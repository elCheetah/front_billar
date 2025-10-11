import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colores } from "../../constants/Colores";

export default function PantallaInicioAutenticacion() {
  const router = useRouter();

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.logo}>🎱 Billarcito</Text>

      <TouchableOpacity
        style={estilos.boton}
        onPress={() => router.push("/autenticacion/iniciar-sesion")}
      >
        <Text style={estilos.textoBoton}>INICIAR SESIÓN</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={estilos.botonContorno}
        onPress={() => router.push("/autenticacion/registro-cliente")}
      >
        <Text style={estilos.textoBotonContorno}>REGISTRARSE COMO CLIENTE</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={estilos.botonContorno}
        onPress={() => router.push("/autenticacion/registro-propietario")}
      >
        <Text style={estilos.textoBotonContorno}>REGISTRARSE COMO PROPIETARIO</Text>
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
  logo: {
    fontSize: 36,
    fontWeight: "bold",
    color: Colores.primarioOscuro,
    marginBottom: 40,
  },
  boton: {
    width: "100%",
    backgroundColor: Colores.primario,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  textoBoton: {
    color: Colores.textoClaro,
    fontWeight: "bold",
    textAlign: "center",
  },
  botonContorno: {
    width: "100%",
    borderWidth: 2,
    borderColor: Colores.primario,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  textoBotonContorno: {
    color: Colores.primarioOscuro,
    fontWeight: "bold",
    textAlign: "center",
  },
});
