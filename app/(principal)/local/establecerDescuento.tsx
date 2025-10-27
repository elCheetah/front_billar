import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { api } from "../../../components/api";
import ConfirmModal from "../../../components/modals/ConfirmModal";
import ResultModal from "../../../components/modals/ResultModal";
import { getToken } from "../../../utils/authStorage";

const Colores = {
  primario: "#0066FF",
  primarioOscuro: "#0033A0",
  verde: "#2A9D8F",
  fondo: "#F4F7FB",
  textoClaro: "#FFFFFF",
  borde: "#E0E0E0",
  error: "#FF4B4B",
  gris: "#888",
  plomo: "#666",
};

export default function MiDescuentoLocal() {
  const [descuento, setDescuento] = useState<number>(0);
  const [nuevoDescuento, setNuevoDescuento] = useState<string>("");
  const [errorInput, setErrorInput] = useState<string>("");
  const [estado, setEstado] = useState<"vigente" | "sin">("sin");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [confirmGuardar, setConfirmGuardar] = useState(false);
  const [confirmReiniciar, setConfirmReiniciar] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; title: string; msg: string } | null>(null);

  /* === Cargar descuento actual === */
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const data = await api("/local/descuento", {token: token || undefined });
        setDescuento(Number(data.descuento_global || 0));
        setEstado(data.descuento_global > 0 ? "vigente" : "sin");
      } catch (e: any) {
        setResult({
          type: "error",
          title: "Error al cargar",
          msg: e.message || "No se pudo obtener el descuento del local.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* === Información dinámica === */
  const info = useMemo(() => {
    if (estado === "vigente") {
      return {
        color: Colores.verde,
        icon: "checkmark-circle-outline",
        titulo: "Descuento vigente",
        texto: `Tu local tiene un descuento activo del ${descuento}%. Este beneficio se aplica automáticamente al realizar reservas.`,
      };
    } else {
      return {
        color: Colores.plomo,
        icon: "information-circle-outline",
        titulo: "Sin descuento activo",
        texto: "Actualmente no tienes un descuento configurado. Puedes establecer uno para ofrecer beneficios a tus clientes.",
      };
    }
  }, [estado, descuento]);

  /* === Validación del input === */
  const handleChange = (text: string) => {
    setNuevoDescuento(text);
    if (text.trim() === "") {
      setErrorInput("");
      return;
    }
    const num = Number(text);
    if (!/^\d+(\.\d+)?$/.test(text)) {
      setErrorInput("Solo se permiten números entre 1 y 100.");
    } else if (isNaN(num) || num < 1 || num > 100) {
      setErrorInput("El descuento debe estar entre 1% y 100%.");
    } else {
      setErrorInput("");
    }
  };

  /* === Guardar nuevo descuento === */
  const guardarDescuento = async () => {
    try {
      setConfirmGuardar(false);
      setGuardando(true);
      const token = await getToken();

      const valor = parseFloat(nuevoDescuento);
      const data = await api("/local/descuento", {
        method: "PUT",
        token: token || undefined,
        body: { descuento: valor },
      });

      setDescuento(data.descuento_global);
      setEstado(data.descuento_global > 0 ? "vigente" : "sin");
      setNuevoDescuento("");
      setResult({
        type: "success",
        title: "Descuento actualizado",
        msg: data.message || `Nuevo descuento aplicado: ${valor}%.`,
      });
    } catch (e: any) {
      setResult({
        type: "error",
        title: "Error",
        msg: e.message || "No se pudo actualizar el descuento.",
      });
    } finally {
      setGuardando(false);
    }
  };

  /* === Restablecer descuento === */
  const reiniciarDescuento = async () => {
    try {
      setConfirmReiniciar(false);
      setGuardando(true);
      const token = await getToken();
      const data = await api("/local/descuento", { method: "DELETE", token: token || undefined });

      setDescuento(0);
      setEstado("sin");
      setResult({
        type: "success",
        title: "Descuento restablecido",
        msg: data.message || "El descuento fue eliminado correctamente.",
      });
    } catch (e: any) {
      setResult({
        type: "error",
        title: "Error",
        msg: e.message || "No se pudo restablecer el descuento.",
      });
    } finally {
      setGuardando(false);
    }
  };

  const hayCambios = nuevoDescuento.trim() !== "" && !errorInput;

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colores.primario} />
        <Text style={{ color: Colores.primarioOscuro, marginTop: 8 }}>Cargando descuento...</Text>
      </View>
    );
  }

  /* === UI principal === */
  return (
    <View style={{ flex: 1, backgroundColor: Colores.fondo }}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.contenedor}>
          <Text style={styles.titulo}>Descuento del Local</Text>

          {/* Porcentaje grande */}
          <View style={styles.boxPorcentaje}>
            <Text
              style={[
                styles.porcentajeGrande,
                { color: descuento > 0 ? Colores.verde : Colores.plomo },
              ]}
            >
              {descuento}%
            </Text>
          </View>

          {/* Información dinámica */}
          <View style={[styles.infoCard, { borderLeftColor: info.color, borderLeftWidth: 4 }]}>
            <Ionicons name={info.icon as any} size={26} color={info.color} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: info.color }]}>{info.titulo}</Text>
              <Text style={styles.infoTxt}>{info.texto}</Text>
            </View>
          </View>

          {/* Campo input */}
          <Text style={styles.label}>Porcentaje de descuento</Text>
          <TextInput
            style={[
              styles.input,
              errorInput ? { borderColor: Colores.error } : {},
            ]}
            placeholder="Ej. 10 para 10%"
            keyboardType="numeric"
            value={nuevoDescuento}
            onChangeText={handleChange}
          />
          {!!errorInput && <Text style={styles.errorText}>{errorInput}</Text>}

          {/* Botones */}
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: Colores.primario }]}
              disabled={!hayCambios || guardando}
              onPress={() => setConfirmGuardar(true)}
            >
              {guardando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={styles.btnTxt}>Guardar</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn,
                { backgroundColor: "#fff", borderWidth: 1, borderColor: Colores.borde },
              ]}
              disabled={guardando}
              onPress={() => setConfirmReiniciar(true)}
            >
              <Ionicons name="refresh-outline" size={18} color={Colores.primarioOscuro} />
              <Text style={[styles.btnTxt, { color: Colores.primarioOscuro }]}>Restablecer</Text>
            </TouchableOpacity>
          </View>

          {/* Nota profesional */}
          <View style={styles.notaCard}>
            <Ionicons name="bulb-outline" size={20} color={Colores.primario} />
            <Text style={styles.notaTxt}>
              Los descuentos se aplican automáticamente al momento de crear reservas. Puedes modificarlos o
              restablecerlos en cualquier momento.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modales */}
      <ConfirmModal
        visible={confirmGuardar}
        title="Confirmar cambio"
        message={`¿Deseas aplicar un nuevo descuento del ${nuevoDescuento || 0}% a tu local?`}
        cancelText="Cancelar"
        confirmText="Sí, guardar"
        onCancel={() => setConfirmGuardar(false)}
        onConfirm={guardarDescuento}
      />

      <ConfirmModal
        visible={confirmReiniciar}
        title="Restablecer descuento"
        message="¿Seguro que deseas eliminar el descuento vigente?"
        cancelText="Cancelar"
        confirmText="Sí, restablecer"
        onCancel={() => setConfirmReiniciar(false)}
        onConfirm={reiniciarDescuento}
      />

      <ResultModal
        visible={!!result}
        type={result?.type === "success" ? "success" : "error"}
        title={result?.title || ""}
        message={result?.msg || ""}
        onClose={() => setResult(null)}
      />
    </View>
  );
}

/* =================== ESTILOS =================== */
const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  contenedor: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 },
  titulo: { fontSize: 20, fontWeight: "bold", color: Colores.primarioOscuro, marginBottom: 12 },

  boxPorcentaje: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 25,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 2,
  },
  porcentajeGrande: { fontSize: 60, fontWeight: "bold", textAlign: "center" },

  infoCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colores.borde,
    padding: 12,
    gap: 10,
    marginBottom: 20,
  },
  infoTitle: { fontWeight: "bold", fontSize: 15, marginBottom: 4 },
  infoTxt: { color: "#444", fontSize: 13 },

  label: { fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#222" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#111",
  },
  errorText: {
    color: Colores.error,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 6,
  },

  row: { flexDirection: "row", gap: 10, marginTop: 16 },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  btnTxt: { color: "#fff", fontWeight: "bold" },

  notaCard: {
    marginTop: 20,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colores.borde,
    flexDirection: "row",
    gap: 8,
  },
  notaTxt: { flex: 1, color: "#333", fontSize: 12 },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colores.fondo,
  },
});
