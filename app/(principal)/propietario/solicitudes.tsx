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

// 🎨 Paleta de colores
const Colores = {
  azul: "#0052FF",
  azulOscuro: "#002B80",
  rojo: "#E53935",
  verde: "#059669",
  blanco: "#FFFFFF",
  grisClaro: "#E6E9FF",
  textoOscuro: "#222222",
};

// 📋 Modelo de datos
interface Solicitud {
  id: number;
  mesa: string;
  tipo: string;
  cliente: string;
  fecha: string;
  hora: string;
  duracion: string;
  penalizacion: string;
  precio: string;
  estado: "pendiente" | "aceptada" | "rechazada";
}

export default function SolicitudesReserva() {
  const router = useRouter();

  const [filtro, setFiltro] = useState<"pendiente" | "aceptada" | "rechazada">(
    "pendiente"
  );

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([
    {
      id: 1,
      mesa: "Mesa 1",
      tipo: "Billarcito",
      cliente: "Juan Pérez",
      fecha: "27/10/2025",
      hora: "18:00",
      duracion: "2 horas",
      penalizacion: "0%",
      precio: "Bs50",
      estado: "pendiente",
    },
    {
      id: 2,
      mesa: "Mesa 3",
      tipo: "Billarcito",
      cliente: "María López",
      fecha: "28/10/2025",
      hora: "14:00",
      duracion: "1 hora",
      penalizacion: "0%",
      precio: "Bs20",
      estado: "aceptada",
    },
    {
      id: 3,
      mesa: "Mesa 2",
      tipo: "Billarcito",
      cliente: "Carlos Gómez",
      fecha: "29/10/2025",
      hora: "16:00",
      duracion: "2 horas",
      penalizacion: "10%",
      precio: "Bs40",
      estado: "rechazada",
    },
  ]);

  const handleBack = () => router.back();

  const handleAceptar = (id: number) => {
    Alert.alert("Confirmar Aceptación", "¿Desea aceptar esta solicitud?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Aceptar",
        onPress: () => {
          setSolicitudes((prev) =>
            prev.map((s) =>
              s.id === id ? { ...s, estado: "aceptada" } : s
            )
          );
          Alert.alert("Solicitud aceptada", "La reserva fue confirmada.");
        },
      },
    ]);
  };

  const handleRechazar = (id: number) => {
    Alert.alert("Confirmar Rechazo", "¿Desea rechazar esta solicitud?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Rechazar",
        style: "destructive",
        onPress: () => {
          setSolicitudes((prev) =>
            prev.map((s) =>
              s.id === id ? { ...s, estado: "rechazada" } : s
            )
          );
          Alert.alert("Solicitud rechazada", "La reserva fue cancelada.");
        },
      },
    ]);
  };

  const solicitudesFiltradas = solicitudes.filter((s) => s.estado === filtro);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={Colores.azul} />
      </TouchableOpacity>

      <Text style={styles.titulo}>Solicitudes de Reserva</Text>

      {/* FILTROS */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filtro === "pendiente" && styles.filterChipActive,
          ]}
          onPress={() => setFiltro("pendiente")}
        >
          <Text
            style={[
              styles.filterText,
              filtro === "pendiente" && styles.filterTextActive,
            ]}
          >
            Pendientes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filtro === "aceptada" && styles.filterChipActive,
          ]}
          onPress={() => setFiltro("aceptada")}
        >
          <Text
            style={[
              styles.filterText,
              filtro === "aceptada" && styles.filterTextActive,
            ]}
          >
            Aceptadas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filtro === "rechazada" && styles.filterChipActive,
          ]}
          onPress={() => setFiltro("rechazada")}
        >
          <Text
            style={[
              styles.filterText,
              filtro === "rechazada" && styles.filterTextActive,
            ]}
          >
            Rechazadas
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTA DE SOLICITUDES */}
      <ScrollView style={styles.scrollView}>
        {solicitudesFiltradas.length === 0 ? (
          <Text style={styles.noSolicitudesText}>No hay solicitudes.</Text>
        ) : (
          solicitudesFiltradas.map((solicitud) => (
            <View key={solicitud.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.mesaNombre}>
                  {solicitud.mesa} / Tipo - {solicitud.tipo}
                </Text>
                <View
                  style={[
                    styles.estadoEtiqueta,
                    solicitud.estado === "pendiente"
                      ? { backgroundColor: Colores.azul }
                      : solicitud.estado === "aceptada"
                      ? { backgroundColor: Colores.verde }
                      : { backgroundColor: Colores.rojo },
                  ]}
                >
                  <Text style={styles.estadoTexto}>
                    {solicitud.estado.charAt(0).toUpperCase() +
                      solicitud.estado.slice(1)}
                  </Text>
                </View>
              </View>

              <Text style={styles.infoTexto}>
                Cliente:{" "}
                <Text style={styles.bold}>{solicitud.cliente}</Text>
              </Text>

              <View style={styles.infoRow}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={Colores.azul}
                />
                <Text style={styles.infoTexto}>
                  {solicitud.fecha} | {solicitud.hora}
                </Text>
              </View>

              <Text style={styles.infoTexto}>
                Duración:{" "}
                <Text style={styles.bold}>{solicitud.duracion}</Text>
              </Text>

              <Text style={styles.infoTexto}>
                Penalización:{" "}
                <Text style={styles.bold}>{solicitud.penalizacion}</Text>
              </Text>

              <Text style={styles.precio}>{solicitud.precio}</Text>

              {solicitud.estado === "pendiente" && (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: Colores.verde },
                    ]}
                    onPress={() => handleAceptar(solicitud.id)}
                  >
                    <Text style={styles.buttonText}>Aceptar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: Colores.rojo },
                    ]}
                    onPress={() => handleRechazar(solicitud.id)}
                  >
                    <Text style={styles.buttonText}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// 🎨 Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colores.blanco,
    padding: 14,
  },
  backButton: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 1,
    padding: 5,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colores.azul,
    textAlign: "center",
    marginTop: 40,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: Colores.azul,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  filterChipActive: {
    backgroundColor: Colores.azul,
  },
  filterText: {
    color: Colores.azul,
    fontWeight: "bold",
  },
  filterTextActive: {
    color: Colores.blanco,
  },
  scrollView: {
    marginTop: 4,
  },
  noSolicitudesText: {
    textAlign: "center",
    color: Colores.textoOscuro,
    fontSize: 16,
    marginTop: 20,
  },
  card: {
    backgroundColor: Colores.blanco,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colores.grisClaro,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  mesaNombre: {
    fontWeight: "bold",
    color: Colores.azul,
    fontSize: 16,
  },
  estadoEtiqueta: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  estadoTexto: {
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  infoTexto: {
    color: Colores.textoOscuro,
    fontSize: 13,
    marginTop: 3,
    marginLeft: 2,
  },
  bold: {
    fontWeight: "bold",
    color: Colores.azul,
  },
  precio: {
    color: Colores.azul,
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "right",
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 15,
  },
});
