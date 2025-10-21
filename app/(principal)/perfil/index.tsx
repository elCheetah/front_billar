import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// 🎨 Paleta de colores
const Colores = {
  azul: "#0052FF",
  azulClaro: "#E8F1FF",
  azulOscuro: "#0033CC",
  verde: "#28A745",
  rojo: "#DC3545",
  grisFondo: "#F5F9FF",
  grisTexto: "#666",
  blanco: "#FFFFFF",
};

export default function PerfilCliente() {
  const usuario = {
    nombre: "Carlos Mendoza",
    correo: "carlosmendoza@gmail.com",
    telefono: "76543210",
    foto: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    fechaRegistro: "10/08/2024",
  };

  const cerrarSesion = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Deseas salir de tu cuenta?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí, salir", onPress: () => console.log("Sesión cerrada") },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Cabecera del perfil */}
      <View style={styles.cardPerfil}>
        <Image source={{ uri: usuario.foto }} style={styles.fotoPerfil} />
        <View style={styles.infoPerfil}>
          <Text style={styles.nombre}>{usuario.nombre}</Text>
          <Text style={styles.correo}>{usuario.correo}</Text>
          <Text style={styles.telefono}>📞 {usuario.telefono}</Text>
          <Text style={styles.fecha}>
            Miembro desde {usuario.fechaRegistro}
          </Text>
        </View>
      </View>

      {/* Opciones del perfil */}
      <Text style={styles.subtitulo}>Opciones</Text>

      <View style={styles.opciones}>
        <TouchableOpacity style={styles.item}>
          <Ionicons name="time-outline" size={22} color={Colores.azul} />
          <Text style={styles.textoItem}>Historial de Reservas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <Ionicons name="card-outline" size={22} color={Colores.azul} />
          <Text style={styles.textoItem}>Métodos de Pago</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <Ionicons name="settings-outline" size={22} color={Colores.azul} />
          <Text style={styles.textoItem}>Configuración</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <Ionicons name="shield-checkmark-outline" size={22} color={Colores.azul} />
          <Text style={styles.textoItem}>Política de Privacidad</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <Ionicons name="help-circle-outline" size={22} color={Colores.azul} />
          <Text style={styles.textoItem}>Ayuda y Soporte</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.item, styles.itemSalir]} onPress={cerrarSesion}>
          <Ionicons name="log-out-outline" size={22} color={Colores.rojo} />
          <Text style={[styles.textoItem, { color: Colores.rojo }]}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botón final */}
      <TouchableOpacity style={styles.botonEditar}>
        <Ionicons name="create-outline" size={20} color={Colores.blanco} />
        <Text style={styles.textoEditar}>Editar Perfil</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// 💅 Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colores.grisFondo,
    padding: 16,
  },
  cardPerfil: {
    backgroundColor: Colores.blanco,
    borderRadius: 12,
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    elevation: 3,
    marginBottom: 20,
  },
  fotoPerfil: {
    width: 80,
    height: 80,
    borderRadius: 50,
    marginRight: 16,
  },
  infoPerfil: {
    flex: 1,
  },
  nombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colores.azulOscuro,
  },
  correo: {
    color: Colores.grisTexto,
    fontSize: 13,
  },
  telefono: {
    color: Colores.grisTexto,
    fontSize: 13,
    marginTop: 2,
  },
  fecha: {
    color: Colores.verde,
    fontSize: 12,
    marginTop: 4,
  },
  subtitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colores.azul,
    marginBottom: 8,
  },
  opciones: {
    backgroundColor: Colores.blanco,
    borderRadius: 10,
    padding: 6,
    marginBottom: 20,
    elevation: 2,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  textoItem: {
    fontSize: 14,
    color: Colores.azul,
    fontWeight: "500",
    marginLeft: 10,
  },
  itemSalir: {
    borderBottomWidth: 0,
  },
  botonEditar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colores.azul,
    paddingVertical: 10,
    borderRadius: 10,
  },
  textoEditar: {
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
});
