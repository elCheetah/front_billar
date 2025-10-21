import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Mesa {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string[];
  precio: string;
  imagen: string;
  disponible: boolean;
  rating: number;
}

export default function MesasDisponibles() {
  const [mesas, setMesas] = useState<Mesa[]>([
    {
      id: 1,
      nombre: "Mesa Premium 1",
      tipo: "Mesa de billar Americano",
      descripcion: ["Mesa profesional", "Iluminación LED", "Tacos premium"],
      precio: "Bs25/hora",
      imagen: "https://cdn.pixabay.com/photo/2016/11/19/16/56/billiards-1839029_1280.jpg",
      disponible: true,
      rating: 4.8,
    },
    {
      id: 2,
      nombre: "Mesa Clásica 2",
      tipo: "Mesa de billar Inglés",
      descripcion: ["Mesa estándar", "Buena iluminación", "Tacos incluidos"],
      precio: "Bs18/hora",
      imagen: "https://cdn.pixabay.com/photo/2017/03/20/14/56/pool-table-2157077_1280.jpg",
      disponible: true,
      rating: 4.5,
    },
    {
      id: 3,
      nombre: "Mesa VIP 3",
      tipo: "Snooker",
      descripcion: ["Mesa de torneo", "Zona privada", "Servicio de mesero"],
      precio: "Bs15/hora",
      imagen: "https://cdn.pixabay.com/photo/2016/11/19/16/56/billiard-1839027_1280.jpg",
      disponible: false,
      rating: 5.0,
    },
  ]);

  return (
    <ScrollView style={styles.container}>
      {/* Encabezado del local */}
      <View style={styles.localHeader}>
        <Ionicons name="location-outline" size={20} color="#2A9D8F" />
        <View>
          <Text style={styles.localName}>Billar Club Premium</Text>
          <Text style={styles.localAddress}>Av. Principal 123, Centro</Text>
        </View>
      </View>

      {/* Lista de mesas */}
      {mesas.map((mesa) => (
        <View key={mesa.id} style={styles.card}>
          <Image source={{ uri: mesa.imagen }} style={styles.image} />

          <View style={styles.cardContent}>
            <View style={styles.row}>
              <Text style={styles.mesaNombre}>{mesa.nombre}</Text>
              <View style={styles.priceTag}>
                <Text style={styles.priceText}>{mesa.precio}</Text>
              </View>
            </View>

            <Text style={styles.tipo}>{mesa.tipo}</Text>
            <View style={{ marginTop: 4 }}>
              {mesa.descripcion.map((d, i) => (
                <Text key={i} style={styles.descripcion}>• {d}</Text>
              ))}
            </View>

            <View style={styles.bottomRow}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{mesa.rating}</Text>
              </View>

              <TouchableOpacity
                disabled={!mesa.disponible}
                style={[
                  styles.botonReserva,
                  !mesa.disponible && { backgroundColor: "#ccc" },
                ]}
              >
                <Text style={styles.textoBoton}>
                  {mesa.disponible ? "Reservar Mesa" : "No Disponible"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F9FF",
    padding: 10,
  },
  localHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F1FF",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
  },
  localName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0052FF",
    marginLeft: 5,
  },
  localAddress: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 150,
  },
  cardContent: {
    padding: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mesaNombre: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0033CC",
  },
  priceTag: {
    backgroundColor: "#0052FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priceText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  tipo: {
    color: "#007BFF",
    fontSize: 13,
    marginTop: 4,
  },
  descripcion: {
    color: "#444",
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    color: "#333",
    fontSize: 13,
    marginLeft: 3,
  },
  botonReserva: {
    backgroundColor: "#0052FF",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  textoBoton: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
  },
});
