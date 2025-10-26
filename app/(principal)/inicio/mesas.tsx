import { AntDesign } from "@expo/vector-icons"; // 👈 añadimos para usar la flecha
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Mesas() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // === Datos simulados (mock) ===
  const locales = [
    {
      id: 1,
      nombre: "Billar Sacaba Center",
      direccion: "Av. Chapare 456",
      mesas: [
        {
          id: 1,
          nombre: "Mesa 1",
          tipo: "Americano",
          precio: "Bs 25/hora",
          imagen: "https://cdn.pixabay.com/photo/2017/03/20/14/56/pool-table-2157077_1280.jpg",
        },
        {
          id: 2,
          nombre: "Mesa 2",
          tipo: "Inglés",
          precio: "Bs 20/hora",
          imagen: "https://cdn.pixabay.com/photo/2016/11/19/16/56/billiards-1839029_1280.jpg",
        },
      ],
    },
    {
      id: 2,
      nombre: "Billar Don Beto",
      direccion: "Calle Bolívar 123",
      mesas: [
        {
          id: 3,
          nombre: "Mesa 1",
          tipo: "Pool Profesional",
          precio: "Bs 22/hora",
          imagen: "https://cdn.pixabay.com/photo/2017/03/20/14/56/pool-table-2157077_1280.jpg",
        },
        {
          id: 4,
          nombre: "Mesa 2",
          tipo: "Snooker",
          precio: "Bs 30/hora",
          imagen: "https://cdn.pixabay.com/photo/2016/11/19/16/56/billiard-1839027_1280.jpg",
        },
      ],
    },
  ];

  const localId = Number(id);

  // Buscar local según el id recibido
  const local = useMemo(() => locales.find((l) => l.id === localId), [localId]);

  if (!local) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se encontraron mesas para este local.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* === Flecha para volver a filtros === */}
      {/* === Encabezado con flecha y texto centrado === */}
<View
  style={{
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // 👈 centra horizontalmente el contenido
    marginBottom: 10,
  }}
>
  <TouchableOpacity
    onPress={() => router.push("/(principal)/inicio/filtros")}
    style={{ position: "absolute", left: 0 }} // 👈 mantiene la flecha a la izquierda
  >
    <AntDesign name="arrow-left" size={24} color="#0033CC" />
  </TouchableOpacity>

  <Text
    style={{
      fontSize: 18,
      fontWeight: "bold",
      color: "#0033CC",
      textAlign: "center",
    }}
  >
    Mesas disponibles
  </Text>
</View>


      <Text style={styles.titulo}>{local.nombre}</Text>
      <Text style={styles.subtitulo}>{local.direccion}</Text>

      {local.mesas.map((mesa) => (
        <View key={mesa.id} style={styles.card}>
          <View style={styles.row}>
            <Image source={{ uri: mesa.imagen }} style={styles.imagen} />
            <View style={styles.info}>
              <Text style={styles.nombre}>{mesa.nombre}</Text>
              <Text style={styles.text}>Tipo de mesa: {mesa.tipo}</Text>
              <Text style={styles.text}>Precio: {mesa.precio}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.btnReservar}
            onPress={() =>
              router.push({
                pathname: "/(principal)/inicio/reservar",
                params: { mesaId: mesa.id, localId: local.id },
              })
            }
          >
            <Text style={styles.btnText}>Reservar</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

/* === ESTILOS === */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F9FF", padding: 16 },
  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0033A0",
    marginBottom: 2,
    textAlign: "center",
  },
  subtitulo: {
    textAlign: "center",
    color: "#555",
    fontSize: 13,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    elevation: 3,
  },
  row: { flexDirection: "row", alignItems: "center" },
  imagen: { width: 90, height: 90, borderRadius: 10, marginRight: 12 },
  info: { flex: 1 },
  nombre: { fontSize: 15, fontWeight: "bold", color: "#0033CC", marginBottom: 4 },
  text: { fontSize: 13, color: "#333" },
  btnReservar: {
    backgroundColor: "#0052FF",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { color: "#FFF", fontWeight: "bold" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#E63946", fontSize: 15, fontWeight: "bold" },
});
