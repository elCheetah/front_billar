import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { api } from "../../../components/api";
import { AuthUser, getToken, getUser } from "../../../utils/authStorage";

const Colores = {
  azul: "#0052FF",
  azulClaro: "#E8F1FF",
  verde: "#28A745",
  rojo: "#DC3545",
  amarillo: "#FFC107",
  grisFondo: "#F5F9FF",
  grisTexto: "#666",
  blanco: "#FFFFFF",
  negro: "#000000",
};

type EstadoHist = "Cancelada" | "Finalizada" | "Rechazada";

type ItemHistorial = {
  nombreCliente?: string;
  nombreLocal: string;
  numeroMesa: number;
  tipoMesa: string;
  fechaReserva: string;
  horaInicio: string;
  duracion: string;
  pagoEstimado: number | null;
  pagoQr: { monto: number; comprobante_url: string } | null;
  estado: EstadoHist;
  penalizacion?: string;
  comprobantePagoUrl?: string | null;
  comprobanteReembolsoUrl?: string | null;
  estadoReembolso?: "REEMBOLSADO" | "NO_REEMBOLSADO" | null;
  montoReembolsado?: number | null;
};

type ResHistorial = {
  ok: boolean;
  total: number;
  data: ItemHistorial[];
  message?: string;
};

function hoyLocal00() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function finDeHoyLocal() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function addDaysLocal(d: Date, days: number) {
  const dt = new Date(d.getTime());
  dt.setDate(dt.getDate() + days);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function toYMDLocal(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function capitalizar(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function formatearBs(n: number) {
  const abs = Math.abs(n).toFixed(2);
  return n < 0 ? `-Bs ${abs}` : `Bs ${abs}`;
}

export default function Historial() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const hoy = useMemo(() => hoyLocal00(), []);
  const maximoPermitido = useMemo(() => finDeHoyLocal(), []);
  const minimoPermitido = useMemo(() => addDaysLocal(hoy, -364), [hoy]);

  const [fechaInicio, setFechaInicio] = useState<Date>(() => addDaysLocal(hoy, -31));
  const [fechaFin, setFechaFin] = useState<Date>(() => hoyLocal00());

  const [showInicioPicker, setShowInicioPicker] = useState(false);
  const [showFinPicker, setShowFinPicker] = useState(false);
  const [finPickerKey, setFinPickerKey] = useState(0);

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState<ItemHistorial[]>([]);

  useEffect(() => {
    (async () => {
      const [t, u] = await Promise.all([getToken(), getUser()]);
      if (!t || !u) {
        router.replace("/autenticacion");
        return;
      }
      setToken(t);
      setUser(u);
    })();
  }, [router]);

  const validarRango = useCallback(
    (desde: Date, hasta: Date): string | null => {
      if (hasta.getTime() < desde.getTime()) return "La fecha fin no puede ser menor que la fecha inicio.";
      if (hasta.getTime() > maximoPermitido.getTime()) return "No puedes seleccionar fechas futuras.";
      if (desde.getTime() < minimoPermitido.getTime()) return "El rango máximo permitido es de 1 año.";
      return null;
    },
    [maximoPermitido, minimoPermitido]
  );

  useEffect(() => {
    if (!user || !token) return;

    const err = validarRango(fechaInicio, fechaFin);
    if (err) {
      setError(err);
      setItems([]);
      return;
    }
    setError("");

    let alive = true;

    const run = async () => {
      setLoading(true);
      try {
        const desde = toYMDLocal(fechaInicio);
        const hasta = toYMDLocal(fechaFin);
        const resp = (await api(`/reservas/historial?desde=${desde}&hasta=${hasta}`, { token })) as ResHistorial;
        if (!alive) return;
        setItems(resp?.data ?? []);
      } catch (e: any) {
        if (!alive) return;
        setItems([]);
        setError(e?.message || "No se pudo obtener el historial.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    const t = setTimeout(run, 200);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [user, token, fechaInicio, fechaFin, validarRango]);

  const onChangeInicio = (_: any, selected?: Date) => {
    if (Platform.OS !== "ios") setShowInicioPicker(false);
    if (!selected) return;
    const d = new Date(selected.getTime());
    d.setHours(0, 0, 0, 0);
    setFechaInicio(d);
  };

  const onChangeFin = (_: any, selected?: Date) => {
    if (Platform.OS !== "ios") setShowFinPicker(false);
    if (!selected) return;
    const d = new Date(selected.getTime());
    d.setHours(0, 0, 0, 0);
    setFechaFin(d);
    setFinPickerKey((k) => k + 1);
  };

  const handleBack = () => router.back();

  const isProp = user?.rol === "PROPIETARIO";
  const nombreTitulo = useMemo(() => (user ? user.nombreCompleto : "Usuario"), [user]);

  function getMontoYColor(item: ItemHistorial) {
    const monto = item.pagoEstimado !== null ? item.pagoEstimado : item.pagoQr?.monto ?? 0;
    if (isProp) return { monto, color: Colores.verde };

    if (item.estado === "Cancelada") {
      if (monto < 0) return { monto, color: Colores.rojo };
      return { monto, color: Colores.verde };
    }
    return { monto, color: Colores.verde };
  }

  function getEstadoColor(estado: EstadoHist) {
    if (estado === "Finalizada") return Colores.verde;
    if (estado === "Rechazada") return Colores.amarillo;
    return Colores.rojo;
  }

  const handleExportPDF = async () => {
    try {
      const desde = toYMDLocal(fechaInicio);
      const hasta = toYMDLocal(fechaFin);

      const rows = items
        .map((it) => {
          const { monto } = getMontoYColor(it);
          const montoTxt = formatearBs(monto);
          const penal = it.penalizacion ? ` - ${it.penalizacion}` : "";
          const mesaTxt = `Mesa ${it.numeroMesa} - ${capitalizar(it.tipoMesa)}`;
          const clienteTxt = isProp && it.nombreCliente ? ` - ${it.nombreCliente}` : "";

          const compUrl = it.comprobantePagoUrl ?? it.pagoQr?.comprobante_url ?? null;
          const devUrl = it.comprobanteReembolsoUrl ?? null;

          const compHtml = compUrl ? `<a href="${compUrl}">Ver</a>` : `-`;
          const devHtml = devUrl ? `<a href="${devUrl}">Ver</a>` : `-`;

          return `
            <tr>
              <td>${it.fechaReserva}</td>
              <td>${it.horaInicio}</td>
              <td>${it.duracion}</td>
              <td>${it.nombreLocal}</td>
              <td>${mesaTxt}${clienteTxt}</td>
              <td>${it.estado}${penal}</td>
              <td style="text-align:right;">${montoTxt}</td>
              <td>${compHtml}</td>
              <td>${devHtml}</td>
            </tr>
          `;
        })
        .join("");

      const html = `
        <html>
          <head>
            <meta charset="utf-8"/>
            <style>
              body { font-family: Arial, sans-serif; padding: 16px; }
              h1 { font-size: 18px; margin: 0 0 6px 0; }
              p { margin: 0 0 12px 0; color: #444; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th, td { border: 1px solid #ddd; padding: 8px; }
              th { background: #f2f2f2; text-align: left; }
              a { color: #0052FF; text-decoration: none; }
            </style>
          </head>
          <body>
            <h1>Historial - ${nombreTitulo}</h1>
            <p>Desde ${desde} hasta ${hasta}</p>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Duración</th>
                  <th>Local</th>
                  <th>Mesa</th>
                  <th>Estado</th>
                  <th style="text-align:right;">Monto</th>
                  <th>Comprobante</th>
                  <th>Devolución</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (e: any) {
      setError(e?.message || "No se pudo exportar el PDF.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={Colores.azul} />
      </TouchableOpacity>

      <Text style={styles.titulo}>Historial</Text>

      <View style={styles.filterContainer}>
        <View style={styles.dateSection}>
          <Text style={styles.dateTitle}>Fecha Inicio</Text>
          <TouchableOpacity onPress={() => setShowInicioPicker(true)} style={styles.dateInput}>
            <Text style={styles.dateText}>{toYMDLocal(fechaInicio)}</Text>
          </TouchableOpacity>
          {showInicioPicker && (
            <DateTimePicker
              key={`ini-${fechaInicio.getTime()}`}
              value={new Date(fechaInicio.getTime())}
              mode="date"
              display="default"
              onChange={onChangeInicio}
              minimumDate={new Date(minimoPermitido.getTime())}
              maximumDate={new Date(maximoPermitido.getTime())}
            />
          )}
        </View>

        <View style={styles.dateSection}>
          <Text style={styles.dateTitle}>Fecha Fin</Text>
          <TouchableOpacity
            onPress={() => {
              setFinPickerKey((k) => k + 1);
              setShowFinPicker(true);
            }}
            style={styles.dateInput}
          >
            <Text style={styles.dateText}>{toYMDLocal(fechaFin)}</Text>
          </TouchableOpacity>
          {showFinPicker && (
            <DateTimePicker
              key={`fin-${finPickerKey}-${fechaFin.getTime()}`}
              value={new Date(fechaFin.getTime())}
              mode="date"
              display="default"
              onChange={onChangeFin}
              minimumDate={new Date(minimoPermitido.getTime())}
              maximumDate={new Date(maximoPermitido.getTime())}
            />
          )}
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.pdfButton} onPress={handleExportPDF}>
          <Ionicons name="document" size={20} color={Colores.azul} />
          <Text style={styles.pdfText}>Exportar PDF</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ marginTop: 24, alignItems: "center" }}>
          <ActivityIndicator size="large" color={Colores.azul} />
          <Text style={{ color: Colores.grisTexto, marginTop: 8 }}>Cargando historial…</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {items.length === 0 ? (
            <Text style={{ textAlign: "center", color: Colores.grisTexto, marginTop: 16 }}>
              No hay resultados para el rango seleccionado.
            </Text>
          ) : (
            items.map((reserva, idx) => {
              const { monto, color } = getMontoYColor(reserva);

              const urlComprobante =
                reserva.comprobantePagoUrl ?? reserva.pagoQr?.comprobante_url ?? null;

              const urlDevolucion = reserva.comprobanteReembolsoUrl ?? null;

              const mostrarPenalizacion =
                reserva.estado === "Cancelada" &&
                reserva.estadoReembolso === "REEMBOLSADO" &&
                reserva.penalizacion;

              const mostrarMontoReembolsado =
                reserva.estado === "Cancelada" &&
                reserva.estadoReembolso === "REEMBOLSADO" &&
                reserva.montoReembolsado != null;

              return (
                <View key={`${reserva.fechaReserva}-${idx}`} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.localNombre}>{reserva.nombreLocal}</Text>
                      <Text style={styles.mesaLinea}>
                        {`Mesa ${reserva.numeroMesa} - ${capitalizar(reserva.tipoMesa)}`}
                      </Text>
                      {isProp && reserva.nombreCliente ? (
                        <Text style={styles.clienteLinea}>{reserva.nombreCliente}</Text>
                      ) : null}
                    </View>

                    <View style={styles.estadoWrap}>
                      <View style={[styles.estadoEtiqueta, { backgroundColor: getEstadoColor(reserva.estado) }]}>
                        <Text style={styles.estadoTexto}>{reserva.estado}</Text>
                      </View>

                      {urlComprobante ? (
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => Linking.openURL(urlComprobante)}
                        >
                          <Ionicons name="document-text-outline" size={20} color={Colores.azul} />
                        </TouchableOpacity>
                      ) : null}

                      {urlDevolucion ? (
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => Linking.openURL(urlDevolucion)}
                        >
                          <Ionicons name="repeat-outline" size={20} color={Colores.azul} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color={Colores.azul} />
                    <Text style={styles.infoTexto}>
                      {reserva.fechaReserva} | {reserva.horaInicio}
                    </Text>
                  </View>

                  <Text style={styles.infoTexto}>
                    Duración: <Text style={styles.bold}>{reserva.duracion}</Text>
                  </Text>

                  {reserva.pagoQr ? (
                    <Text style={styles.infoTexto}>
                      Pago: <Text style={styles.bold}>Bs {Number(reserva.pagoQr.monto).toFixed(2)}</Text>
                    </Text>
                  ) : null}

                  {reserva.pagoEstimado !== null ? (
                    <Text style={styles.infoTexto}>
                      Estimado: <Text style={styles.bold}>Bs {Number(reserva.pagoEstimado).toFixed(2)}</Text>
                    </Text>
                  ) : null}

                  {reserva.estado === "Cancelada" && reserva.estadoReembolso ? (
                    <Text style={styles.infoTexto}>
                      Reembolso:{" "}
                      <Text style={styles.bold}>
                        {reserva.estadoReembolso === "REEMBOLSADO" ? "Reembolsado" : "No reembolsado"}
                      </Text>
                    </Text>
                  ) : null}

                  {mostrarMontoReembolsado ? (
                    <Text style={styles.infoTexto}>
                      Monto reembolsado:{" "}
                      <Text style={styles.bold}>Bs {Number(reserva.montoReembolsado).toFixed(2)}</Text>
                    </Text>
                  ) : null}

                  {mostrarPenalizacion ? (
                    <Text style={styles.infoTexto}>
                      Penalización: <Text style={styles.bold}>{reserva.penalizacion}</Text>
                    </Text>
                  ) : null}

                  <View style={styles.precioContainer}>
                    <Text style={[styles.precio, { color }]}>{formatearBs(monto)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

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
    marginBottom: 8,
  },
  dateSection: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateTitle: {
    fontSize: 13,
    color: Colores.grisTexto,
    marginBottom: 5,
  },
  dateInput: {
    height: 40,
    borderColor: Colores.grisTexto,
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: Colores.blanco,
  },
  dateText: {
    color: Colores.negro,
  },
  errorText: {
    color: Colores.rojo,
    fontSize: 12,
    marginBottom: 6,
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 6,
  },
  pdfButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  pdfText: {
    color: Colores.azul,
    fontSize: 14,
    marginLeft: 6,
  },
  scrollView: {
    marginTop: 6,
  },
  card: {
    backgroundColor: Colores.blanco,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  estadoWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    marginLeft: 6,
    padding: 4,
  },
  localNombre: {
    fontWeight: "800",
    color: "#0033A0",
    fontSize: 16,
  },
  mesaLinea: {
    color: Colores.grisTexto,
    marginTop: 2,
    fontSize: 12,
  },
  clienteLinea: {
    color: Colores.grisTexto,
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
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
    marginTop: 4,
    marginBottom: 2,
  },
  infoTexto: {
    color: Colores.grisTexto,
    marginLeft: 4,
    fontSize: 12,
  },
  bold: {
    fontWeight: "bold",
    color: Colores.negro,
  },
  precioContainer: {
    marginTop: 6,
    alignItems: "flex-end",
  },
  precio: {
    fontWeight: "bold",
    fontSize: 16,
  },
});
