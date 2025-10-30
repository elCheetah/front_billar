// devolver.tsx
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";

// ──────────────────────────────────────────────────────────────
// Paleta de colores
const Colores = {
  azul: "#0052FF",
  blanco: "#FFFFFF",
  rojo: "#E53935",
  grisClaro: "#E6E9FF",
  azulOscuro: "#002B80",
};

// ──────────────────────────────────────────────────────────────
// Modelo de datos
interface Reserva {
  id: number;
  cliente: string;
  local: string;
  mesaNumero: string;
  estado: "confirmed" | "canceled" | "pending";
  fecha: string;
  hora: string;
  duracion: string;
  precio: string;
  penalizacion: string;
  saldoTotal: string;
  montoPenalizado: string;
}

// ──────────────────────────────────────────────────────────────
export default function Devolver() {
  const router = useRouter();

  const [reservas] = useState<Reserva[]>([
    {
      id: 1,
      cliente: "juan carlos mamani",
      local: "Billiarcito",
      mesaNumero: "Mesa 1",
      estado: "canceled",
      fecha: "27/10/2025",
      hora: "18:00",
      duracion: "2 horas",
      precio: "Bs50",
      penalizacion: "50%",
      saldoTotal: "Bs50",
      montoPenalizado: "Bs25",
    },
    {
      id: 2,
      cliente: "ana maria quispe",
      local: "Billiarcito",
      mesaNumero: "Mesa 2",
      estado: "canceled",
      fecha: "28/10/2025",
      hora: "15:30",
      duracion: "1 hora",
      precio: "Bs25",
      penalizacion: "30%",
      saldoTotal: "Bs25",
      montoPenalizado: "Bs7.50",
    },
    {
      id: 3,
      cliente: "pedro luis torrez",
      local: "Billiarcito",
      mesaNumero: "Mesa 3",
      estado: "canceled",
      fecha: "29/10/2025",
      hora: "20:00",
      duracion: "3 horas",
      precio: "Bs70",
      penalizacion: "100%",
      saldoTotal: "Bs70",
      montoPenalizado: "Bs70",
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

  const handleBack = () => router.back();

  const handleDevolver = (reserva: Reserva) => {
    setSelectedReserva(reserva);
    setModalVisible(true);
  };

  const devolverDinero = () => {
    Alert.alert(
      "Devolución realizada",
      `Se devolvió Bs${selectedReserva?.montoPenalizado} a ${selectedReserva?.cliente.toUpperCase()}.`,
      [{ text: "OK", onPress: () => setModalVisible(false) }]
    );
  };

  const subirComprobante = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso denegado", "Necesitamos acceso a tu galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      Alert.alert("Éxito", "Comprobante subido correctamente.");
    }
  };

  const subirQR = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso denegado", "Necesitamos acceso a tu galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      Alert.alert("QR subido", "Código QR recibido correctamente.");
    }
  };

  const descargarQR = () => {
    Alert.alert(
      "QR Descargado",
      `Código QR para ${selectedReserva?.cliente.toUpperCase()} guardado en tu dispositivo.`
    );
  };

  const getMes = (fecha: string) => {
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const mes = parseInt(fecha.split("/")[1], 10) - 1;
    return meses[mes];
  };

  const reservasCanceladas = reservas.filter((r) => r.estado === "canceled");

  return (
    <View style={styles.container}>
      {/* Botón volver */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={Colores.azul} />
      </TouchableOpacity>

      <Text style={styles.titulo}>Devoluciones</Text>

      {/* MODAL */}
      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Devolución</Text>

            {/* Cliente */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>Cliente:</Text>
              <Text style={styles.infoValue}>
                {selectedReserva?.cliente.toUpperCase()}
              </Text>
            </View>

            {/* Monto */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>Monto a devolver:</Text>
              <Text style={styles.infoValue}>
                {selectedReserva?.montoPenalizado}
              </Text>
            </View>

            {/* QR CENTRADO + DESCARGAR DEBAJO */}
            <View style={styles.qrSection}>
              {/* QR CLICKEABLE (subir) */}
              <TouchableOpacity style={styles.qrTouchable} onPress={subirQR}>
                <View style={styles.qrWrapper}>
                  {/* IMAGEN DE QR REAL (NO VACÍA) */}
                  <Image
                    source={{
                      uri: "https://api.qrserver.com/v1/create-qr-code/?data=https://example.com&size=200x200.png", // QR lleno y legible
                    }}
                    style={{ width: 130, height: 130 }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.qrLabel}>Toca para subir QR</Text>
              </TouchableOpacity>

              {/* DESCARGAR QR */}
              <TouchableOpacity style={styles.downloadHint} onPress={descargarQR}>
                <Ionicons name="download-outline" size={16} color={Colores.azulOscuro} />
                <Text style={styles.downloadText}>Descargar QR</Text>
              </TouchableOpacity>
            </View>

            {/* 1. DEVOLVER DINERO */}
            <TouchableOpacity
              style={[styles.actionButtonModal, { backgroundColor: Colores.azul, marginTop: 20 }]}
              onPress={devolverDinero}
            >
              <Text style={styles.actionButtonText}>Devolver Dinero</Text>
            </TouchableOpacity>

            {/* 2. SUBIR COMPROBANTE */}
            <TouchableOpacity
              style={[styles.uploadButton, { marginTop: 12 }]}
              onPress={subirComprobante}
            >
              <Ionicons name="cloud-upload-outline" size={18} color={Colores.blanco} />
              <Text style={styles.uploadButtonText}>Subir comprobante</Text>
            </TouchableOpacity>

            {/* 3. CANCELAR */}
            <TouchableOpacity
              style={[styles.cancelButton, { marginTop: 15 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* LISTA DE RESERVAS */}
      <ScrollView style={styles.scrollView}>
        {reservasCanceladas.length === 0 ? (
          <Text style={styles.emptyText}>No hay reservas canceladas.</Text>
        ) : (
          reservasCanceladas.map((reserva) => (
            <View key={reserva.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.mesaNombre}>
                    {reserva.mesaNumero} / {reserva.local}
                  </Text>
                  <Text style={styles.clienteNombre}>
                    {reserva.cliente.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.estadoEtiquetaCompact}>
                  <Text style={styles.estadoTextoCompact}>Cancelado</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color={Colores.azul} />
                <Text style={styles.infoTexto}>
                  {reserva.fecha} | {reserva.hora}
                </Text>
              </View>

              <Text style={styles.infoTexto}>
                Mes: <Text style={styles.bold}>{getMes(reserva.fecha)}</Text>
              </Text>
              <Text style={styles.infoTexto}>
                Duración: <Text style={styles.bold}>{reserva.duracion}</Text>
              </Text>
              <Text style={styles.infoTexto}>
                Penalización: <Text style={styles.bold}>{reserva.penalizacion}</Text>
              </Text>
              <Text style={styles.infoTexto}>
                Saldo total: <Text style={styles.bold}>{reserva.saldoTotal}</Text>
              </Text>
              <Text style={styles.infoTexto}>
                Monto penalizado: <Text style={styles.bold}>{reserva.montoPenalizado}</Text>
              </Text>

              <Text style={styles.precio}>{reserva.precio}</Text>

              <View style={styles.buttonColumn}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: Colores.azul }]}
                  onPress={() => handleDevolver(reserva)}
                >
                  <Text style={styles.buttonText}>Devolver</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────
// ESTILOS
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
    marginTop: 20,
    marginBottom: 10,
  },
  scrollView: {
    marginTop: 10,
  },
  emptyText: {
    textAlign: "center",
    color: Colores.azulOscuro,
    fontSize: 15,
    marginTop: 20,
  },
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
    alignItems: "flex-start",
    marginBottom: 8,
  },
  mesaNombre: {
    fontWeight: "bold",
    color: Colores.azul,
    fontSize: 16,
  },
  clienteNombre: {
    fontSize: 13,
    color: Colores.azulOscuro,
    fontWeight: "600",
    marginTop: 2,
  },
  estadoEtiquetaCompact: {
    backgroundColor: Colores.rojo,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  estadoTextoCompact: {
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 11,
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
  bold: {
    fontWeight: "bold",
    color: Colores.azulOscuro,
  },
  precio: {
    color: Colores.azul,
    fontWeight: "bold",
    fontSize: 15,
    marginTop: 4,
    textAlign: "right",
  },
  buttonColumn: {
    marginTop: 10,
  },
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

  // MODAL
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
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colores.azul,
    textAlign: "center",
    marginBottom: 15,
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  infoLabel: {
    color: Colores.azulOscuro,
    fontSize: 14,
    fontWeight: "600",
  },
  infoValue: {
    color: Colores.azul,
    fontSize: 14,
    fontWeight: "bold",
  },

  // SECCIÓN QR
  qrSection: {
    alignItems: "center",
    width: "100%",
    marginTop: 15,
  },
  qrTouchable: {
    alignItems: "center",
  },
  qrWrapper: {
    backgroundColor: Colores.blanco,
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colores.azul,
    borderStyle: "dashed",
  },
  qrLabel: {
    marginTop: 6,
    fontSize: 13,
    color: Colores.azulOscuro,
    fontWeight: "600",
  },
  downloadHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  downloadText: {
    color: Colores.azulOscuro,
    fontSize: 13,
    marginLeft: 5,
    fontStyle: "italic",
    textDecorationLine: "underline",
  },

  // BOTONES
  actionButtonModal: {
    width: "100%",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionButtonText: {
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 16,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colores.azulOscuro,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
  },
  uploadButtonText: {
    color: Colores.blanco,
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 15,
  },
  cancelButton: {
    width: "100%",
    backgroundColor: Colores.rojo,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 15,
  },
});