import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Colores = {
  azul: "#0052FF",
  azulClaro: "#E8F1FF",
  fondo: "#F5F9FF",
  texto: "#222",
  gris: "#666",
  blanco: "#FFFFFF",
};

export default function InicioCliente() {
  const router = useRouter();

  // Ejemplo de locales
  const locales = [
    {
      id: 1,
      nombre: "Billar Club Premium",
      direccion: "Av. Principal 123, Centro",
      distancia: "1.2 km",
      imagen:
        "https://cdn.pixabay.com/photo/2016/11/19/16/56/billiards-1839029_1280.jpg",
    },
    {
      id: 2,
      nombre: "Billar El Rey",
      direccion: "Calle Bolívar #85",
      distancia: "2.5 km",
      imagen:
        "https://cdn.pixabay.com/photo/2017/03/20/14/56/pool-table-2157077_1280.jpg",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* 🔹 Fila superior: Buscador + Filtros */}
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Buscar local..."
          placeholderTextColor={Colores.gris}
          style={styles.searchInput}
        />
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={22} color={Colores.azul} />
        </TouchableOpacity>
      </View>

      {/* 🔹 Botones de acción */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="business-outline" size={18} color={Colores.blanco} />
          <Text style={styles.actionText}>Locales disponibles</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="map-outline" size={18} color={Colores.blanco} />
          <Text style={styles.actionText}>Mapa</Text>
        </TouchableOpacity>
      </View>

      {/* 🔹 Lista de locales */}
      {locales.map((local) => (
        <View key={local.id} style={styles.card}>
          <Image source={{ uri: local.imagen }} style={styles.image} />
          <View style={styles.cardInfo}>
            <Text style={styles.localName}>{local.nombre}</Text>
            <Text style={styles.localAddress}>{local.direccion}</Text>
            <Text style={styles.localDistance}>📍 {local.distancia}</Text>
          </View>

          <TouchableOpacity
            style={styles.botonMesas}
            onPress={() => router.push("/(principal)/mesas")}
          >
            <Text style={styles.textoBoton}>Ver mesas disponibles</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colores.fondo,
    padding: 14,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colores.blanco,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 16,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: Colores.texto,
  },
  filterButton: {
    backgroundColor: Colores.azulClaro,
    borderRadius: 8,
    padding: 6,
    marginLeft: 6,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colores.azul,
    borderRadius: 8,
    marginHorizontal: 5,
    paddingVertical: 10,
    gap: 6,
  },
  actionText: {
    color: Colores.blanco,
    fontWeight: "600",
  },
  card: {
    backgroundColor: Colores.blanco,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardInfo: {
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  localName: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colores.azul,
  },
  localAddress: {
    color: Colores.gris,
    fontSize: 13,
  },
  localDistance: {
    fontSize: 13,
    color: Colores.texto,
    marginTop: 4,
  },
  botonMesas: {
    backgroundColor: Colores.azul,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  textoBoton: {
    color: Colores.blanco,
    fontWeight: "bold",
  },
});
