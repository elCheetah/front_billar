import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// 🎨 Paleta de colores
const Colores = {
  azul: "#0052FF",
  azulClaro: "#E8F1FF",
  verde: "#28A745",
  rojo: "#DC3545",
  amarillo: "#FFC107",
  grisFondo: "#F5F9FF",
  grisTexto: "#666",
  blanco: "#FFFFFF",
};

// 📋 Datos de ejemplo (simulan reservas)
interface Reserva {
  id: number;
  mesa: string;
  estado: "pendiente" | "enUso" | "cancelada";
  fecha: string;
  hora: string;
  duracion: string;
  precio: string;
  anticipo: string;
  penalizacion: string;
}

export default function MisReservas() {
  const [reservas, setReservas] = useState<Reserva[]>([
    {
      id: 1,
      mesa: "Mesa Premium 1",
      estado: "enUso",
      fecha: "20/10/2025",
      hora: "18:00",
      duracion: "2 horas",
      precio: "Bs50",
      anticipo: "Bs17.50",
      penalizacion: "100%",
    },
    {
      id: 2,
      mesa: "Mesa Clásica 2",
      estado: "pendiente",
      fecha: "22/10/2025",
      hora: "20:00",
      duracion: "1 hora",
      precio: "Bs18",
      anticipo: "Bs8.50",
      penalizacion: "0%",
    },
    {
      id: 3,
      mesa: "Mesa VIP 3",
      estado: "enUso",
      fecha: "25/10/2025",
      hora: "16:00",
      duracion: "2 horas",
      precio: "Bs70",
      anticipo: "Bs17.50",
      penalizacion: "50%",
    },
    {
      id: 4,
      mesa: "Mesa Familiar 4",
      estado: "cancelada",
      fecha: "05/10/2025",
      hora: "10:00",
      duracion: "1 hora",
      precio: "Bs20",
      anticipo: "Bs5.00",
      penalizacion: "0%",
    },
  ]);

  const limpiarCanceladas = () => {
    setReservas(reservas.filter((r) => r.estado !== "cancelada"));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Mis Reservas</Text>

      <TouchableOpacity style={styles.btnLimpiar} onPress={limpiarCanceladas}>
        <Text style={styles.textoBtnLimpiar}>Limpiar Reservas Canceladas</Text>
      </TouchableOpacity>

      <ScrollView style={{ marginTop: 10 }}>
        {reservas.map((reserva) => (
          <View key={reserva.id} style={styles.card}>
            {/* Cabecera */}
            <View style={styles.cardHeader}>
              <Text style={styles.mesaNombre}>{reserva.mesa}</Text>

              <View
                style={[
                  styles.estadoEtiqueta,
                  reserva.estado === "pendiente" && { backgroundColor: Colores.amarillo },
                  reserva.estado === "enUso" && { backgroundColor: Colores.verde },
                  reserva.estado === "cancelada" && { backgroundColor: "#E0E0E0" },
                ]}
              >
                <Text
                  style={[
                    styles.estadoTexto,
                    reserva.estado === "pendiente" && { color: "#000" },
                  ]}
                >
                  {reserva.estado === "enUso"
                    ? "En uso"
                    : reserva.estado === "pendiente"
                    ? "Pendiente"
                    : "Cancelada"}
                </Text>
              </View>
            </View>

            {/* Datos */}
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color={Colores.azul} />
              <Text style={styles.infoTexto}>
                {reserva.fecha} | {reserva.hora}
              </Text>
            </View>

            <Text style={styles.infoTexto}>
              Duración: <Text style={styles.bold}>{reserva.duracion}</Text>
            </Text>
            <Text style={styles.infoTexto}>
              Anticipo pagado: <Text style={styles.bold}>{reserva.anticipo}</Text>
            </Text>

            {/* Precio */}
            <View style={styles.precioContainer}>
              <Text style={styles.precio}>{reserva.precio}</Text>
            </View>

            {/* Botones */}
            <View style={styles.botonesRow}>
              {reserva.estado === "pendiente" && (
                <TouchableOpacity style={[styles.boton, styles.botonVerde]}>
                  <Text style={styles.textoBoton}>Confirmar Reserva</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[styles.boton, styles.botonAzul]}>
                <Text style={styles.textoBoton}>Reprogramar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.boton, styles.botonRojo]}>
                <Text style={styles.textoBoton}>
                  Cancelar ({reserva.penalizacion} penalización)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// 💅 Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colores.grisFondo,
    padding: 12,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colores.azul,
    marginBottom: 10,
    textAlign: "center",
  },
  btnLimpiar: {
    backgroundColor: Colores.azulClaro,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  textoBtnLimpiar: {
    color: Colores.azul,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: Colores.blanco,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mesaNombre: {
    fontWeight: "bold",
    color: Colores.azul,
    fontSize: 16,
  },
  estadoEtiqueta: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  estadoTexto: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  infoTexto: {
    color: Colores.grisTexto,
    marginLeft: 4,
    fontSize: 13,
  },
  bold: {
    fontWeight: "bold",
    color: "#000",
  },
  precioContainer: {
    marginTop: 5,
    alignItems: "flex-end",
  },
  precio: {
    color: Colores.verde,
    fontWeight: "bold",
    fontSize: 15,
  },
  botonesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    flexWrap: "wrap",
  },
  boton: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: 4,
  },
  textoBoton: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
  botonVerde: { backgroundColor: Colores.verde },
  botonAzul: { backgroundColor: Colores.azul },
  botonRojo: { backgroundColor: Colores.rojo },
});
