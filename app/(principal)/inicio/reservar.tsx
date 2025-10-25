import { AntDesign } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ReservarMesa() {
  const { mesaId } = useLocalSearchParams();
  const router = useRouter();

  const [mostrarQR, setMostrarQR] = useState(false);

  // === Datos simulados ===
  const mesas = [
    {
      id: 1,
      nombre: "Mesa 1",
      tipo: "Americano",
      precio: "Bs 25/hora",
      imagen:
        "https://cdn.pixabay.com/photo/2017/03/20/14/56/pool-table-2157077_1280.jpg",
    },
    {
      id: 2,
      nombre: "Mesa 2",
      tipo: "Inglés",
      precio: "Bs 20/hora",
      imagen:
        "https://cdn.pixabay.com/photo/2016/11/19/16/56/billiards-1839029_1280.jpg",
    },
  ];

  // Buscar mesa según ID
  const mesa = mesas.find((m) => m.id === Number(mesaId)) || mesas[0];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Reservar mesa</Text>

      {/* === Información de la mesa === */}
      <View style={styles.mesaCard}>
        <Image source={{ uri: mesa.imagen }} style={styles.mesaImagen} />
        <View style={styles.mesaInfo}>
          <Text style={styles.mesaNombre}>{mesa.nombre}</Text>
          <Text style={styles.mesaTexto}>Tipo: {mesa.tipo}</Text>
          <Text style={styles.mesaTexto}>Precio: {mesa.precio}</Text>
        </View>
      </View>

      {/* === Selección de fecha/hora === */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fecha</Text>
        <View style={styles.dateBox}>
          <AntDesign name="calendar" size={18} color="#0033CC" />
          <Text style={{ marginLeft: 6 }}>23/09/2025</Text>
        </View>

        <Text style={styles.sectionTitle}>Hora</Text>
        <View style={styles.grid}>
          {[
            "10:00",
            "11:00",
            "12:00",
            "13:00",
            "14:00",
            "15:00",
            "16:00",
            "17:00",
            "18:00",
            "19:00",
            "20:00",
            "21:00",
          ].map((hora) => (
            <TouchableOpacity key={hora} style={styles.horaBtn}>
              <Text>{hora}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Duración</Text>
        <View style={styles.selectBox}>
          <Text>2 horas</Text>
          <AntDesign name="down" size={16} color="#333" />
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total a pagar:</Text>
          <Text style={styles.totalMonto}>Bs 50</Text>
        </View>

        {!mostrarQR ? (
          <TouchableOpacity
            onPress={() => setMostrarQR(true)}
            style={styles.descargarQR}
          >
            <Text style={styles.descargarQRText}>Descargar QR</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.qrContainer}>
            <Image
              source={{
                uri: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ReservaMesa1",
              }}
              style={styles.qrImagen}
            />
            <TouchableOpacity
              style={styles.btnDescargar}
              onPress={() => Alert.alert("QR descargado")}
            >
              <Text style={styles.btnDescargarText}>DESCARGAR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* === Botones finales === */}
      <TouchableOpacity
        style={styles.btn}
        onPress={() => Alert.alert("Subir comprobante")}
      >
        <Text style={styles.btnText}>Subir imagen comprobante</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => Alert.alert("Reserva confirmada")}
      >
        <Text style={styles.btnText}>Confirmar Reservar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: "#D9534F" }]}
        onPress={() => router.back()}
      >
        <Text style={styles.btnText}>Cancelar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* === ESTILOS === */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F9FF", padding: 16 },
  titulo: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#0033A0",
    marginBottom: 10,
  },
  mesaCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    elevation: 3,
  },
  mesaImagen: { width: 80, height: 80, borderRadius: 10, marginRight: 10 },
  mesaInfo: { flex: 1, justifyContent: "center" },
  mesaNombre: { fontWeight: "bold", color: "#0033CC", fontSize: 15 },
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  horaBtn: {
    backgroundColor: "#E6E9FF",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    margin: 3,
  },
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

  descargarQR: { marginTop: 6 },
  descargarQRText: {
    color: "#E63946",
    fontWeight: "600",
    textDecorationLine: "underline",
    textAlign: "right",
  },

  qrContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  qrImagen: {
    width: 180,
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
  },
  btnDescargar: {
    backgroundColor: "#0052FF",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  btnDescargarText: { color: "#FFF", fontWeight: "bold" },

  btn: {
    backgroundColor: "#0052FF",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 5,
  },
  btnText: { color: "#FFF", fontWeight: "bold" },
});
