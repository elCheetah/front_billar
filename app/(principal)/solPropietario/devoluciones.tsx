// app/(principal)/devolver.tsx
import { api } from "@/components/api";
import ConfirmModal from "@/components/modals/ConfirmModal";
import ResultModal from "@/components/modals/ResultModal";
import { getToken } from "@/utils/authStorage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Colores = {
  azul: "#0052FF",
  blanco: "#FFFFFF",
  rojo: "#E53935",
  grisClaro: "#E6E9FF",
  azulOscuro: "#002B80",
};

type EstadoReserva = "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "FINALIZADA";

interface Devolucion {
  id_reserva: number;
  id_pago: number;
  nombre_cliente: string;
  nombre_local: string;
  numero_mesa: number;
  fecha: string; // dd/mm/yyyy
  hora: string; // HH:mm
  duracion: string; // "X horas"
  monto_total_pagado: number;
  monto_penalizado: number;
  monto_total_devolver: number;
  estado_reserva: EstadoReserva | string;
  qr_cliente_url: string;
}

function formatearFecha(fechaInput: any): string {
  if (!fechaInput) return "";
  let iso = "";
  if (typeof fechaInput === "string") {
    iso = fechaInput.slice(0, 10);
  } else if (fechaInput instanceof Date) {
    iso = fechaInput.toISOString().slice(0, 10);
  } else {
    iso = String(fechaInput).slice(0, 10);
  }
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatearHora(horaInput: any): string {
  if (!horaInput) return "";
  if (typeof horaInput === "string") {
    const soloHora = horaInput.length >= 5 ? horaInput.slice(0, 5) : horaInput;
    return soloHora;
  }
  if (horaInput instanceof Date) {
    return horaInput.toISOString().slice(11, 16);
  }
  const str = String(horaInput);
  return str.length >= 5 ? str.slice(0, 5) : str;
}

export default function Devolver() {
  const router = useRouter();

  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<Devolucion | null>(null);

  const [comprobantePreview, setComprobantePreview] = useState<string | null>(
    null
  );
  const [comprobanteBase64, setComprobanteBase64] = useState<string | null>(
    null
  );
  const [registrandoReembolso, setRegistrandoReembolso] = useState(false);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [resultType, setResultType] = useState<"success" | "error">("success");
  const [resultTitle, setResultTitle] = useState("");
  const [resultMessage, setResultMessage] = useState("");

  const handleBack = () => router.back();

  const mostrarResultado = (
    type: "success" | "error",
    title: string,
    message: string
  ) => {
    setResultType(type);
    setResultTitle(title);
    setResultMessage(message);
    setResultVisible(true);
  };

  const cargarDevoluciones = useCallback(async () => {
    try {
      setCargandoLista(true);
      const token = await getToken();
      if (!token) {
        mostrarResultado(
          "error",
          "Sesión no disponible",
          "No se encontró un token de autenticación. Vuelve a iniciar sesión."
        );
        return;
      }

      const json = await api("/devoluciones/pendientes", { token });
      const lista = (json?.devoluciones ?? []) as any[];

      const mapeadas: Devolucion[] = lista.map((r) => {
        const fecha = formatearFecha(r.fecha_reserva);
        const hora = formatearHora(r.hora_inicio);
        const duracionHoras = Number(r.duracion_horas ?? 0);
        const duracion =
          duracionHoras === 1 ? "1 hora" : `${duracionHoras} horas`;

        const monto_total_pagado = Number(r.monto_total_pagado ?? 0);
        const monto_penalizado = Number(r.monto_penalizado ?? 0);
        const monto_total_devolver = Number(r.monto_total_devolver ?? 0);

        return {
          id_reserva: r.id_reserva,
          id_pago: r.id_pago,
          nombre_cliente: r.nombre_cliente,
          nombre_local: r.nombre_local,
          numero_mesa: r.numero_mesa,
          fecha,
          hora,
          duracion,
          monto_total_pagado,
          monto_penalizado,
          monto_total_devolver,
          estado_reserva: r.estado_reserva,
          qr_cliente_url: r.qr_cliente_url || "",
        };
      });

      setDevoluciones(mapeadas);
    } catch (error: any) {
      console.error("Error al cargar devoluciones pendientes:", error);
      mostrarResultado(
        "error",
        "Error al cargar devoluciones",
        error?.message ||
          "No se pudieron obtener las devoluciones pendientes. Intenta nuevamente."
      );
    } finally {
      setCargandoLista(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarDevoluciones();
    }, [cargarDevoluciones])
  );

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await cargarDevoluciones();
    } finally {
      setRefreshing(false);
    }
  }, [cargarDevoluciones]);

  const abrirModal = (dev: Devolucion) => {
    setSelected(dev);
    setComprobantePreview(null);
    setComprobanteBase64(null);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    if (registrandoReembolso) return;
    setModalVisible(false);
    setSelected(null);
    setComprobantePreview(null);
    setComprobanteBase64(null);
  };

  const subirComprobante = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        mostrarResultado(
          "error",
          "Permiso requerido",
          "Se necesita permiso para acceder a la galería de imágenes."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets.length) return;

      const asset = result.assets[0];
      if (!asset.base64) {
        mostrarResultado(
          "error",
          "Imagen no válida",
          "No se pudo obtener el contenido de la imagen seleccionada."
        );
        return;
      }

      const dataUri = `data:image/jpeg;base64,${asset.base64}`;
      setComprobantePreview(asset.uri ?? dataUri);
      setComprobanteBase64(dataUri);
    } catch (error: any) {
      console.error("Error al seleccionar comprobante:", error);
      mostrarResultado(
        "error",
        "Error al seleccionar imagen",
        error?.message ||
          "Ocurrió un problema al seleccionar el comprobante. Intenta nuevamente."
      );
    }
  };

  const limpiarComprobante = () => {
    if (registrandoReembolso) return;
    setComprobantePreview(null);
    setComprobanteBase64(null);
  };

  const handleDescargarQR = async () => {
    if (!selected?.qr_cliente_url) {
      mostrarResultado(
        "error",
        "QR no disponible",
        "No se encontró un código QR registrado para esta reserva."
      );
      return;
    }
    try {
      await Linking.openURL(selected.qr_cliente_url);
    } catch {
      mostrarResultado(
        "error",
        "No se pudo abrir el QR",
        "Ocurrió un problema al intentar abrir el código QR."
      );
    }
  };

  const solicitarConfirmacionReembolso = () => {
    if (!selected) return;
    if (!comprobanteBase64) {
      mostrarResultado(
        "error",
        "Comprobante requerido",
        "Debes seleccionar el comprobante de reembolso antes de registrar la devolución."
      );
      return;
    }
    setConfirmVisible(true);
  };

  const confirmarReembolso = async () => {
    if (!selected || !comprobanteBase64 || registrandoReembolso) {
      setConfirmVisible(false);
      return;
    }

    try {
      setConfirmVisible(false);
      setRegistrandoReembolso(true);

      const resp = await api(
        `/devoluciones/reembolsar/${selected.id_reserva}`,
        {
          method: "PATCH",
          body: {
            comprobante_reembolso_base64: comprobanteBase64,
          },
        }
      );

      await cargarDevoluciones();
      cerrarModal();

      mostrarResultado(
        "success",
        "Reembolso registrado",
        resp?.message ||
          "El reembolso se registró correctamente y la reserva fue marcada como reembolsada."
      );
    } catch (error: any) {
      console.error("Error al registrar reembolso:", error);
      mostrarResultado(
        "error",
        "Error al registrar reembolso",
        error?.message ||
          "Ocurrió un error al registrar el reembolso. Verifica el comprobante e intenta nuevamente."
      );
    } finally {
      setRegistrandoReembolso(false);
    }
  };

  const devolucionesPendientes = devoluciones;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={Colores.azul} />
      </TouchableOpacity>

      <Text style={styles.titulo}>Devoluciones</Text>

      {/* MODAL REGISTRAR REEMBOLSO */}
      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar reembolso</Text>

            {selected && (
              <>
                {/* SOLO MONTOS */}
                <View style={styles.infoRowModal}>
                  <Text style={styles.infoLabel}>Total pagado:</Text>
                  <Text style={styles.infoValue}>
                    Bs{selected.monto_total_pagado.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.infoRowModal}>
                  <Text style={styles.infoLabel}>Monto penalizado:</Text>
                  <Text style={styles.infoValue}>
                    Bs{selected.monto_penalizado.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.infoRowModal}>
                  <Text style={styles.infoLabel}>Monto a devolver:</Text>
                  <Text style={styles.infoValueDestacado}>
                    Bs{selected.monto_total_devolver.toFixed(2)}
                  </Text>
                </View>

                <View className="separator" style={styles.separator} />

                {/* QR DEL CLIENTE (SOLO VER / DESCARGAR) */}
                <Text style={styles.sectionTitle}>QR del cliente</Text>
                {selected.qr_cliente_url ? (
                  <>
                    <View style={styles.qrWrapper}>
                      <Image
                        source={{ uri: selected.qr_cliente_url }}
                        style={styles.qrImage}
                        resizeMode="contain"
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.qrDownloadButton}
                      onPress={handleDescargarQR}
                      disabled={registrandoReembolso}
                    >
                      <Ionicons
                        name="download-outline"
                        size={18}
                        color={Colores.azulOscuro}
                      />
                      <Text style={styles.qrDownloadText}>
                        Abrir / descargar QR
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.qrMissingText}>
                    No se registró un código QR para esta reserva.
                  </Text>
                )}

                {/* COMPROBANTE DE REEMBOLSO (SUBIR + (X)) */}
                <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
                  Comprobante de reembolso
                </Text>

                {comprobantePreview ? (
                  <View style={styles.comprobanteWrapper}>
                    <Image
                      source={{ uri: comprobantePreview }}
                      style={styles.comprobanteImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.comprobanteRemoveButton}
                      onPress={limpiarComprobante}
                      disabled={registrandoReembolso}
                    >
                      <Ionicons
                        name="close-circle"
                        size={24}
                        color={Colores.rojo}
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.qrMissingText}>
                    Aún no se ha seleccionado el comprobante de reembolso.
                  </Text>
                )}

                <TouchableOpacity
                  style={[styles.uploadButton, { marginTop: 10 }]}
                  onPress={subirComprobante}
                  disabled={registrandoReembolso}
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={18}
                    color={Colores.blanco}
                  />
                  <Text style={styles.uploadButtonText}>
                    {comprobantePreview
                      ? "Cambiar comprobante"
                      : "Subir comprobante"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.actionButtonModal,
                      {
                        backgroundColor: Colores.azul,
                        opacity:
                          comprobanteBase64 && !registrandoReembolso ? 1 : 0.6,
                      },
                    ]}
                    onPress={solicitarConfirmacionReembolso}
                    disabled={!comprobanteBase64 || registrandoReembolso}
                  >
                    <Text style={styles.actionButtonText}>
                      {registrandoReembolso
                        ? "Registrando..."
                        : "Registrar reembolso"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cancelButton, { marginTop: 10 }]}
                    onPress={cerrarModal}
                    disabled={registrandoReembolso}
                  >
                    <Text style={styles.cancelButtonText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* CONFIRM / RESULT MODALS */}
      <ConfirmModal
        visible={confirmVisible}
        title="Confirmar registro de reembolso"
        message={
          selected
            ? `¿Deseas registrar el reembolso de Bs${selected.monto_total_devolver.toFixed(
                2
              )}?\n\nEsta acción marcará la reserva como reembolsada.`
            : ""
        }
        onCancel={() => setConfirmVisible(false)}
        onConfirm={confirmarReembolso}
        confirmText="Sí, registrar"
        cancelText="No"
      />

      <ResultModal
        visible={resultVisible}
        type={resultType}
        title={resultTitle}
        message={resultMessage}
        buttonText="Aceptar"
        onClose={() => setResultVisible(false)}
      />

      {/* LISTA DE DEVOLUCIONES PENDIENTES */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colores.azul]}
            tintColor={Colores.azul}
          />
        }
      >
        {cargandoLista && devolucionesPendientes.length === 0 ? (
          <Text style={styles.emptyText}>Cargando devoluciones...</Text>
        ) : devolucionesPendientes.length === 0 ? (
          <Text style={styles.emptyText}>
            No hay devoluciones pendientes de reembolso.
          </Text>
        ) : (
          devolucionesPendientes.map((dev) => (
            <View key={dev.id_reserva} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.mesaNombre}>
                    Mesa {dev.numero_mesa} / {dev.nombre_local}
                  </Text>
                  <Text style={styles.clienteNombre}>
                    {dev.nombre_cliente.toUpperCase()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.estadoEtiquetaCompact,
                    dev.estado_reserva === "CANCELADA" && {
                      backgroundColor: Colores.rojo,
                    },
                  ]}
                >
                  <Text style={styles.estadoTextoCompact}>
                    {dev.estado_reserva}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={Colores.azul}
                />
                <Text style={styles.infoTexto}>
                  {dev.fecha} | {dev.hora}
                </Text>
              </View>

              <Text style={styles.infoTexto}>
                Duración: <Text style={styles.bold}>{dev.duracion}</Text>
              </Text>

              <Text style={styles.infoTexto}>
                Monto total pagado:{" "}
                <Text style={styles.bold}>
                  Bs{dev.monto_total_pagado.toFixed(2)}
                </Text>
              </Text>
              <Text style={styles.infoTexto}>
                Monto penalizado:{" "}
                <Text style={styles.bold}>
                  Bs{dev.monto_penalizado.toFixed(2)}
                </Text>
              </Text>
              <Text style={styles.infoTexto}>
                Monto a devolver:{" "}
                <Text style={styles.boldDestacado}>
                  Bs{dev.monto_total_devolver.toFixed(2)}
                </Text>
              </Text>

              <View style={styles.buttonColumn}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: Colores.azul },
                  ]}
                  onPress={() => abrirModal(dev)}
                >
                  <Text style={styles.buttonText}>Ver detalle / devolver</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: Colores.azul,
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
  boldDestacado: {
    fontWeight: "bold",
    color: Colores.rojo,
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
    width: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colores.azul,
    textAlign: "center",
    marginBottom: 15,
  },
  infoRowModal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
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
  infoValueDestacado: {
    color: Colores.rojo,
    fontSize: 14,
    fontWeight: "bold",
  },
  sectionTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
    color: Colores.azulOscuro,
  },
  separator: {
    height: 1,
    backgroundColor: Colores.grisClaro,
    marginVertical: 8,
  },

  qrWrapper: {
    alignItems: "center",
    marginTop: 8,
  },
  qrImage: {
    width: 160,
    height: 160,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colores.azul,
  },
  qrMissingText: {
    marginTop: 6,
    fontSize: 13,
    color: Colores.azulOscuro,
  },
  qrDownloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  qrDownloadText: {
    marginLeft: 6,
    color: Colores.azulOscuro,
    fontSize: 13,
    textDecorationLine: "underline",
    fontWeight: "600",
  },

  comprobanteWrapper: {
    marginTop: 8,
    alignItems: "center",
  },
  comprobanteImage: {
    width: 180,
    height: 180,
    borderRadius: 10,
  },
  comprobanteRemoveButton: {
    position: "absolute",
    top: -8,
    right: 10,
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

  modalButtonContainer: {
    marginTop: 18,
  },
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
