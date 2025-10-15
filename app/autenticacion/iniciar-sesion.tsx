import { useRouter } from "expo-router";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function PantallaIniciarSesion() {
  const router = useRouter();

  const irAlMenuPrincipal = () => {
    router.replace("/(principal)");
  };

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

      <TouchableOpacity>
        <Text style={estilos.enlace} onPress={() => router.push("./recuperar/ingresar-correo")}
>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={estilos.boton} onPress={irAlMenuPrincipal}>
        <Text style={estilos.textoBoton}>INICIAR SESIÓN</Text>
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
