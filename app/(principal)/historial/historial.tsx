import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Platform,
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
  verde: "#28A745",
  rojo: "#DC3545",
  amarillo: "#FFC107",
  grisFondo: "#F5F9FF",
  grisTexto: "#666",
  blanco: "#FFFFFF",
};

// 📋 Datos de ejemplo
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

export default function Historial() {
  const router = useRouter();

  // State for reservations
  const [reservas] = useState<Reserva[]>([
    {
      id: 1,
      local: "Billiarcito",
      mesaNumero: "Mesa 1",
      estado: "confirmed",
      fecha: "20/10/2025",
      hora: "18:00",
      duracion: "2 horas",
      precio: "Bs50",
      penalizacion: "0%",
    },
    {
      id: 2,
      local: "Billiarcito",
      mesaNumero: "Mesa 2",
      estado: "canceled",
      fecha: "15/10/2025",
      hora: "16:00",
      duracion: "2 horas",
      precio: "Bs70",
      penalizacion: "50%",
    },
    {
      id: 3,
      local: "Billiarcito",
      mesaNumero: "Mesa 3",
      estado: "confirmed",
      fecha: "25/10/2025",
      hora: "14:00",
      duracion: "1 hora",
      precio: "Bs20",
      penalizacion: "0%",
    },
  ]);

  // State for date range filter
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(undefined);
  const [fechaFin, setFechaFin] = useState<Date | undefined>(undefined);
  const [showInicioPicker, setShowInicioPicker] = useState(false);
  const [showFinPicker, setShowFinPicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Find the earliest reservation date
  const earliestReservationDate = reservas
    .map((reserva) => new Date(reserva.fecha.split("/").reverse().join("-")))
    .reduce((earliest, current) => (earliest < current ? earliest : current), new Date());

  // Filter reservations based on date range, including both confirmed and canceled
  const reservasFiltradas = reservas.filter((reserva) => {
    const fechaReserva = new Date(reserva.fecha.split("/").reverse().join("-"));
    
    // Ensure valid date
    if (isNaN(fechaReserva.getTime())) return false;

    const inicio = fechaInicio ? new Date(fechaInicio.setHours(0, 0, 0, 0)) : null;
    const fin = fechaFin ? new Date(fechaFin.setHours(23, 59, 59, 999)) : null;

    // Include reservations within the date range (or all if no range is set)
    const isWithinRange =
      (!inicio || fechaReserva >= inicio) && (!fin || fechaReserva <= fin);

    // Explicitly include both confirmed (Finalizada) and canceled reservations
    return isWithinRange && (reserva.estado === "confirmed" || reserva.estado === "canceled");
  });

  const handleBack = () => {
    router.back();
  };

  // Placeholder for PDF export
  const handleExportPDF = () => {
    alert("Exportar a PDF no implementado aún. Usa una librería como expo-file-system.");
  };

  // Handle date picker changes for start date
  const onChangeInicio = (event: any, selectedDate?: Date) => {
    setShowInicioPicker(Platform.OS === "ios");
    if (selectedDate) {
      // Normalize dates to start of day for comparison
      const normalizedSelectedDate = new Date(selectedDate.setHours(0, 0, 0, 0));
      const normalizedEarliestDate = new Date(earliestReservationDate.setHours(0, 0, 0, 0));

      // Validate that the selected date is not earlier than the earliest reservation
      if (normalizedSelectedDate < normalizedEarliestDate) {
        setErrorMessage(
          `La fecha no puede ser anterior a la primera reserva (${earliestReservationDate.toLocaleDateString()}).`
        );
        return;
      }
      setErrorMessage("");
      setFechaInicio(selectedDate);
    }
  };

  // Handle date picker changes for end date
  const onChangeFin = (event: any, selectedDate?: Date) => {
    setShowFinPicker(Platform.OS === "ios");
    if (selectedDate) setFechaFin(selectedDate);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={Colores.azul} />
      </TouchableOpacity>

      {/* App title */}
      <Text style={styles.titulo}>Billarcito</Text>

      {/* Date Range Filter with Titles and DatePickers */}
      <View style={styles.filterContainer}>
        <View style={styles.dateSection}>
          <Text style={styles.dateTitle}>Fecha Inicio</Text>
          <TouchableOpacity onPress={() => setShowInicioPicker(true)} style={styles.dateInput}>
            <Text style={styles.dateText}>
              {fechaInicio ? fechaInicio.toLocaleDateString() : "Seleccionar"}
            </Text>
          </TouchableOpacity>
          {showInicioPicker && (
            <DateTimePicker
              value={fechaInicio || new Date()}
              mode="date"
              display="default"
              onChange={onChangeInicio}
              style={styles.datePicker}
              minimumDate={earliestReservationDate} // Allow earliest reservation date
            />
          )}
        </View>
        <View style={styles.dateSection}>
          <Text style={styles.dateTitle}>Fecha Fin</Text>
          <TouchableOpacity onPress={() => setShowFinPicker(true)} style={styles.dateInput}>
            <Text style={styles.dateText}>
              {fechaFin ? fechaFin.toLocaleDateString() : "Seleccionar"}
            </Text>
          </TouchableOpacity>
          {showFinPicker && (
            <DateTimePicker
              value={fechaFin || new Date()}
              mode="date"
              display="default"
              onChange={onChangeFin}
              style={styles.datePicker}
            />
          )}
        </View>
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <ScrollView style={styles.scrollView}>
        {reservasFiltradas.map((reserva) => (
          <View key={reserva.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.mesaNombre}>{reserva.mesaNumero} / Tipo - {reserva.local}</Text>
              </View>
              <View
                style={[
                  styles.estadoEtiqueta,
                  reserva.estado === "confirmed" ? { backgroundColor: Colores.verde } : { backgroundColor: Colores.rojo },
                ]}
              >
                <Text style={styles.estadoTexto}>
                  {reserva.estado === "confirmed" ? "Finalizada" : "Cancelada"}
                </Text>
              </View>
            </View>

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
              Penalización: <Text style={styles.bold}>{reserva.penalizacion || "0%"}</Text>
            </Text>

            <View style={styles.precioContainer}>
              <Text style={styles.precio}>{reserva.precio}</Text>
            </View>

            <TouchableOpacity style={styles.pdfButton} onPress={handleExportPDF}>
              <Ionicons name="document" size={20} color={Colores.azul} />
              <Text style={styles.pdfText}>Exportar PDF</Text>
            </TouchableOpacity>
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
    marginBottom: 10,
    textAlign: "center",
    marginTop: 40,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  dateSection: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateTitle: {
    fontSize: 14,
    color: Colores.grisTexto,
    marginBottom: 5,
  },
  dateInput: {
    height: 40,
    borderColor: Colores.grisTexto,
    borderWidth: 1,
    borderRadius: 5,
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: Colores.blanco,
  },
  dateText: {
    color: Colores.grisTexto,
  },
  datePicker: {
    width: "100%",
  },
  errorText: {
    color: Colores.rojo,
    fontSize: 12,
    marginBottom: 10,
    textAlign: "center",
  },
  scrollView: {
    marginTop: 10,
  },
  card: {
    backgroundColor: Colores.blanco,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mesaNombre: {
    fontWeight: "700",
    color: "#0033A0",
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
    marginTop: 6,
  },
  infoTexto: {
    color: Colores.grisTexto,
    marginLeft: 4,
    fontSize: 12,
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
  pdfButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 8,
    padding: 5,
  },
  pdfText: {
    color: Colores.azul,
    fontSize: 14,
    marginLeft: 5,
  },
});