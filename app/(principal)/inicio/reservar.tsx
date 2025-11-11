import { AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { api } from "@/components/api";
import ConfirmModal from "@/components/modals/ConfirmModal";
import ResultModal from "@/components/modals/ResultModal";
import { getToken } from "@/utils/authStorage";

type MesaDetalle = {
  id: number;
  nombre: string;
  tipo_mesa: string;
  precio_hora: number;
  estado: string;
  imagenes: string[];
  qrLocal: string | null;
  descuentoLocal: number;
};

type ComprobanteReserva = {
  id_reserva: number;

  nombre_local: string;
  direccion_local: string;

  numero_mesa: number;
  tipo_mesa: string;

  fecha_reserva: string; // ISO
  hora_inicio: string; // ISO
  hora_fin: string; // ISO
  duracion_horas: number;

  monto_total: number;
  descuento_aplicado: boolean;
  porcentaje_descuento: number;

  estado_reserva: "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "FINALIZADA";
  fecha_registro: string; // ISO

  estado_pago: "PENDIENTE" | "APROBADO" | "RECHAZADO";
};

/**
 * ReservarMesa
 * - Horas disponibles: backend
 *   GET /api/mesa/:idMesa/horas-disponibles?fecha=YYYY-MM-DD
 * - Detalle de mesa: backend
 *   GET /api/mesasLocal/mesa/:idMesa
 * - Crear reserva + pago:
 *   POST /api/reservar
 */
export default function ReservarMesa() {
  // ✅ Params
  const { mesaId, localId } = useLocalSearchParams();
  const router = useRouter();
  const idLocalActual = localId;
  const idMesa = Number(mesaId ?? 0) || 4;

  // ===================== ESTADO =====================
  const [mostrarQR, setMostrarQR] = useState(false);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [fecha, setFecha] = useState(new Date());

  const [imagenComprobante, setImagenComprobante] = useState<string | null>(
    null
  );
  const [comprobanteBase64, setComprobanteBase64] = useState<string | null>(
    null
  );

  // Horas desde backend
  const [cargandoHoras, setCargandoHoras] = useState(false);
  const [horasDisponibles, setHorasDisponibles] = useState<string[]>([]);
  const [horasSel, setHorasSel] = useState<string[]>([]);

  // Detalle de mesa desde backend
  const [mesaDetalle, setMesaDetalle] = useState<MesaDetalle | null>(null);
  const [cargandoMesa, setCargandoMesa] = useState(false);

  // Reservar / modales
  const [loadingReserva, setLoadingReserva] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [comprobanteReserva, setComprobanteReserva] =
    useState<ComprobanteReserva | null>(null);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);

  // ===================== HELPERS =====================
  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  const hourNum = (hhmm: string) => parseInt(hhmm.split(":")[0], 10);

  const esBloqueContinuo = (arr: string[]) => {
    if (arr.length <= 1) return true;
    const s = [...arr].sort((a, b) => hourNum(a) - hourNum(b));
    for (let i = 1; i < s.length; i++) {
      if (hourNum(s[i]) !== hourNum(s[i - 1]) + 1) return false;
    }
    return true;
  };

  const esAdyacenteASeleccion = (h: string, arr: string[]) => {
    if (arr.length === 0) return true;
    const s = [...arr].sort((a, b) => hourNum(a) - hourNum(b));
    const min = hourNum(s[0]);
    const max = hourNum(s[s.length - 1]);
    const hh = hourNum(h);
    return hh === min - 1 || hh === max + 1;
  };

  const calcularHoraFinReal = (horas: string[]): string => {
    if (!horas.length) return "00:00";
    const s = [...horas].sort((a, b) => hourNum(a) - hourNum(b));
    const last = s[s.length - 1]; // ej. "21:00"
    const h = hourNum(last) + 1;
    const mm = last.split(":")[1] || "00";
    const hhStr = String(h).padStart(2, "0");
    return `${hhStr}:${mm}`;
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("es-ES");
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const formatDateTime = (iso: string) => new Date(iso).toLocaleString("es-ES");

  const buildShareText = (c: ComprobanteReserva) => {
    return (
      `Comprobante de reserva\n\n` +
      `Local: ${c.nombre_local}\n` +
      `Dirección: ${c.direccion_local}\n` +
      `Mesa: ${c.numero_mesa} (${c.tipo_mesa})\n` +
      `Fecha: ${formatDate(c.fecha_reserva)}\n` +
      `Horario: ${formatTime(c.hora_inicio)} - ${formatTime(c.hora_fin)}\n` +
      `Duración: ${c.duracion_horas} hora(s)\n` +
      `Monto total: Bs ${c.monto_total.toFixed(2)}\n` +
      (c.descuento_aplicado
        ? `Descuento aplicado: ${c.porcentaje_descuento}%\n`
        : `Descuento aplicado: No\n`) +
      `Estado de reserva: ${c.estado_reserva}\n` +
      `Fecha de registro: ${formatDateTime(c.fecha_registro)}\n` +
      `Estado de pago: ${c.estado_pago}`
    );
  };

  const resetFormulario = () => {
    setHorasSel([]);
    setImagenComprobante(null);
    setComprobanteBase64(null);
    setMostrarQR(false);
  };

  // ===================== FETCH DETALLE MESA (BACK) =====================
  async function cargarDetalleMesa() {
    try {
      setCargandoMesa(true);
      const json = await api(`/mesasLocal/mesa/${idMesa}`);
      // Soporta tanto respuesta directa como envuelta en { data }
      const data = json.id !== undefined ? json : json.data;

      const detalle: MesaDetalle = {
        id: data.id,
        nombre: data.nombre,
        tipo_mesa: data.tipo_mesa,
        precio_hora: data.precio_hora,
        estado: data.estado,
        imagenes: data.imagenes || [],
        qrLocal: data.qrLocal ?? null,
        descuentoLocal: data.descuentoLocal ?? 0,
      };

      setMesaDetalle(detalle);
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.message || "No se pudo cargar la información de la mesa."
      );
      setMesaDetalle(null);
    } finally {
      setCargandoMesa(false);
    }
  }

  // ===================== FETCH HORAS (SOLO ESTO DEL BACK) =====================
  const cargarHoras = useCallback(async () => {
    setCargandoHoras(true);
    setHorasSel([]); // limpiar selección al cambiar fecha/mesa
    try {
      const fechaStr = toYMD(fecha);
      const json = await api(
        `/mesa/${idMesa}/horas-disponibles?fecha=${fechaStr}`
      );
      setHorasDisponibles(json.horasLibres || []);
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.message || "No se pudieron cargar las horas disponibles."
      );
      setHorasDisponibles([]);
    } finally {
      setCargandoHoras(false);
    }
  }, [idMesa, fecha]);

  useEffect(() => {
    cargarDetalleMesa();
  }, [idMesa]);

  // Cada vez que se enfoca la pantalla o cambia fecha/mesa, refrescamos y limpiamos estados viejos
  useFocusEffect(
    useCallback(() => {
      setComprobanteReserva(null);
      setShowComprobanteModal(false);
      resetFormulario();
      cargarHoras();
    }, [cargarHoras])
  );

  // ===================== LÓGICA DE SELECCIÓN CONTINUA =====================
  function onHoraPress(hora: string) {
    if (!horasSel.includes(hora)) {
      if (esAdyacenteASeleccion(hora, horasSel)) {
        const nuevas = [...horasSel, hora].sort(
          (a, b) => hourNum(a) - hourNum(b)
        );
        setHorasSel(nuevas);
      } else {
        setHorasSel([hora]);
      }
      return;
    }

    const quitadas = horasSel.filter((h) => h !== hora);
    if (!esBloqueContinuo(quitadas)) {
      setHorasSel([hora]);
    } else {
      setHorasSel(quitadas);
    }
  }

  // ===================== DURACIÓN Y TOTALES (solo visual front) =====================
  const duracionHoras = horasSel.length;
  const precioHora = mesaDetalle?.precio_hora ?? 0;
  const descuentoLocal = mesaDetalle?.descuentoLocal ?? 0;

  const totalSinDescuento = precioHora * duracionHoras;
  const totalConDescuento =
    descuentoLocal > 0
      ? totalSinDescuento * (1 - descuentoLocal / 100)
      : totalSinDescuento;
  const hayDescuento = descuentoLocal > 0;

  // ===================== HANDLERS UI =====================
  const onChangeFecha = (_event: any, selectedDate?: Date) => {
    setMostrarCalendario(false);
    if (selectedDate) setFecha(selectedDate);
  };

  const subirImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(
        "Permiso denegado",
        "Debe permitir el acceso a las fotos para continuar."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setImagenComprobante(asset.uri);
      if (asset.base64) {
        // Usamos dataURI base64 para el backend
        setComprobanteBase64(`data:image/jpeg;base64,${asset.base64}`);
      } else {
        setComprobanteBase64(null);
      }
    }
  };

  const eliminarImagen = () => {
    setImagenComprobante(null);
    setComprobanteBase64(null);
  };

  const handleDescargarQR = async () => {
    if (!mesaDetalle?.qrLocal) return;
    try {
      await Linking.openURL(mesaDetalle.qrLocal);
    } catch (e) {
      Alert.alert(
        "Error",
        "No se pudo abrir el enlace del código QR. Intente nuevamente."
      );
    }
  };

  const reservaHabilitada =
    horasSel.length > 0 && !!comprobanteBase64 && !loadingReserva;

  const abrirConfirmModal = () => {
    if (horasSel.length === 0) {
      Alert.alert(
        "Reserva",
        "Seleccione al menos una hora continua para realizar la reserva."
      );
      return;
    }
    if (!comprobanteBase64) {
      Alert.alert(
        "Comprobante requerido",
        "Debe subir la imagen del comprobante de pago para confirmar la reserva."
      );
      return;
    }
    setShowConfirmModal(true);
  };

  const ejecutarReservaBackend = async () => {
    try {
      setShowConfirmModal(false);
      setLoadingReserva(true);

      const token = await getToken();
      if (!token) {
        setResultMessage("Sesión no válida. Inicie sesión nuevamente.");
        setShowResultModal(true);
        return;
      }

      const fechaStr = toYMD(fecha);
      const horasOrdenadas = [...horasSel].sort(
        (a, b) => hourNum(a) - hourNum(b)
      );
      const horaInicio = horasOrdenadas[0];
      const horaFinReal = calcularHoraFinReal(horasOrdenadas);

      const body = {
        id_mesa: idMesa,
        fecha_reserva: fechaStr,
        hora_inicio: horaInicio,
        hora_fin: horaFinReal,
        comprobante_base64: comprobanteBase64,
      };

      const resp = await api("/reservar", {
        method: "POST",
        token,
        body,
      });

      const data: ComprobanteReserva = resp.data;

      setComprobanteReserva(data);
      // No mostramos ResultModal de éxito, directamente el comprobante
      setShowComprobanteModal(true);
    } catch (e: any) {
      setResultMessage(
        e?.message || "Ocurrió un error al registrar la reserva."
      );
      setShowResultModal(true);
    } finally {
      setLoadingReserva(false);
    }
  };

  const handleShareComprobante = async () => {
    if (!comprobanteReserva) return;
    try {
      await Share.share({
        message: buildShareText(comprobanteReserva),
      });
    } catch {
      Alert.alert("Error", "No se pudo compartir el comprobante.");
    }
  };

  const handleCloseComprobanteModal = () => {
    setShowComprobanteModal(false);
    setComprobanteReserva(null);
    resetFormulario();
    cargarHoras();
  };

  const irAListaMesas = () => {
    resetFormulario();
    setComprobanteReserva(null);
    setShowComprobanteModal(false);
    router.push({
      pathname: "/(principal)/inicio/mesas",
      params: { id: idLocalActual },
    });
  };

  // ===================== RENDER =====================
  return (
    <>
      <ScrollView style={styles.container}>
        {/* === FLECHA SIMPLE DE RETROCESO + TÍTULO === */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <TouchableOpacity
            onPress={irAListaMesas}
            style={{ position: "absolute", left: 0 }}
          >
            <AntDesign name="arrow-left" size={24} color="#0033CC" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#0033CC" }}>
            Reservar mesa
          </Text>
        </View>

        {/* === Información de la mesa (desde API) === */}
        <View style={styles.mesaCard}>
          {cargandoMesa ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator />
            </View>
          ) : !mesaDetalle ? (
            <Text style={styles.carouselEmpty}>
              No se pudo cargar la información de la mesa.
            </Text>
          ) : (
            <>
              {mesaDetalle.imagenes && mesaDetalle.imagenes.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.carousel}
                >
                  {mesaDetalle.imagenes.map((url, idx) => (
                    <Image
                      key={`${url}-${idx}`}
                      source={{ uri: url }}
                      style={styles.carouselImage}
                    />
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.carouselEmpty}>
                  El local aún no ha registrado imágenes para esta mesa.
                </Text>
              )}

              <View style={styles.mesaInfo}>
                <Text style={styles.mesaNombre}>{mesaDetalle.nombre}</Text>
                <Text style={styles.mesaTexto}>
                  Tipo: {mesaDetalle.tipo_mesa}
                </Text>
                <Text style={styles.mesaTexto}>
                  Precio: Bs {mesaDetalle.precio_hora} / hora
                </Text>
                <Text style={styles.mesaTexto}>
                  Estado: {mesaDetalle.estado}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* === Fecha, horas y totales === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fecha</Text>

          <TouchableOpacity
            style={styles.dateBox}
            onPress={() => setMostrarCalendario(true)}
          >
            <AntDesign name="calendar" size={18} color="#0033CC" />
            <Text style={{ marginLeft: 6 }}>
              {fecha.toLocaleDateString("es-ES")}
            </Text>
          </TouchableOpacity>

          {mostrarCalendario && (
            <DateTimePicker
              value={fecha}
              mode="date"
              display="calendar"
              onChange={onChangeFecha}
              minimumDate={new Date()}
            />
          )}

          <Text style={styles.sectionTitle}>Horas disponibles</Text>

          {cargandoHoras ? (
            <View style={{ paddingVertical: 12 }}>
              <ActivityIndicator />
            </View>
          ) : horasDisponibles.length === 0 ? (
            <Text style={{ color: "#666", marginTop: 6 }}>
              No hay horas disponibles para esta fecha.
            </Text>
          ) : (
            <View style={styles.grid}>
              {horasDisponibles.map((hora) => {
                const selected = horasSel.includes(hora);
                return (
                  <TouchableOpacity
                    key={hora}
                    style={[styles.horaBtn, selected && styles.horaBtnSelected]}
                    onPress={() => onHoraPress(hora)}
                  >
                    <Text
                      style={
                        selected ? styles.horaTextSelected : styles.horaText
                      }
                    >
                      {hora}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.sectionTitle}>Duración</Text>
          <View style={styles.selectBox}>
            <Text>
              {duracionHoras === 0 ? "0 horas" : `${duracionHoras} hora(s)`}
            </Text>
          </View>

          {/* Totales + descuento (solo visual) */}
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Total sin descuento:</Text>
            <Text style={styles.totalMonto}>
              Bs {totalSinDescuento.toFixed(2)}
            </Text>
          </View>

          <Text style={styles.descuentoText}>
            {hayDescuento
              ? `Descuento aplicado: ${descuentoLocal}%`
              : "Descuento: No aplica descuento en este local."}
          </Text>

          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Total a pagar (referencial):</Text>
            <Text style={styles.totalMonto}>
              Bs {totalConDescuento.toFixed(2)}
            </Text>
          </View>

          {/* QR del local */}
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>QR de pago</Text>
            {mesaDetalle && mesaDetalle.qrLocal ? (
              !mostrarQR ? (
                <TouchableOpacity
                  onPress={() => setMostrarQR(true)}
                  style={styles.descargarQR}
                >
                  <Text style={styles.descargarQRText}>Ver QR de pago</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.qrContainer}>
                  <Image
                    source={{ uri: mesaDetalle.qrLocal }}
                    style={styles.qrImagen}
                  />
                  <TouchableOpacity
                    style={styles.btnDescargar}
                    onPress={handleDescargarQR}
                  >
                    <Text style={styles.btnDescargarText}>
                      Descargar / abrir QR
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              <Text style={styles.qrMensaje}>
                El local aún no ha registrado su código QR de pago.
              </Text>
            )}
          </View>
        </View>

        {/* === Comprobante === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comprobante de pago</Text>

          {imagenComprobante ? (
            <View style={styles.imagenContainer}>
              <Image
                source={{ uri: imagenComprobante }}
                style={styles.imagenComprobante}
              />
              <TouchableOpacity
                onPress={eliminarImagen}
                style={styles.btnEliminar}
              >
                <Text style={{ color: "#FFF" }}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={subirImagen} style={styles.uploadBox}>
              <AntDesign name="upload" size={22} color="#0052FF" />
              <Text style={{ color: "#0052FF", marginLeft: 6 }}>
                Subir imagen de comprobante
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* === Botones === */}
        <TouchableOpacity
          style={[styles.btn, !reservaHabilitada && styles.btnDisabled]}
          onPress={abrirConfirmModal}
          disabled={!reservaHabilitada}
        >
          <Text style={styles.btnText}>Confirmar reserva</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "#D9534F" }]}
          onPress={irAListaMesas}
        >
          <Text style={styles.btnText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* === Modal de confirmación === */}
      <ConfirmModal
        visible={showConfirmModal}
        title="Confirmar reserva"
        message={
          horasSel.length
            ? `¿Desea confirmar la reserva para el ${fecha.toLocaleDateString(
                "es-ES"
              )} de ${horasSel[0]} a ${calcularHoraFinReal(horasSel)}?`
            : "¿Desea confirmar la reserva?"
        }
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={ejecutarReservaBackend}
        confirmText="Sí, reservar"
        cancelText="Volver"
      />

      {/* === Modal de resultado (solo errores) === */}
      <ResultModal
        visible={showResultModal}
        type="error"
        title="Error"
        message={resultMessage}
        buttonText="Aceptar"
        onClose={() => setShowResultModal(false)}
      />

      {/* === Modal de comprobante de reserva === */}
      <Modal
        visible={!!comprobanteReserva && showComprobanteModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseComprobanteModal}
      >
        <View style={styles.comprobanteModalOverlay}>
          <View style={styles.comprobanteModalCard}>
            <View style={styles.comprobanteModalHeader}>
              <Text style={styles.comprobanteTitle}>Comprobante de reserva</Text>
              <TouchableOpacity onPress={handleShareComprobante}>
                <AntDesign name={"sharealt" as any} size={20} color="#0033CC" />
              </TouchableOpacity>
            </View>

            {comprobanteReserva && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Local:</Text>
                  <Text style={styles.infoValue}>
                    {comprobanteReserva.nombre_local}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Dirección:</Text>
                  <Text style={styles.infoValue}>
                    {comprobanteReserva.direccion_local}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Mesa:</Text>
                  <Text style={styles.infoValue}>
                    {comprobanteReserva.numero_mesa} (
                    {comprobanteReserva.tipo_mesa})
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fecha:</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(comprobanteReserva.fecha_reserva)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Horario:</Text>
                  <Text style={styles.infoValue}>
                    {formatTime(comprobanteReserva.hora_inicio)} -{" "}
                    {formatTime(comprobanteReserva.hora_fin)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Duración:</Text>
                  <Text style={styles.infoValue}>
                    {comprobanteReserva.duracion_horas} hora(s)
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Monto total:</Text>
                  <Text style={styles.infoValue}>
                    Bs {comprobanteReserva.monto_total.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Descuento:</Text>
                  <Text style={styles.infoValue}>
                    {comprobanteReserva.descuento_aplicado
                      ? `${comprobanteReserva.porcentaje_descuento}% aplicado`
                      : "No se aplicó descuento"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Estado reserva:</Text>
                  <Text style={styles.infoValue}>
                    {comprobanteReserva.estado_reserva}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fecha registro:</Text>
                  <Text style={styles.infoValue}>
                    {formatDateTime(comprobanteReserva.fecha_registro)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Estado pago:</Text>
                  <Text style={styles.infoValue}>
                    {comprobanteReserva.estado_pago}
                  </Text>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.btn, { marginTop: 12 }]}
              onPress={handleCloseComprobanteModal}
            >
              <Text style={styles.btnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* === Modal de cargando / transacción === */}
      <Modal visible={loadingReserva} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#0052FF" />
            <Text style={styles.loadingText}>Registrando reserva...</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* === ESTILOS === */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F9FF", padding: 16 },
  mesaCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    elevation: 3,
  },
  carousel: {
    marginBottom: 8,
  },
  carouselImage: {
    width: 220,
    height: 140,
    borderRadius: 10,
    marginRight: 8,
  },
  carouselEmpty: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  mesaInfo: { marginTop: 4 },
  mesaNombre: {
    fontWeight: "bold",
    color: "#0033CC",
    fontSize: 15,
    marginBottom: 2,
  },
  mesaTexto: { fontSize: 13, color: "#444" },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    elevation: 2,
  },
  sectionTitle: { fontWeight: "bold", color: "#0033CC", marginTop: 6 },
  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F5F8",
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  horaBtn: {
    backgroundColor: "#E6E9FF",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    margin: 3,
  },
  horaBtnSelected: { backgroundColor: "#0052FF" },
  horaText: { color: "#000" },
  horaTextSelected: { color: "#FFF", fontWeight: "bold" },
  selectBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F3F5F8",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  totalText: { fontWeight: "bold", color: "#444" },
  totalMonto: { fontWeight: "bold", color: "#009900" },
  descuentoText: {
    marginTop: 6,
    fontSize: 13,
    color: "#444",
  },
  descargarQR: { marginTop: 6 },
  descargarQRText: {
    color: "#E63946",
    fontWeight: "600",
    textDecorationLine: "underline",
    textAlign: "right",
  },
  qrContainer: { alignItems: "center", marginTop: 10 },
  qrImagen: { width: 180, height: 180, borderRadius: 8, marginBottom: 8 },
  btnDescargar: {
    backgroundColor: "#0052FF",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  btnDescargarText: { color: "#FFF", fontWeight: "bold" },
  qrMensaje: {
    marginTop: 6,
    fontSize: 13,
    color: "#666",
  },
  uploadBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#0052FF",
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  imagenContainer: { alignItems: "center", marginTop: 8 },
  imagenComprobante: { width: 200, height: 200, borderRadius: 8 },
  btnEliminar: {
    backgroundColor: "#E63946",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 6,
  },
  btn: {
    backgroundColor: "#0052FF",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 5,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: { color: "#FFF", fontWeight: "bold" },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    width: "75%",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#333",
  },
  // Modal comprobante
  comprobanteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  comprobanteModalCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    width: "90%",
  },
  comprobanteModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  comprobanteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0033CC",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    flexWrap: "wrap",
  },
  infoLabel: {
    fontSize: 12,
    color: "#555",
    fontWeight: "bold",
  },
  infoValue: {
    fontSize: 13,
    color: "#222",
    textAlign: "right",
    flexShrink: 1,
    marginLeft: 8,
  },
});
