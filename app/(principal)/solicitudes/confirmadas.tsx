// app/(principal)/solicitudes/confirmadas.tsx
import { Colores } from "@/constants/Colores";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Reserva {
  id: number;
  local: string;
  mesaNumero: string;
  estado: "confirmed" | "canceled";
  fecha: string;
  hora: string;
  duracion: string;
  precio: string;
  penalizacion: string;
}

export default function Confirmadas() {
  const router = useRouter();

  const [reservas, setReservas] = useState<Reserva[]>([
    {
      id: 1,
      local: "Billarcito",
      mesaNumero: "Mesa 1",
      estado: "confirmed",
      fecha: "20/10/2025",
      hora: "18:00",
      duracion: "2 horas",
      precio: "Bs50",
      penalizacion: "0%",
    },
    {
      id: 3,
      local: "Billarcito",
      mesaNumero: "Mesa 3",
      estado: "confirmed",
      fecha: "25/10/2025",
      hora: "14:00",
      duracion: "1 hora",
      precio: "Bs20",
      penalizacion: "0%",
    },
  ]);

  const handleBack = () => router.back();

  const handleCancel = (id: number) => {
    Alert.alert(
      "Confirmar Cancelación",
      "¿Está seguro de cancelar esta reserva?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí",
          onPress: () =>
            setReservas((prev) =>
              prev.map((r) =>
                r.id === id
                  ? { ...r, estado: "canceled", penalizacion: "50%" }
                  : r
              )
            ),
        },
      ],
      { cancelable: true }
    );
  };

  const reservasConfirmadas = reservas.filter((r) => r.estado === "confirmed");

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={Colores.primario} />
      </TouchableOpacity>

      <Text style={styles.titulo}>Billarcito</Text>

      <ScrollView style={styles.scrollView}>
        {reservasConfirmadas.length === 0 ? (
          <Text style={styles.noReservationsText}>
            No hay reservas confirmadas.
          </Text>
        ) : (
          reservasConfirmadas.map((reserva) => (
            <View key={reserva.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.mesaNombre}>
                  {reserva.mesaNumero} / Tipo - {reserva.local}
                </Text>
                <View
                  style={[
                    styles.estadoEtiqueta,
                    { backgroundColor: Colores.primario },
                  ]}
                >
                  <Text style={styles.estadoTexto}>Confirmada</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={Colores.primario}
                />
                <Text style={styles.infoTexto}>
                  {reserva.fecha} | {reserva.hora}
                </Text>
              </View>

              <Text style={styles.infoTexto}>
                Duración: <Text style={styles.bold}>{reserva.duracion}</Text>
              </Text>
              <Text style={styles.infoTexto}>
                Penalización:{" "}
                <Text style={styles.bold}>{reserva.penalizacion}</Text>
              </Text>

              <View style={styles.precioContainer}>
                <Text style={styles.precio}>{reserva.precio}</Text>
              </View>

              <TouchableOpacity
                style={[styles.cancelButton]}
                onPress={() => handleCancel(reserva.id)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colores.fondo,
    padding: 14,
  },
  backButton: {
    position: "absolute",
    top: 10,
    left: 10,
    padding: 5,
    zIndex: 1,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colores.primario,
    marginBottom: 10,
    textAlign: "center",
    marginTop: 40,
  },
  scrollView: { marginTop: 10 },
  noReservationsText: {
    fontSize: 16,
    color: Colores.textoOscuro,
    textAlign: "center",
    marginTop: 20,
  },

  card: {
    backgroundColor: Colores.textoClaro,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colores.borde,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  mesaNombre: {
    fontWeight: "700",
    color: Colores.primario,
    fontSize: 16,
  },
  estadoEtiqueta: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  estadoTexto: {
    color: Colores.textoClaro,
    fontSize: 12,
    fontWeight: "bold",
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  infoTexto: { color: Colores.primario, marginLeft: 6, fontSize: 13 },
  bold: { fontWeight: "bold", color: Colores.primario },
  precioContainer: { marginTop: 8, alignItems: "flex-end" },
  precio: { color: Colores.primario, fontWeight: "bold", fontSize: 18 },

  // 🔴 Botón Cancelar grande y de ancho completo
  cancelButton: {
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 14,
    alignItems: "center",
    width: "100%",
  },
  cancelButtonText: {
    color: Colores.textoClaro,
    fontSize: 15,
    fontWeight: "bold",
  },
});

