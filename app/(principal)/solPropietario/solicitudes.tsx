// app/(principal)/solicitudes-reserva.tsx
import { api } from "@/components/api";
import ConfirmModal from "@/components/modals/ConfirmModal";
import ResultModal from "@/components/modals/ResultModal";
import { getToken } from "@/utils/authStorage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
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
  azulOscuro: "#002B80",
  rojo: "#E53935",
  verde: "#059669",
  blanco: "#FFFFFF",
  grisClaro: "#E6E9FF",
  textoOscuro: "#222222",
};

type EstadoReserva = "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "FINALIZADA";

interface Solicitud {
  id_reserva: number;
  nombre_local: string;
  numero_mesa: number;
  nombre_cliente: string;
  fecha: string;
  hora: string;
  duracion: string;
  monto_pagado: number;
  estado_reserva: EstadoReserva | string;
  comprobante_url: string | null;
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

export default function SolicitudesReserva() {
  const router = useRouter();

  const [filtro, setFiltro] = useState<"PENDIENTE" | "CONFIRMADA">("PENDIENTE");
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selected, setSelected] = useState<Solicitud | null>(null);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmType, setConfirmType] = useState<"ACEPTAR" | "RECHAZAR" | null>(
    null
  );
  const [procesando, setProcesando] = useState(false);

  const [resultVisible, setResultVisible] = useState(false);
  const [resultType, setResultType] = useState<"success" | "error">("success");
  const [resultTitle, setResultTitle] = useState("");
  const [resultMessage, setResultMessage] = useState("");

  const [comprobanteVisible, setComprobanteVisible] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);

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

  const cargarSolicitudes = useCallback(async () => {
    try {
      setCargando(true);
      const token = await getToken();
      if (!token) {
        mostrarResultado(
          "error",
          "Sesión no disponible",
          "No se encontró un token de autenticación. Vuelve a iniciar sesión."
        );
        return;
      }

      const json = await api("/solicitudesReservas", { token });
      const lista = (json?.solicitudes ?? []) as any[];

      const mapeadas: Solicitud[] = lista.map((r) => {
        const fecha = formatearFecha(r.fecha_reserva);
        const hora = formatearHora(r.hora_inicio);
        const duracionHoras = Number(r.duracion_horas ?? 0);
        const duracion =
          duracionHoras === 1 ? "1 hora" : `${duracionHoras} horas`;

        const monto_pagado = Number(r.monto_pagado ?? 0);

        return {
          id_reserva: r.id_reserva,
          nombre_local: r.nombre_local,
          numero_mesa: r.numero_mesa,
          nombre_cliente: r.nombre_cliente,
          fecha,
          hora,
          duracion,
          monto_pagado,
          estado_reserva: r.estado_reserva,
          comprobante_url: r.comprobante_url ?? null,
        };
      });

      setSolicitudes(mapeadas);
    } catch (error: any) {
      console.error("Error al cargar solicitudes de reservas:", error);
      mostrarResultado(
        "error",
        "Error al cargar solicitudes",
        error?.message ||
          "No se pudieron obtener las solicitudes de reserva. Intenta nuevamente."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarSolicitudes();
    }, [cargarSolicitudes])
  );

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await cargarSolicitudes();
    } finally {
      setRefreshing(false);
    }
  }, [cargarSolicitudes]);

  const abrirConfirmar = (sol: Solicitud, tipo: "ACEPTAR" | "RECHAZAR") => {
    setSelected(sol);
    setConfirmType(tipo);
    setConfirmVisible(true);
  };

  const verComprobante = (sol: Solicitud) => {
    if (!sol.comprobante_url) {
      mostrarResultado(
        "error",
        "Sin comprobante",
        "Esta reserva no tiene comprobante de pago registrado."
      );
      return;
    }
    setComprobanteUrl(sol.comprobante_url);
    setComprobanteVisible(true);
  };

  const cerrarModalComprobante = () => {
    setComprobanteVisible(false);
    setComprobanteUrl(null);
  };

  const procesarSolicitud = async () => {
  if (!selected || !confirmType || procesando) {
    setConfirmVisible(false);
    return;
  }

  try {
    setProcesando(true);
    setConfirmVisible(false);

    const token = await getToken();  // Recuperas el token de autenticación
    if (!token) {
      mostrarResultado(
        "error",
        "No autenticado",
        "No se encontró el token de autenticación. Por favor, vuelve a iniciar sesión."
      );
      return;
    }

    const path =
      confirmType === "ACEPTAR"
        ? `/solicitudesReservas/aceptar/${selected.id_reserva}`
        : `/solicitudesReservas/rechazar/${selected.id_reserva}`;

    const resp = await api(path, { 
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`  // Se agrega el token al header
      }
    });

    await cargarSolicitudes();

    mostrarResultado(
      "success",
      confirmType === "ACEPTAR"
        ? "Reserva aceptada"
        : "Reserva rechazada",
      resp?.message ||
        (confirmType === "ACEPTAR"
          ? "La reserva fue aceptada correctamente."
          : "La reserva fue rechazada correctamente.")
    );
  } catch (error: any) {
    console.error("Error al procesar solicitud:", error);
    mostrarResultado(
      "error",
      "Error al procesar solicitud",
      error?.message ||
        "Ocurrió un error al procesar la solicitud. Intenta nuevamente."
    );
  } finally {
    setProcesando(false);
    setConfirmType(null);
    setSelected(null);
  }
};


  const solicitudesFiltradas = solicitudes.filter(
    (s) => s.estado_reserva === filtro
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={Colores.azul} />
      </TouchableOpacity>

      <Text style={styles.titulo}>Solicitudes de Reserva</Text>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filtro === "PENDIENTE" && styles.filterChipActive,
          ]}
          onPress={() => setFiltro("PENDIENTE")}
        >
          <Text
            style={[
              styles.filterText,
              filtro === "PENDIENTE" && styles.filterTextActive,
            ]}
          >
            Pendientes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filtro === "CONFIRMADA" && styles.filterChipActive,
          ]}
          onPress={() => setFiltro("CONFIRMADA")}
        >
          <Text
            style={[
              styles.filterText,
              filtro === "CONFIRMADA" && styles.filterTextActive,
            ]}
          >
            Aceptadas
          </Text>
        </TouchableOpacity>
      </View>

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
        {cargando && solicitudesFiltradas.length === 0 ? (
          <Text style={styles.noSolicitudesText}>Cargando solicitudes...</Text>
        ) : solicitudesFiltradas.length === 0 ? (
          <Text style={styles.noSolicitudesText}>No hay solicitudes.</Text>
        ) : (
          solicitudesFiltradas.map((solicitud) => (
            <View key={solicitud.id_reserva} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.mesaNombre}>
                  Mesa {solicitud.numero_mesa} / {solicitud.nombre_local}
                </Text>
                <View
                  style={[
                    styles.estadoEtiqueta,
                    solicitud.estado_reserva === "PENDIENTE"
                      ? { backgroundColor: Colores.azul }
                      : { backgroundColor: Colores.verde },
                  ]}
                >
                  <Text style={styles.estadoTexto}>
                    {solicitud.estado_reserva === "PENDIENTE"
                      ? "Pendiente"
                      : "Aceptada"}
                  </Text>
                </View>
              </View>

              <Text style={styles.infoTexto}>
                Cliente:{" "}
                <Text style={styles.bold}>
                  {solicitud.nombre_cliente.toUpperCase()}
                </Text>
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
                Monto pagado:{" "}
                <Text style={styles.bold}>
                  Bs{solicitud.monto_pagado.toFixed(2)}
                </Text>
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.actionButtonSmall,
                    { borderColor: Colores.azulOscuro },
                  ]}
                  onPress={() => verComprobante(solicitud)}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color={Colores.azulOscuro}
                  />
                  <Text style={styles.buttonOutlineText}>Ver comprobante</Text>
                </TouchableOpacity>

                {solicitud.estado_reserva === "PENDIENTE" && (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: Colores.verde },
                      ]}
                      onPress={() => abrirConfirmar(solicitud, "ACEPTAR")}
                    >
                      <Text style={styles.buttonText}>Aceptar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: Colores.rojo },
                      ]}
                      onPress={() => abrirConfirmar(solicitud, "RECHAZAR")}
                    >
                      <Text style={styles.buttonText}>Rechazar</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <ConfirmModal
        visible={confirmVisible}
        title={
          confirmType === "ACEPTAR"
            ? "Confirmar aceptación"
            : "Confirmar rechazo"
        }
        message={
          selected
            ? confirmType === "ACEPTAR"
              ? `¿Deseas aceptar la reserva de ${selected.nombre_cliente.toUpperCase()} para la Mesa ${selected.numero_mesa}?`
              : `¿Deseas rechazar la reserva de ${selected.nombre_cliente.toUpperCase()} para la Mesa ${selected.numero_mesa}?`
            : ""
        }
        onCancel={() => setConfirmVisible(false)}
        onConfirm={procesarSolicitud}
        confirmText={
          confirmType === "ACEPTAR" ? "Sí, aceptar" : "Sí, rechazar"
        }
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

      <Modal visible={comprobanteVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.comprobanteCard}>
            <Text style={styles.comprobanteTitle}>Comprobante de pago</Text>
            {comprobanteUrl ? (
              <Image
                source={{ uri: comprobanteUrl }}
                style={styles.comprobanteImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.noSolicitudesText}>
                No se pudo cargar el comprobante.
              </Text>
            )}
            <TouchableOpacity
              style={styles.cerrarComprobanteBtn}
              onPress={cerrarModalComprobante}
            >
              <Text style={styles.cerrarComprobanteText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginTop: 10,
    gap: 8,
    alignItems: "center",
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  buttonText: {
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 15,
  },
  buttonOutlineText: {
    marginLeft: 6,
    color: Colores.azulOscuro,
    fontWeight: "600",
    fontSize: 13,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  comprobanteCard: {
    width: "88%",
    backgroundColor: Colores.blanco,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  comprobanteTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colores.azulOscuro,
    marginBottom: 10,
  },
  comprobanteImage: {
    width: "100%",
    height: 260,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colores.grisClaro,
  },
  cerrarComprobanteBtn: {
    marginTop: 14,
    backgroundColor: Colores.azulOscuro,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cerrarComprobanteText: {
    color: Colores.blanco,
    fontWeight: "700",
    fontSize: 14,
  },
})
