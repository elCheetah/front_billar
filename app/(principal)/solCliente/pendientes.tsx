// app/(principal)/solicitudes/misReservas.tsx
import { api } from "@/components/api";
import ConfirmModal from "@/components/modals/ConfirmModal";
import ResultModal from "@/components/modals/ResultModal";
import { getToken } from "@/utils/authStorage";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Image,
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

interface Reserva {
  id: number;
  idMesa: number;
  local: string;
  mesaNumero: string;
  tipoMesa: string;
  estado: string;
  fecha: string; // dd/mm/yyyy (solo para mostrar, ORIGINAL)
  hora: string; // HH:mm (solo para mostrar, ORIGINAL)
  duracion: string;
  duracionHoras: number;
  precio: string; // "BsXX.XX" mostrado
  penalizacion: string;
  montoDevolucion: string; // "BsXX.XX" mostrado
  celularAdmin: string;
  montoPagadoNumero: number; // valor numerico tal cual backend
  montoDevolucionNumero: number; // valor numerico tal cual backend
}

const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

export default function PendingReservations() {
  const router = useRouter();

  const [reservas, setReservas] = useState<Reserva[]>([]);

  // Modal de edición
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReserva, setEditingReserva] = useState<Reserva | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
  const [fechaNuevaLabel, setFechaNuevaLabel] = useState<string | null>(null);

  // Horas disponibles para la mesa/fecha seleccionada
  const [horasDisponibles, setHorasDisponibles] = useState<string[]>([]);
  const [cargandoHoras, setCargandoHoras] = useState(false);
  const [horasSel, setHorasSel] = useState<string[]>([]);
  const [selectedHora, setSelectedHora] = useState<string | null>(null);

  // Modal de cancelación
  const [modalCancelarVisible, setModalCancelarVisible] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] =
    useState<Reserva | null>(null);
  const [imagenQR, setImagenQR] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);

  // Modales de confirm/result
  const [confirmVisible, setConfirmVisible] = useState(false); // para CANCELAR
  const [confirmEditVisible, setConfirmEditVisible] = useState(false); // para EDITAR
  const [resultVisible, setResultVisible] = useState(false);
  const [resultType, setResultType] = useState<"success" | "error">("success");
  const [resultTitle, setResultTitle] = useState("");
  const [resultMessage, setResultMessage] = useState("");

  // Pull to refresh
  const [refreshing, setRefreshing] = useState(false);

  const handleBack = () => router.back();

  // Cargar reservas del backend (MOSTRANDO EXACTAMENTE LO QUE VIENE DE BD)
  const cargarReservas = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const data = await api("/misReservas", { token });
      const lista = (data?.reservas ?? []) as any[];

      const mapeadas: Reserva[] = lista.map((r) => {
        // fecha_reserva -> dd/mm/yyyy
        let fechaISO = "";
        if (typeof r.fecha_reserva === "string") {
          fechaISO = r.fecha_reserva;
        } else if (r.fecha_reserva instanceof Date) {
          fechaISO = r.fecha_reserva.toISOString().slice(0, 10);
        } else {
          fechaISO = String(r.fecha_reserva);
        }
        const [year, month, day] = fechaISO.split("-");
        const fechaMostrada =
          year && month && day ? `${day}/${month}/${year}` : fechaISO;

        // hora_inicio -> HH:mm
        let horaBase = "";
        if (typeof r.hora_inicio === "string") {
          horaBase = r.hora_inicio;
        } else if (r.hora_inicio instanceof Date) {
          horaBase = r.hora_inicio.toISOString().slice(11, 16);
        } else {
          horaBase = String(r.hora_inicio);
        }
        const horaMostrada = horaBase.substring(0, 5);

        // Montos tal cual backend
        const montoPagadoNumeroRaw = r.monto_pagado;
        const montoPagadoNumero =
          montoPagadoNumeroRaw !== null && montoPagadoNumeroRaw !== undefined
            ? Number(montoPagadoNumeroRaw)
            : 0;

        const montoDevolucionNumeroRaw = r.monto_devolucion_sugerida;
        const montoDevolucionNumero =
          montoDevolucionNumeroRaw !== null &&
          montoDevolucionNumeroRaw !== undefined
            ? Number(montoDevolucionNumeroRaw)
            : 0;

        return {
          id: r.id_reserva,
          idMesa: r.id_mesa,
          local: r.nombre_local,
          mesaNumero: `Mesa ${r.numero_mesa}`,
          tipoMesa: r.tipo_mesa,
          estado: r.estado_reserva,
          fecha: fechaMostrada,
          hora: horaMostrada,
          duracion: `${r.duracion_horas} horas`,
          duracionHoras: r.duracion_horas,
          precio: `Bs${montoPagadoNumero.toFixed(2)}`,
          penalizacion: `${r.penalizacion_sugerida}%`,
          montoDevolucion: `Bs${montoDevolucionNumero.toFixed(2)}`,
          celularAdmin: r.celular_admin ?? "",
          montoPagadoNumero,
          montoDevolucionNumero,
        };
      });

      setReservas(mapeadas);
    } catch (error: any) {
      console.error("Error al cargar mis reservas:", error);
      setResultType("error");
      setResultTitle("Error al cargar reservas");
      setResultMessage(
        error?.message || "No se pudieron cargar tus reservas. Intenta de nuevo."
      );
      setResultVisible(true);
    }
  }, []);

  // Se ejecuta cada vez que entras a esta pantalla
  useFocusEffect(
    useCallback(() => {
      cargarReservas();
    }, [cargarReservas])
  );

  // Pull to refresh (deslizar hacia abajo)
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await cargarReservas();
    } finally {
      setRefreshing(false);
    }
  }, [cargarReservas]);

  // Cargar horas disponibles para una mesa/fecha
  const cargarHorasDisponibles = useCallback(
    async (idMesa: number, fecha: Date) => {
      try {
        setCargandoHoras(true);
        setHorasSel([]);
        setSelectedHora(null);

        const fechaStr = toYMD(fecha);

        const json = await api(
          `/mesa/${idMesa}/horas-disponibles?fecha=${fechaStr}`
        );

        setHorasDisponibles(json.horasLibres || []);
      } catch (error: any) {
        console.error("Error al cargar horas disponibles:", error?.message);
        setHorasDisponibles([]);
        setResultType("error");
        setResultTitle("Sin horas disponibles");
        setResultMessage(
          error?.message ||
            "No se pudieron cargar las horas disponibles para la fecha seleccionada."
        );
        setResultVisible(true);
      } finally {
        setCargandoHoras(false);
      }
    },
    []
  );

  // Al seleccionar una hora: marcar automáticamente bloque de 'duracionHoras'
  const onHoraPress = (hora: string) => {
    if (!editingReserva || !editMode) return;

    const duracionNecesaria = editingReserva.duracionHoras || 1;

    // Si ya está seleccionado el bloque que empieza en esa hora, lo limpiamos
    if (horasSel.length && horasSel[0] === hora) {
      setHorasSel([]);
      setSelectedHora(null);
      return;
    }

    const startIndex = horasDisponibles.indexOf(hora);
    if (startIndex === -1) return;

    const bloque = horasDisponibles.slice(
      startIndex,
      startIndex + duracionNecesaria
    );

    if (bloque.length < duracionNecesaria) {
      setResultType("error");
      setResultTitle("Horas insuficientes");
      setResultMessage(
        "No hay suficientes horas consecutivas a partir de la hora seleccionada para cubrir la duración de la reserva."
      );
      setResultVisible(true);
      return;
    }

    setHorasSel(bloque);
    setSelectedHora(bloque[0]);
  };

  // Abrir modal de edición
  const handleEdit = (reserva: Reserva) => {
    setEditingReserva(reserva);
    setEditMode(false);
    setHorasDisponibles([]);
    setHorasSel([]);
    setSelectedHora(null);

    // Parsear fecha actual para DateTimePicker (pero NO se modifica editingReserva)
    const partes = reserva.fecha.split("/");
    const fechaObj = new Date(
      Number(partes[2]),
      Number(partes[1]) - 1,
      Number(partes[0])
    );

    setFechaSeleccionada(fechaObj);
    setFechaNuevaLabel(reserva.fecha); // por defecto muestra la fecha actual
    setModalVisible(true);
  };

  // Activar / desactivar modo edición
  const toggleEditMode = () => {
    if (!editingReserva || !fechaSeleccionada) {
      setEditMode(false);
      return;
    }

    const nuevoEstado = !editMode;
    setEditMode(nuevoEstado);

    if (nuevoEstado) {
      cargarHorasDisponibles(editingReserva.idMesa, fechaSeleccionada);
    } else {
      setHorasDisponibles([]);
      setHorasSel([]);
      setSelectedHora(null);
    }
  };

  // Cambio de fecha (DateTimePicker)
  const handleChangeFecha = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (!selectedDate || !editingReserva || !editMode) return;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const seleccion = new Date(selectedDate);
    seleccion.setHours(0, 0, 0, 0);

    if (seleccion < hoy) {
      setResultType("error");
      setResultTitle("Fecha inválida");
      setResultMessage("No puedes seleccionar una fecha pasada.");
      setResultVisible(true);
      return;
    }

    setFechaSeleccionada(seleccion);
    // Solo se actualiza la etiqueta de "Nueva fecha", NO los datos actuales
    setFechaNuevaLabel(seleccion.toLocaleDateString("es-ES"));

    cargarHorasDisponibles(editingReserva.idMesa, seleccion);
  };

  // Guardar edición → llamada real al backend
  const handleSaveEdit = async () => {
    if (!editingReserva || !editMode || !fechaSeleccionada || !selectedHora) {
      setResultType("error");
      setResultTitle("Datos incompletos");
      setResultMessage(
        "Selecciona una nueva fecha y una hora válida para guardar los cambios."
      );
      setResultVisible(true);
      return;
    }

    try {
      setGuardandoEdicion(true);

      const fecha_reserva = toYMD(fechaSeleccionada);
      const hora_inicio = selectedHora; // "HH:mm"

      const resp = await api(`/editarReserva/${editingReserva.id}`, {
        method: "PATCH",
        body: {
          fecha_reserva,
          hora_inicio,
        },
      });

      await cargarReservas();

      setModalVisible(false);
      setEditingReserva(null);
      setEditMode(false);
      setHorasSel([]);
      setSelectedHora(null);
      setHorasDisponibles([]);
      setFechaSeleccionada(null);
      setFechaNuevaLabel(null);

      setResultType("success");
      setResultTitle("Reserva actualizada");
      setResultMessage(
        resp?.message || "La reserva fue reprogramada correctamente."
      );
      setResultVisible(true);
    } catch (error: any) {
      console.error("Error al editar reserva:", error);
      setResultType("error");
      setResultTitle("Error al editar");
      setResultMessage(
        error?.message ||
          "Ocurrió un error al reprogramar la reserva. Intenta nuevamente."
      );
      setResultVisible(true);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // Click en botón "Guardar" → primero confirmar
  const handlePreConfirmEdit = () => {
    if (!editingReserva || !editMode || !fechaSeleccionada || !selectedHora) {
      setResultType("error");
      setResultTitle("Datos incompletos");
      setResultMessage(
        "Selecciona una nueva fecha y una hora válida para guardar los cambios."
      );
      setResultVisible(true);
      return;
    }
    setConfirmEditVisible(true);
  };

  const handleConfirmEdit = async () => {
    setConfirmEditVisible(false);
    await handleSaveEdit();
  };

  // Abrir modal de cancelar
  const handleCancel = (reserva: Reserva) => {
    setReservaSeleccionada(reserva);
    setImagenQR(null);
    setModalCancelarVisible(true);
  };

  // Subir imagen QR
  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setResultType("error");
      setResultTitle("Permiso requerido");
      setResultMessage("Se necesita permiso para acceder a tus imágenes.");
      setResultVisible(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.base64) {
        const dataUri = `data:image/jpeg;base64,${asset.base64}`;
        setImagenQR(dataUri);
      } else {
        setImagenQR(null);
        setResultType("error");
        setResultTitle("Error al cargar imagen");
        setResultMessage("No se pudo obtener el contenido de la imagen.");
        setResultVisible(true);
      }
    }
  };

  // Confirmar cancelación (llama /cancelarReserva/:id_reserva)
  const confirmarCancelacion = async () => {
    if (!reservaSeleccionada || !imagenQR || cancelando) return;

    try {
      setCancelando(true);

      const montoPenalizacion = Math.abs(
        reservaSeleccionada.montoDevolucionNumero -
          reservaSeleccionada.montoPagadoNumero
      );

      const monto_penalizacion_aplicada =
        montoPenalizacion > 0 ? montoPenalizacion : 0;

      const resp = await api(`/cancelarReserva/${reservaSeleccionada.id}`, {
        method: "PATCH",
        body: {
          monto_penalizacion_aplicada,
          qr_base64: imagenQR,
        },
      });

      await cargarReservas();
      setResultType("success");
      setResultTitle("Reserva cancelada");
      setResultMessage(
        resp?.message ||
          "Tu reserva fue cancelada correctamente. El reembolso se gestionará con el QR registrado."
      );
      setResultVisible(true);
      setModalCancelarVisible(false);
      setReservaSeleccionada(null);
      setImagenQR(null);
    } catch (e: any) {
      console.error("Error al cancelar reserva:", e);
      setResultType("error");
      setResultTitle("Error al cancelar");
      setResultMessage(
        e?.message ||
          "Ocurrió un error al cancelar la reserva. Intenta nuevamente."
      );
      setResultVisible(true);
    } finally {
      setCancelando(false);
    }
  };

  const handleConfirmFromModal = () => {
    setConfirmVisible(false);
    confirmarCancelacion();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={Colores.azul} />
      </TouchableOpacity>

      <Text style={styles.titulo}>Billiarcito</Text>

      {/* MODAL EDITAR RESERVA */}
      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Solicitud</Text>

            {editingReserva && (
              <>
                <Text style={styles.modalLabel}>Datos actuales</Text>
                <View style={styles.currentBox}>
                  <Text style={styles.currentText}>
                    Fecha:{" "}
                    <Text style={styles.currentValue}>
                      {editingReserva.fecha}
                    </Text>
                  </Text>
                  <Text style={styles.currentText}>
                    Hora:{" "}
                    <Text style={styles.currentValue}>
                      {editingReserva.hora}
                    </Text>
                  </Text>
                  <Text style={styles.currentText}>
                    Duración:{" "}
                    <Text style={styles.currentValue}>
                      {editingReserva.duracion}
                    </Text>
                  </Text>
                </View>
              </>
            )}

            <View style={styles.editHeaderRow}>
              <Text style={styles.modalLabel}>Reprogramar reserva</Text>
              <TouchableOpacity
                onPress={toggleEditMode}
                style={styles.editIconButton}
              >
                <Ionicons
                  name={editMode ? "create" : "create-outline"}
                  size={20}
                  color={Colores.azul}
                />
              </TouchableOpacity>
            </View>

            {editMode && (
              <>
                <Text style={styles.modalLabel}>Nueva fecha</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.modalInput}
                >
                  <Text style={styles.modalInputText}>
                    {fechaNuevaLabel ??
                      (editingReserva
                        ? editingReserva.fecha
                        : "Seleccionar fecha")}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={fechaSeleccionada ?? new Date()}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={handleChangeFecha}
                  />
                )}

                <Text style={styles.modalLabel}>Nueva hora</Text>
                {cargandoHoras ? (
                  <Text
                    style={{
                      color: Colores.azulOscuro,
                      marginBottom: 8,
                    }}
                  >
                    Cargando horas disponibles...
                  </Text>
                ) : horasDisponibles.length === 0 ? (
                  <Text
                    style={{
                      color: Colores.azulOscuro,
                      marginBottom: 8,
                    }}
                  >
                    No hay horas disponibles para la fecha seleccionada.
                  </Text>
                ) : (
                  <View style={styles.horasGrid}>
                    {horasDisponibles.map((hora) => {
                      const seleccionada = horasSel.includes(hora);
                      return (
                        <TouchableOpacity
                          key={hora}
                          onPress={() => onHoraPress(hora)}
                          style={[
                            styles.horaBtn,
                            seleccionada && styles.horaBtnSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.horaText,
                              seleccionada && styles.horaTextSelected,
                            ]}
                          >
                            {hora}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {!editMode && (
              <Text style={styles.hintText}>
                Toque el ícono de lápiz para seleccionar una nueva fecha y hora.
              </Text>
            )}

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: Colores.azul,
                    opacity:
                      editMode &&
                      selectedHora &&
                      fechaSeleccionada &&
                      !guardandoEdicion
                        ? 1
                        : 0.6,
                  },
                ]}
                onPress={handlePreConfirmEdit}
                disabled={
                  !(
                    editMode &&
                    selectedHora &&
                    fechaSeleccionada &&
                    !guardandoEdicion
                  )
                }
              >
                <Text style={styles.modalButtonText}>
                  {guardandoEdicion ? "Guardando..." : "Guardar"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: Colores.azulOscuro },
                ]}
                onPress={() => {
                  if (guardandoEdicion) return;
                  setModalVisible(false);
                  setEditingReserva(null);
                  setEditMode(false);
                  setHorasSel([]);
                  setSelectedHora(null);
                  setHorasDisponibles([]);
                  setFechaSeleccionada(null);
                  setFechaNuevaLabel(null);
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CANCELAR RESERVA */}
      <Modal animationType="fade" transparent visible={modalCancelarVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalCancelContent}>
            <Text style={styles.modalCancelText}>
              {reservaSeleccionada
                ? `${reservaSeleccionada.penalizacion} se va penalizar`
                : "Se aplicará penalización"}
              {"\n"}
              Monto devolución:{" "}
              <Text style={{ fontWeight: "bold" }}>
                {reservaSeleccionada?.montoDevolucion ?? "-"}
              </Text>
              {"\n"}
              Para mayor información contactar:{" "}
              <Text style={{ fontWeight: "bold" }}>
                {reservaSeleccionada?.celularAdmin || "No disponible"}
              </Text>
            </Text>

            {imagenQR && (
              <View style={styles.qrWrapper}>
                <Image source={{ uri: imagenQR }} style={styles.qrImage} />
                <TouchableOpacity
                  style={styles.qrRemoveButton}
                  onPress={() => setImagenQR(null)}
                  disabled={cancelando}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={Colores.rojo}
                  />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={handlePickImage}
              disabled={cancelando}
            >
              <Text style={styles.modalCancelButtonText}>
                {imagenQR ? "Cambiar QR" : "Subir QR"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalSaveButton,
                { opacity: imagenQR && !cancelando ? 1 : 0.6 },
              ]}
              disabled={!imagenQR || cancelando}
              onPress={() => setConfirmVisible(true)}
            >
              <Text style={styles.modalSaveButtonText}>
                {cancelando ? "Guardando..." : "Guardar"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                if (cancelando) return;
                setModalCancelarVisible(false);
                setReservaSeleccionada(null);
                setImagenQR(null);
              }}
            >
              <Text style={styles.modalCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CONFIRM MODAL CANCELAR */}
      <ConfirmModal
        visible={confirmVisible}
        title="Confirmar cancelación"
        message="¿Estás seguro de que deseas cancelar esta reserva? Se aplicará la penalización indicada y se usará el QR cargado para el reembolso."
        onCancel={() => setConfirmVisible(false)}
        onConfirm={handleConfirmFromModal}
        confirmText="Sí, cancelar"
        cancelText="No"
      />

      {/* CONFIRM MODAL EDITAR */}
      <ConfirmModal
        visible={confirmEditVisible}
        title="Confirmar reprogramación"
        message={`¿Deseas reprogramar tu reserva para el ${
          fechaNuevaLabel ?? editingReserva?.fecha ?? ""
        } a las ${selectedHora ?? editingReserva?.hora ?? ""}?`}
        onCancel={() => setConfirmEditVisible(false)}
        onConfirm={handleConfirmEdit}
        confirmText="Sí, reprogramar"
        cancelText="No"
      />

      {/* RESULT MODAL */}
      <ResultModal
        visible={resultVisible}
        type={resultType}
        title={resultTitle}
        message={resultMessage}
        buttonText="Aceptar"
        onClose={() => setResultVisible(false)}
      />

      {/* LISTA DE RESERVAS + PULL TO REFRESH */}
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
        {reservas.map((reserva) => (
          <View key={reserva.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.mesaNombre}>
                  {reserva.mesaNumero} - {reserva.tipoMesa}
                </Text>
                <Text style={styles.infoTexto}>{reserva.local}</Text>
              </View>
              <View style={styles.estadoEtiqueta}>
                <Text style={styles.estadoTexto}>{reserva.estado}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={Colores.azul}
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
  currentBox: {
    backgroundColor: "#F3F5F8",
    padding: 10,
    borderRadius: 8,
  },
  currentText: {
    color: Colores.azulOscuro,
    fontSize: 13,
    marginBottom: 2,
  },
  currentValue: {
    fontWeight: "bold",
    color: Colores.azulOscuro,
  },
  editHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  editIconButton: {
    padding: 6,
  },
  horasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
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
  hintText: {
    color: Colores.azulOscuro,
    fontSize: 12,
    marginTop: 8,
  },
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
  qrWrapper: {
    position: "relative",
    marginBottom: 15,
  },
  qrImage: {
    width: 180,
    height: 180,
    borderRadius: 10,
  },
  qrRemoveButton: {
    position: "absolute",
    top: -8,
    right: -8,
  },
});
