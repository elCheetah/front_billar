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
  blanco: "#FFFFFF",
  rojo: "#E53935",
  azulOscuro: "#002B80",
  grisClaro: "#E6E9FF",
  textoOscuro: "#222222",
};

// 📋 Modelo de datos
interface MesaEnUso {
  id: number;
  tipo: string;
  numero: string;
  cliente: string;
  fecha: string;
  hora: string;
  duracion: string;
  penalizacion: string;
  precio: string;
  estado: "ocupado" | "disponible";
}

export default function MesasEnUso() {
  const router = useRouter();

  const [mesas, setMesas] = useState<MesaEnUso[]>([
    {
      id: 1,
      tipo: "Billarcito",
      numero: "Mesa 1",
      cliente: "Juan Pérez",
      fecha: "20/10/2025",
      hora: "18:00",
      duracion: "2 horas",
      penalizacion: "0%",
      precio: "Bs50",
      estado: "ocupado",
    },
    {
      id: 2,
      tipo: "Billarcito",
      numero: "Mesa 3",
      cliente: "Carlos Gómez",
      fecha: "25/10/2025",
      hora: "14:00",
      duracion: "1 hora",
      penalizacion: "0%",
      precio: "Bs20",
      estado: "ocupado",
    },
  ]);

  const handleBack = () => router.back();

  const handleFinalizar = (id: number) => {
    Alert.alert("Confirmar Finalización", "¿Desea finalizar el uso de esta mesa?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Finalizar",
        style: "destructive",
        onPress: () => {
          setMesas((prev) =>
            prev.map((m) =>
              m.id === id ? { ...m, estado: "disponible" } : m
            )
          );
          Alert.alert("Mesa finalizada", "La mesa ahora está disponible.");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={Colores.azul} />
      </TouchableOpacity>

      <Text style={styles.titulo}>Mesas en Uso</Text>

      <ScrollView style={styles.scrollView}>
        {mesas.length === 0 ? (
          <Text style={styles.noMesasText}>No hay mesas en uso.</Text>
        ) : (
          mesas.map((mesa) => (
            <View key={mesa.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.mesaNombre}>
                  {mesa.numero} / Tipo - {mesa.tipo}
                </Text>
                <View style={styles.estadoEtiqueta}>
                  <Text style={styles.estadoTexto}>Ocupado</Text>
                </View>
              </View>

              <Text style={styles.infoTexto}>
                Nombre del cliente:{" "}
                <Text style={styles.bold}>{mesa.cliente}</Text>
              </Text>

              <View style={styles.infoRow}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={Colores.azul}
                />
                <Text style={styles.infoTexto}>
                  {mesa.fecha} | {mesa.hora}
                </Text>
              </View>

              <Text style={styles.infoTexto}>
                Duración: <Text style={styles.bold}>{mesa.duracion}</Text>
              </Text>

              <Text style={styles.infoTexto}>
                Penalización:{" "}
                <Text style={styles.bold}>{mesa.penalizacion}</Text>
              </Text>

              <View style={styles.precioContainer}>
                <Text style={styles.precio}>{mesa.precio}</Text>
              </View>

              {mesa.estado === "ocupado" && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: Colores.azulOscuro }]}
                  onPress={() => handleFinalizar(mesa.id)}
                >
                  <Text style={styles.buttonText}>Finalizar</Text>
                </TouchableOpacity>
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
    padding: 5,
    zIndex: 1,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colores.azul,
    textAlign: "center",
    marginTop: 40,
    marginBottom: 10,
  },
  scrollView: {
    marginTop: 10,
  },
  noMesasText: {
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
    alignItems: "center",
    marginBottom: 8,
  },
  mesaNombre: {
    fontWeight: "bold",
    color: Colores.azul,
    fontSize: 16,
  },
  estadoEtiqueta: {
    backgroundColor: Colores.rojo,
    borderRadius: 8,
    paddingHorizontal: 10,
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
  precioContainer: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  precio: {
    color: Colores.azul,
    fontWeight: "bold",
    fontSize: 16,
  },
  actionButton: {
    width: "100%",
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 16,
  },
});
