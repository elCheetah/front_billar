import { AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
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
  // ✅ Recibimos los parámetros enviados desde Mesas
  const { mesaId, localId } = useLocalSearchParams();
  const router = useRouter();

  // ✅ Definimos variable que guarda el id actual del local
  const idLocalActual = localId;

  const [mostrarQR, setMostrarQR] = useState(false);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [fecha, setFecha] = useState(new Date());
  const [imagenComprobante, setImagenComprobante] = useState<string | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  const [duracion, setDuracion] = useState<string>("");

  // === Mesas simuladas ===
  const mesas = [
    {
      id: 1,
      nombre: "Mesa 1",
      tipo: "Americano",
      precio: 25,
      imagenes:
        "https://cdn.pixabay.com/photo/2017/03/20/14/56/pool-table-2157077_1280.jpg",//aqui va recuperarse varias imagenes eso encima de todo se va mostrar un carousel que cambia en tiempo de 3 segundos cada uno automaticamente
      horasDisponibles: ["10:00", "12:00", "14:00", "16:00", "18:00", "19:00"],
    },
    {
      id: 2,
      nombre: "Mesa 2",
      tipo: "Inglés",
      precio: 20,
      imagen:
        "https://cdn.pixabay.com/photo/2016/11/19/16/56/billiards-1839029_1280.jpg",
      horasDisponibles: ["11:00", "13:00", "15:00", "17:00", "20:00"],
    },
  ];

  const mesa = mesas.find((m) => m.id === Number(mesaId)) || mesas[0];

  // === Funciones ===
  const onChangeFecha = (event: any, selectedDate?: Date) => {
    setMostrarCalendario(false);
    if (selectedDate) {
      const hoy = new Date();
      const diferencia = (selectedDate.getTime() - hoy.getTime()) / (1000 * 3600 * 24);
      if (diferencia < 1) {
        Alert.alert("Error", "Solo puedes reservar con al menos un día de anticipación.");
        return;
      }
      setFecha(selectedDate);
    }
  };

  const seleccionarHora = (hora: string) => {
    setHoraSeleccionada(hora);
    setDuracion("1 hora");
  };

  const subirImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso denegado", "Debes permitir el acceso a tus fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImagenComprobante(result.assets[0].uri);
    }
  };

  const eliminarImagen = () => setImagenComprobante(null);

  // === Render ===
  return (
    <ScrollView style={styles.container}>
      {/* === FLECHA SIMPLE DE RETROCESO === */}
      {/* === Encabezado con flecha y texto centrado === */}
<View
  style={{
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // 👈 centra horizontalmente el texto
    marginBottom: 10,
  }}
>
  <TouchableOpacity
    onPress={() =>
      router.push({
        pathname: "/(principal)/inicio/mesas",
        params: { id: idLocalActual }, // ✅ vuelve al local correcto
      })
    }
    style={{ position: "absolute", left: 0 }} // 👈 mantiene la flecha en su sitio
  >
    <AntDesign name="arrow-left" size={24} color="#0033CC" />
  </TouchableOpacity>

  <Text
    style={{
      fontSize: 18,
      fontWeight: "bold",
      color: "#0033CC",
      textAlign: "center",
    }}
  >
    Reservar mesa
  </Text>
</View>


      {/* === Información de la mesa === */}
      <View style={styles.mesaCard}>
        <Image source={{ uri: mesa.imagen }} style={styles.mesaImagen} />
        <View style={styles.mesaInfo}>
          <Text style={styles.mesaNombre}>{mesa.nombre}</Text>
          <Text style={styles.mesaTexto}>Tipo: {mesa.tipo}</Text>
          <Text style={styles.mesaTexto}>Precio: Bs {mesa.precio}/hora</Text>
        </View>
      </View>

      {/* === Fecha y hora === */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fecha</Text>

        <TouchableOpacity
          style={styles.dateBox}
          onPress={() => setMostrarCalendario(true)}
        >
          <AntDesign name="calendar" size={18} color="#0033CC" />
          <Text style={{ marginLeft: 6 }}>{fecha.toLocaleDateString("es-ES")}</Text>
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

        <Text style={styles.sectionTitle}>Hora</Text>
        <View style={styles.grid}>
          {mesa.horasDisponibles.map((hora) => (
            <TouchableOpacity
              key={hora}
              style={[
                styles.horaBtn,
                horaSeleccionada === hora && styles.horaBtnSelected,
              ]}
              onPress={() => seleccionarHora(hora)}
            >
              <Text
                style={
                  horaSeleccionada === hora
                    ? styles.horaTextSelected
                    : styles.horaText
                }
              >
                {hora}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Duración</Text>
        <View style={styles.selectBox}>
          <Text>{duracion || "Selecciona una hora"}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total a pagar:</Text>
          <Text style={styles.totalMonto}>
            Bs {horaSeleccionada ? mesa.precio : 0}
          </Text>
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

      {/* === Comprobante === */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comprobante de pago</Text>

        {imagenComprobante ? (
          <View style={styles.imagenContainer}>
            <Image
              source={{ uri: imagenComprobante }}
              style={styles.imagenComprobante}
            />
            <TouchableOpacity onPress={eliminarImagen} style={styles.btnEliminar}>
              <Text style={{ color: "#FFF" }}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={subirImagen} style={styles.uploadBox}>
            <AntDesign name="upload" size={22} color="#0052FF" />
            <Text style={{ color: "#0052FF", marginLeft: 6 }}>
              Subir imagen comprobante
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* === Botones === */}
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
  btnText: { color: "#FFF", fontWeight: "bold" },
});
