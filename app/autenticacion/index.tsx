import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PantallaInicioAutenticacion() {
  const router = useRouter();

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.logo}>🎱 Billarcito</Text>

      <TouchableOpacity
        style={estilos.botonLleno}
        onPress={() => router.push("/autenticacion/iniciar-sesion")}
      >
        <Text style={estilos.textoLleno}>INICIAR SESIÓN</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={estilos.botonContorno}
        onPress={() => router.push("/autenticacion/registro-cliente")}
      >
        <Text style={estilos.textoContorno}>REGISTRARSE COMO CLIENTE</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={estilos.botonContorno}
        onPress={() => router.push("/autenticacion/registro-propietario")}
      >
        <Text style={estilos.textoContorno}>REGISTRARSE COMO PROPIETARIO</Text>
      </TouchableOpacity>
    </View>
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
  botonLleno: {
    width: "100%",
    backgroundColor: Colores.primario,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  textoLleno: {
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
  textoContorno: {
    color: Colores.primarioOscuro,
    fontWeight: "bold",
    textAlign: "center",
  },
});
