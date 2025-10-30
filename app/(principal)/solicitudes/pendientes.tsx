import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// 🎨 Paleta de colores (oficial)
const Colores = {
  azul: "#0052FF",
  blanco: "#FFFFFF",
  rojo: "#E53935",
  grisClaro: "#E6E9FF",
  azulOscuro: "#002B80",
};

// 📋 Modelo de datos
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
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalCancelarVisible, setModalCancelarVisible] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reserva | null>(null);
  const [editingReserva, setEditingReserva] = useState<Reserva | null>(null);
  const [selectedHora, setSelectedHora] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [imagenQR, setImagenQR] = useState<string | null>(null);

  const horasDisponibles = ["10:00", "12:00", "14:00", "16:00", "18:00", "19:00"];

  const handleBack = () => router.back();

  // === MODAL EDITAR ===
  const handleEdit = (reserva: Reserva) => {
    setEditingReserva(reserva);
    setSelectedHora(reserva.hora);
    setModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (editingReserva && selectedHora) {
      const updated = reservas.map((r) =>
        r.id === editingReserva.id
          ? { ...r, hora: selectedHora, fecha: editingReserva.fecha }
          : r
      );
      setReservas(updated);
      setModalVisible(false);
      setEditingReserva(null);
    }
  };

  // === MODAL CANCELAR ===
  const handleCancel = (reserva: Reserva) => {
    setReservaSeleccionada(reserva);
    setImagenQR(null);
    setModalCancelarVisible(true);
  };

  // 📸 Subir imagen del QR
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Se necesita permiso para acceder a tus imágenes.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImagenQR(result.assets[0].uri);
    }
  };

  const confirmarCancelacion = () => {
    if (reservaSeleccionada) {
      setReservas((prev) =>
        prev.map((r) =>
          r.id === reservaSeleccionada.id
            ? { ...r, estado: "canceled", penalizacion: "50%" }
            : r
        )
      );
    }
    setModalCancelarVisible(false);
  };

  const reservasPendientes = reservas.filter((r) => r.estado === "pending");

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={Colores.azul} />
      </TouchableOpacity>

      <Text style={styles.titulo}>Billiarcito</Text>

      {/* === MODAL EDITAR === */}
      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Solicitud</Text>

            {/* FECHA */}
            <Text style={styles.modalLabel}>Fecha</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.modalInput}
            >
              <Text style={styles.modalInputText}>
                {editingReserva ? editingReserva.fecha : "Seleccionar fecha"}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={
                  editingReserva
                    ? new Date(
                        editingReserva.fecha.split("/").reverse().join("-")
                      )
                    : new Date()
                }
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate && editingReserva) {
                    setEditingReserva({
                      ...editingReserva,
                      fecha: selectedDate.toLocaleDateString("es-ES"),
                    });
                  }
                }}
              />
            )}

            {/* HORA */}
            <Text style={styles.modalLabel}>Hora</Text>
            <View style={styles.horasGrid}>
              {horasDisponibles.map((hora) => (
                <TouchableOpacity
                  key={hora}
                  onPress={() => setSelectedHora(hora)}
                  style={[
                    styles.horaBtn,
                    selectedHora === hora && styles.horaBtnSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.horaText,
                      selectedHora === hora && styles.horaTextSelected,
                    ]}
                  >
                    {hora}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* BOTONES */}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: Colores.azul }]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: Colores.azulOscuro }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* === MODAL CANCELAR NUEVO (con QR) === */}
      <Modal animationType="fade" transparent visible={modalCancelarVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalCancelContent}>
            <Text style={styles.modalCancelText}>
              50% se va penalizar {"\n"}
              Monto devolución: <Text style={{ fontWeight: "bold" }}>Bs20</Text> {"\n"}
              Para mayor información contactar:{" "}
              <Text style={{ fontWeight: "bold" }}>828483832</Text>
            </Text>

            {imagenQR && (
              <Image
                source={{ uri: imagenQR }}
                style={{ width: 180, height: 180, borderRadius: 10, marginBottom: 15 }}
              />
            )}

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={handlePickImage}
            >
              <Text style={styles.modalCancelButtonText}>
                {imagenQR ? "Cambiar QR" : "Subir QR"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalSaveButton,
                { opacity: imagenQR ? 1 : 0.6 },
              ]}
              disabled={!imagenQR}
              onPress={confirmarCancelacion}
            >
              <Text style={styles.modalSaveButtonText}>Guardar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalCancelarVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* === LISTA DE PENDIENTES === */}
      <ScrollView style={styles.scrollView}>
        {reservasPendientes.map((reserva) => (
          <View key={reserva.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.mesaNombre}>
                  {reserva.mesaNumero} / Tipo - {reserva.local}
                </Text>
              </View>
              <View style={styles.estadoEtiqueta}>
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
              Penalización:{" "}
              <Text style={styles.bold}>{reserva.penalizacion}</Text>
            </Text>

            <Text style={styles.precio}>{reserva.precio}</Text>

            <View style={styles.buttonColumn}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colores.azul }]}
                onPress={() => handleEdit(reserva)}
              >
                <Text style={styles.buttonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colores.rojo }]}
                onPress={() => handleCancel(reserva)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// === ESTILOS ===
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
  scrollView: { marginTop: 10 },
  card: {
    backgroundColor: Colores.blanco,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    elevation: 3,
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
    backgroundColor: Colores.azul,
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
    marginBottom: 4,
  },
  infoTexto: {
    color: Colores.azul,
    fontSize: 13,
    marginLeft: 5,
  },
  bold: { fontWeight: "bold", color: Colores.azul },
  precio: {
    color: Colores.azul,
    fontWeight: "bold",
    fontSize: 15,
    marginTop: 4,
    textAlign: "right",
  },
  buttonColumn: { marginTop: 10, gap: 10 },
  actionButton: {
    width: "100%",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 16,
  },

  // === MODAL EDITAR ===
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: Colores.blanco,
    borderRadius: 10,
    padding: 20,
    width: "85%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colores.azul,
    textAlign: "center",
    marginBottom: 15,
  },
  modalLabel: {
    color: Colores.azul,
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 10,
    marginBottom: 5,
  },
  horasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  horaBtn: {
    backgroundColor: Colores.grisClaro,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  horaBtnSelected: { backgroundColor: Colores.azul },
  horaText: { color: Colores.azulOscuro },
  horaTextSelected: { color: Colores.blanco, fontWeight: "bold" },
  modalInput: {
    borderWidth: 1,
    borderColor: Colores.azul,
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  modalInputText: { color: Colores.azul },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalButtonText: {
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 15,
  },

  // === MODAL CANCELAR (con QR) ===
  modalCancelContent: {
    backgroundColor: Colores.blanco,
    borderRadius: 10,
    padding: 25,
    width: "85%",
    alignItems: "center",
  },
  modalCancelText: {
    color: Colores.azulOscuro,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  modalCancelButton: {
    backgroundColor: Colores.azul,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalCancelButtonText: {
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 15,
  },
  modalSaveButton: {
    backgroundColor: "#00B050",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalSaveButtonText: {
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 15,
  },
  modalCloseButton: {
    backgroundColor: Colores.rojo,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  modalCloseButtonText: {
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 14,
  },
});
