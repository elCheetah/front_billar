import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// 🎨 Paleta de colores
const Colores = {
  azul: "#0052FF",
  azulClaro: "#E8F1FF",
  verde: "#28A745",
  rojo: "#DC3545",
  grisFondo: "#F5F9FF",
  grisTexto: "#666",
  blanco: "#FFFFFF",
  amarillo: "#FFC107",
};

export default function ReservarMesa() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // recibe el ID de la mesa
  const [fecha, setFecha] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [duracion, setDuracion] = useState<number | null>(null);

  const precioPorHora = 25; // simulado

  const total = duracion ? duracion * precioPorHora : 0;
  const anticipo = total * 0.35;

  const confirmarReserva = () => {
    if (!fecha || !hora || !duracion) {
      Alert.alert("Campos incompletos", "Selecciona fecha, hora y duración.");
      return;
    }

    Alert.alert(
      "Reserva Confirmada",
      `Mesa ${id} reservada para el ${fecha} a las ${hora}\nDuración: ${duracion} h\nTotal: Bs${total}\nAnticipo: Bs${anticipo.toFixed(
        2
      )}`,
      [{ text: "OK", onPress: () => router.replace("/(principal)/reservas") }]
    );
  };

  // 🔹 Opciones simuladas
  const fechas = ["12/10/2025", "13/10/2025", "14/10/2025"];
  const horas = ["16:00", "17:00", "18:00", "19:00"];
  const duraciones = [1, 2, 3];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Reservar Mesa #{id}</Text>

      {/* Sección fecha */}
      <Text style={styles.subtitulo}>Selecciona una fecha</Text>
      <View style={styles.opcionesRow}>
        {fechas.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.opcion,
              fecha === f && { backgroundColor: Colores.azul },
            ]}
            onPress={() => setFecha(f)}
          >
            <Text
              style={[
                styles.textoOpcion,
                fecha === f && { color: Colores.blanco },
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sección hora */}
      <Text style={styles.subtitulo}>Selecciona una hora</Text>
      <View style={styles.opcionesRow}>
        {horas.map((h) => (
          <TouchableOpacity
            key={h}
            style={[
              styles.opcion,
              hora === h && { backgroundColor: Colores.azul },
            ]}
            onPress={() => setHora(h)}
          >
            <Text
              style={[
                styles.textoOpcion,
                hora === h && { color: Colores.blanco },
              ]}
            >
              {h}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Duración */}
      <Text style={styles.subtitulo}>Duración (horas)</Text>
      <View style={styles.opcionesRow}>
        {duraciones.map((d) => (
          <TouchableOpacity
            key={d}
            style={[
              styles.opcion,
              duracion === d && { backgroundColor: Colores.azul },
            ]}
            onPress={() => setDuracion(d)}
          >
            <Text
              style={[
                styles.textoOpcion,
                duracion === d && { color: Colores.blanco },
              ]}
            >
              {d} h
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Resumen */}
      <View style={styles.resumen}>
        <Text style={styles.resumenTexto}>
          <Ionicons name="cash-outline" size={18} color={Colores.azul} /> Total:{" "}
          <Text style={styles.negrita}>Bs{total}</Text>
        </Text>
        <Text style={styles.resumenTexto}>
          Anticipo (35%): <Text style={styles.negrita}>Bs{anticipo.toFixed(2)}</Text>
        </Text>
      </View>

      {/* Botones */}
      <View style={styles.botonesRow}>
        <TouchableOpacity
          style={[styles.boton, styles.botonVerde]}
          onPress={confirmarReserva}
        >
          <Text style={styles.textoBoton}>Confirmar Reserva</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.boton, styles.botonRojo]}
          onPress={() => router.back()}
        >
          <Text style={styles.textoBoton}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// 💅 Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colores.grisFondo,
    padding: 16,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colores.azul,
    textAlign: "center",
    marginBottom: 15,
  },
  subtitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: Colores.azul,
    marginTop: 15,
    marginBottom: 6,
  },
  opcionesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  opcion: {
    backgroundColor: Colores.azulClaro,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  textoOpcion: {
    color: Colores.azul,
    fontWeight: "600",
  },
  resumen: {
    marginTop: 25,
    backgroundColor: Colores.blanco,
    padding: 12,
    borderRadius: 10,
    elevation: 2,
  },
  resumenTexto: {
    color: Colores.grisTexto,
    fontSize: 14,
    marginBottom: 4,
  },
  negrita: {
    color: "#000",
    fontWeight: "bold",
  },
  botonesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 25,
    marginBottom: 30,
  },
  boton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  botonVerde: {
    backgroundColor: Colores.verde,
  },
  botonRojo: {
    backgroundColor: Colores.rojo,
  },
  textoBoton: {
    color: Colores.blanco,
    fontWeight: "bold",
  },
});
