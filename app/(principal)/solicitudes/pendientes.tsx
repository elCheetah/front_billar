import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// 🎨 Paleta de colores (limited to blue, white, and black)
const Colores = {
  azul: "#0052FF",
  blanco: "#FFFFFF",
  negro: "#000000",
};

// 📋 Reserva interface
interface Reserva {
  id: number;
  local: string;
  mesaNumero: string;
  estado: "confirmed" | "canceled" | "pending";
  fecha: string;
  hora: string;
  duracion: string;
  precio: string;
  penalizacion: string;
}

export default function PendingReservations() {
  const router = useRouter();

  // State for reservations
  const [reservas, setReservas] = useState<Reserva[]>([
    {
      id: 1,
      local: "Billiarcito",
      mesaNumero: "Mesa 1",
      estado: "pending",
      fecha: "27/10/2025",
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
      estado: "pending",
      fecha: "28/10/2025",
      hora: "14:00",
      duracion: "1 hora",
      precio: "Bs20",
      penalizacion: "0%",
    },
    {
      id: 4,
      local: "Billiarcito",
      mesaNumero: "Mesa 4",
      estado: "confirmed",
      fecha: "25/10/2025",
      hora: "14:00",
      duracion: "1 hora",
      precio: "Bs20",
      penalizacion: "0%",
    },
  ]);

  // State for edit modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReserva, setEditingReserva] = useState<Reserva | null>(null);
  const [newFecha, setNewFecha] = useState<Date | undefined>(undefined);
  const [newHora, setNewHora] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Find the earliest reservation date
  const earliestReservationDate = reservas
    .map((reserva) => new Date(reserva.fecha.split("/").reverse().join("-")))
    .reduce((earliest, current) => (earliest < current ? earliest : current), new Date());

  // Filter only pending reservations
  const reservasPendientes = reservas.filter((reserva) => reserva.estado === "pending");

  const handleBack = () => {
    router.back();
  };

  // Open edit modal
  const handleEdit = (reserva: Reserva) => {
    setEditingReserva(reserva);
    setNewFecha(new Date(reserva.fecha.split("/").reverse().join("-")));
    setNewHora(new Date(`1970-01-01T${reserva.hora}:00`));
    setModalVisible(true);
  };

  // Handle date picker change
  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      const normalizedSelectedDate = new Date(selectedDate.setHours(0, 0, 0, 0));
      const normalizedEarliestDate = new Date(earliestReservationDate.setHours(0, 0, 0, 0));
      if (normalizedSelectedDate < normalizedEarliestDate) {
        setErrorMessage(
          `La fecha no puede ser anterior a la primera reserva (${earliestReservationDate.toLocaleDateString()}).`
        );
        return;
      }
      setErrorMessage("");
      setNewFecha(selectedDate);
    }
  };

  // Handle time picker change
  const onChangeTime = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) setNewHora(selectedTime);
  };

  // Save edited reservation
  const handleSaveEdit = () => {
    if (editingReserva && newFecha && newHora) {
      const updatedReservas = reservas.map((reserva) =>
        reserva.id === editingReserva.id
          ? {
              ...reserva,
              fecha: newFecha.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }),
              hora: newHora.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }
          : reserva
      );
      setReservas(updatedReservas);
      setModalVisible(false);
      setEditingReserva(null);
      setNewFecha(undefined);
      setNewHora(undefined);
      setErrorMessage("");
    }
  };

  // Handle cancel action with confirmation
  const handleCancel = (id: number) => {
    Alert.alert(
      "Confirmar Cancelación",
      "¿Está seguro de cancelar esta solicitud?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Sí",
          onPress: () => {
            setReservas(
              reservas.map((reserva) =>
                reserva.id === id
                  ? { ...reserva, estado: "canceled", penalizacion: "50%" }
                  : reserva
              )
            );
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={Colores.azul} />
      </TouchableOpacity>

      {/* App title */}
      <Text style={styles.titulo}>Billarcito</Text>

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Solicitud</Text>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Fecha</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.modalInput}
              >
                <Text style={styles.modalInputText}>
                  {newFecha ? newFecha.toLocaleDateString() : "Seleccionar"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={newFecha || new Date()}
                  mode="date"
                  display="default"
                  onChange={onChangeDate}
                  minimumDate={earliestReservationDate}
                />
              )}
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Hora</Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={styles.modalInput}
              >
                <Text style={styles.modalInputText}>
                  {newHora
                    ? newHora.toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Seleccionar"}
                </Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={newHora || new Date()}
                  mode="time"
                  display="default"
                  onChange={onChangeTime}
                />
              )}
            </View>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: Colores.azul }]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: Colores.negro }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.scrollView}>
        {reservasPendientes.length === 0 ? (
          <Text style={styles.noReservationsText}>No hay solicitudes pendientes.</Text>
        ) : (
          reservasPendientes.map((reserva) => (
            <View key={reserva.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.mesaNombre}>
                    {reserva.mesaNumero} / Tipo - {reserva.local}
                  </Text>
                </View>
                <View style={[styles.estadoEtiqueta, { backgroundColor: Colores.azul }]}>
                  <Text style={styles.estadoTexto}>Pendiente</Text>
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

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: Colores.azul }]}
                  onPress={() => handleEdit(reserva)}
                >
                  <Text style={styles.buttonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: Colores.negro }]}
                  onPress={() => handleCancel(reserva.id)}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// 💅 Estilos
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
    marginBottom: 10,
    textAlign: "center",
    marginTop: 40,
  },
  scrollView: {
    marginTop: 10,
  },
  noReservationsText: {
    fontSize: 16,
    color: Colores.negro,
    textAlign: "center",
    marginTop: 20,
  },
  card: {
    backgroundColor: Colores.blanco,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    elevation: 3,
    shadowColor: Colores.negro,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mesaNombre: {
    fontWeight: "700",
    color: Colores.negro,
    fontSize: 16,
  },
  estadoEtiqueta: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  estadoTexto: {
    color: Colores.blanco,
    fontSize: 12,
    fontWeight: "bold",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  infoTexto: {
    color: Colores.negro,
    marginLeft: 4,
    fontSize: 12,
  },
  bold: {
    fontWeight: "bold",
    color: Colores.negro,
  },
  precioContainer: {
    marginTop: 5,
    alignItems: "flex-end",
  },
  precio: {
    color: Colores.azul,
    fontWeight: "bold",
    fontSize: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 10,
  },
  actionButton: {
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonText: {
    color: Colores.blanco,
    fontSize: 14,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: Colores.blanco,
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colores.negro,
    marginBottom: 15,
  },
  modalField: {
    width: "100%",
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 14,
    color: Colores.negro,
    marginBottom: 5,
  },
  modalInput: {
    height: 40,
    borderColor: Colores.negro,
    borderWidth: 1,
    borderRadius: 5,
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: Colores.blanco,
  },
  modalInputText: {
    color: Colores.negro,
    fontSize: 14,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 5,
    paddingVertical: 10,
    marginHorizontal: 5,
    alignItems: "center",
  },
  modalButtonText: {
    color: Colores.blanco,
    fontSize: 14,
    fontWeight: "bold",
  },
  errorText: {
    color: Colores.negro,
    fontSize: 12,
    marginBottom: 10,
    textAlign: "center",
  },
});