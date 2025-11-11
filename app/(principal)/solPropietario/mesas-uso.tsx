// app/(principal)/mesasEnUso.tsx
import { api } from "@/components/api";
import ConfirmModal from "@/components/modals/ConfirmModal";
import ResultModal from "@/components/modals/ResultModal";
import { getToken } from "@/utils/authStorage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  RefreshControl,
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

type EstadoReserva = "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "FINALIZADA";

interface MesaEnUso {
  id_reserva: number;
  id_mesa: number;
  nombre_local: string;
  numero_mesa: number;
  nombre_cliente: string;
  fecha: string; // dd/mm/yyyy
  hora: string; // HH:mm
  duracion: string; // "X horas"
  monto_pagado: number;
  estado_reserva: EstadoReserva | string;
}

// helpers fecha/hora (solo mostrar lo que viene del back formateado)
function formatearFecha(fechaInput: any): string {
  if (!fechaInput) return "";
  let iso = "";
  if (typeof fechaInput === "string") {
    iso = fechaInput.slice(0, 10); // "YYYY-MM-DD..."
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
    return horaInput.toISOString().slice(11, 16); // HH:mm
  }
  const str = String(horaInput);
  return str.length >= 5 ? str.slice(0, 5) : str;
}

export default function MesasEnUsoScreen() {
  const router = useRouter();

  const [mesas, setMesas] = useState<MesaEnUso[]>([]);
  const [cargando, setCargando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [mesaSeleccionada, setMesaSeleccionada] = useState<MesaEnUso | null>(
    null
  );
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

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

  const cargarMesasEnUso = useCallback(async () => {
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

      // ✅ Backend: GET /api/mesas-en-uso
      const json = await api("/mesasEnUso", { token });
      const lista = (json?.mesasEnUso ?? []) as any[];

      const mapeadas: MesaEnUso[] = lista.map((r) => {
        const fecha = formatearFecha(r.fecha_reserva);
        const hora = formatearHora(r.hora_inicio);
        const duracionHoras = Number(r.duracion_horas ?? 0);
        const duracion =
          duracionHoras === 1 ? "1 hora" : `${duracionHoras} horas`;

        return {
          id_reserva: r.id_reserva,
          id_mesa: r.id_mesa,
          nombre_local: r.nombre_local,
          numero_mesa: r.numero_mesa,
          nombre_cliente: r.nombre_cliente,
          fecha,
          hora,
          duracion,
          monto_pagado: Number(r.monto_pagado ?? 0),
          estado_reserva: r.estado_reserva,
        };
      });

      setMesas(mapeadas);
    } catch (error: any) {
      console.error("Error al cargar mesas en uso:", error);
      mostrarResultado(
        "error",
        "Error al cargar mesas",
        error?.message ||
          "No se pudieron obtener las mesas en uso. Intenta nuevamente."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarMesasEnUso();
    }, [cargarMesasEnUso])
  );

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await cargarMesasEnUso();
    } finally {
      setRefreshing(false);
    }
  }, [cargarMesasEnUso]);

  const solicitarFinalizar = (mesa: MesaEnUso) => {
    setMesaSeleccionada(mesa);
    setConfirmVisible(true);
  };

  const confirmarFinalizar = async () => {
    if (!mesaSeleccionada || finalizando) {
      setConfirmVisible(false);
      return;
    }

    try {
      setConfirmVisible(false);
      setFinalizando(true);

      const token = await getToken();
      if (!token) {
        mostrarResultado(
          "error",
          "Sesión no disponible",
          "No se encontró un token de autenticación. Vuelve a iniciar sesión."
        );
        return;
      }

      // ✅ Backend: PATCH /api/mesas-en-uso/finalizar/:id_reserva
      const resp = await api(
        `/mesasEnUso/finalizar/${mesaSeleccionada.id_reserva}`,
        {
          method: "PATCH",
          token,
        }
      );

      await cargarMesasEnUso();
      setMesaSeleccionada(null);

      mostrarResultado(
        "success",
        "Mesa finalizada",
        resp?.message ||
          "La reserva fue finalizada y la mesa quedó disponible para nuevos clientes."
      );
    } catch (error: any) {
      console.error("Error al finalizar mesa en uso:", error);
      mostrarResultado(
        "error",
        "Error al finalizar mesa",
        error?.message ||
          "Ocurrió un error al finalizar la mesa. Intenta nuevamente."
      );
    } finally {
      setFinalizando(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Botón volver */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={Colores.azul} />
      </TouchableOpacity>

      <Text style={styles.titulo}>Mesas en Uso</Text>

      {/* MODAL CONFIRMAR FINALIZACIÓN */}
      <ConfirmModal
        visible={confirmVisible}
        title="Confirmar finalización"
        message={
          mesaSeleccionada
            ? `¿Deseas finalizar la reserva de ${mesaSeleccionada.nombre_cliente.toUpperCase()} en la Mesa ${
                mesaSeleccionada.numero_mesa
              } del local ${mesaSeleccionada.nombre_local}?`
            : ""
        }
        onCancel={() => setConfirmVisible(false)}
        onConfirm={confirmarFinalizar}
        confirmText={finalizando ? "Finalizando..." : "Sí, finalizar"}
        cancelText="No"
      />

      {/* MODAL RESULTADO */}
      <ResultModal
        visible={resultVisible}
        type={resultType}
        title={resultTitle}
        message={resultMessage}
        buttonText="Aceptar"
        onClose={() => setResultVisible(false)}
      />

      {/* LISTA DE MESAS EN USO */}
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
        {cargando && mesas.length === 0 ? (
          <Text style={styles.noMesasText}>Cargando mesas en uso...</Text>
        ) : mesas.length === 0 ? (
          <Text style={styles.noMesasText}>No hay mesas en uso.</Text>
        ) : (
          mesas.map((mesa) => (
            <View key={mesa.id_reserva} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.mesaNombre}>
                  Mesa {mesa.numero_mesa} / {mesa.nombre_local}
                </Text>
                <View style={styles.estadoEtiqueta}>
                  <Text style={styles.estadoTexto}>Ocupado</Text>
                </View>
              </View>

              <Text style={styles.infoTexto}>
                Cliente:{" "}
                <Text style={styles.bold}>
                  {mesa.nombre_cliente.toUpperCase()}
                </Text>
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

              <View style={styles.precioContainer}>
                <Text style={styles.precio}>
                  Bs{mesa.monto_pagado.toFixed(2)}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: Colores.azulOscuro },
                ]}
                onPress={() => solicitarFinalizar(mesa)}
                disabled={finalizando}
              >
                <Text style={styles.buttonText}>
                  {finalizando ? "Finalizando..." : "Finalizar"}
                </Text>
              </TouchableOpacity>
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
