import React, { useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const Colores = {
  azul: "#0052FF",
  blanco: "#FFFFFF",
  grisClaro: "#F5F6FA",
  negro: "#000000",
  borde: "#DDE1F1",
  texto: "#333333",
  rojo: "#E53935",
};

export default function Locales() {
  const [locales, setLocales] = useState([
    { id: 1, nombre: "Billar Central", celular: "76432100", estado: "Activo" },
    { id: 2, nombre: "El Rinconcito", celular: "71122334", estado: "Suspendido" },
    { id: 3, nombre: "King Pool", celular: "78987654", estado: "Activo" },
    { id: 4, nombre: "Cuevas Club", celular: "75670012", estado: "Activo" },
  ]);

  const [busqueda, setBusqueda] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [localSeleccionado, setLocalSeleccionado] = useState<any>(null);

  const localesFiltrados = locales.filter((l) =>
    l.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirModal = (local: any) => {
    setLocalSeleccionado(local);
    setModalVisible(true);
  };

  const cambiarEstado = (nuevoEstado: string) => {
    setLocales((prev) =>
      prev.map((l) =>
        l.id === localSeleccionado.id ? { ...l, estado: nuevoEstado } : l
      )
    );
    setModalVisible(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Lista de Locales</Text>

      {/* 🔍 BUSCADOR ARRIBA */}
      <Text style={styles.searchLabel}>Buscador:</Text>
      <View style={styles.searchBar}>
        <TextInput
          placeholder="🔍 Buscar local..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {/* 🧾 TABLA */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerText, { flex: 2 }]}>Nombre de Local</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>Celular</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>Estado</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>Acción</Text>
      </View>

      {localesFiltrados.map((l) => (
        <View key={l.id} style={styles.dataRow}>
          <Text style={[styles.dataText, { flex: 2, textAlign: "left" }]}>{l.nombre}</Text>
          <Text style={[styles.dataText, { flex: 1 }]}>{l.celular}</Text>
          <Text
            style={[
              styles.dataText,
              {
                flex: 1,
                color: l.estado === "Activo" ? "green" : Colores.rojo,
                fontWeight: "bold",
              },
            ]}
          >
            {l.estado}
          </Text>
          <TouchableOpacity
            style={[styles.accionBtn, { backgroundColor: Colores.azul }]}
            onPress={() => abrirModal(l)}
          >
            <Text style={styles.accionTxt}>Cambiar</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* PAGINACIÓN */}
      <View style={styles.pagination}>
        <Text style={styles.pageBtn}>{"<"}</Text>
        <Text style={styles.pageNumber}>1</Text>
        <Text style={styles.pageBtn}>{">"}</Text>
      </View>

      {/* 🪟 MODAL CAMBIAR ESTADO */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Cambiar estado del Local</Text>
            <Text style={styles.modalText}>
              Local:{" "}
              <Text style={{ fontWeight: "bold" }}>
                {localSeleccionado?.nombre}
              </Text>
            </Text>
            <Text style={styles.modalText}>
              Estado actual:{" "}
              <Text
                style={{
                  color:
                    localSeleccionado?.estado === "Activo"
                      ? "green"
                      : Colores.rojo,
                  fontWeight: "bold",
                }}
              >
                {localSeleccionado?.estado}
              </Text>
            </Text>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "green" }]}
                onPress={() => cambiarEstado("Activo")}
              >
                <Text style={styles.modalBtnText}>Activar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colores.rojo }]}
                onPress={() => cambiarEstado("Suspendido")}
              >
                <Text style={styles.modalBtnText}>Suspender</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalCerrar, { backgroundColor: Colores.azul }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCerrarTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* ======== ESTILOS ======== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colores.blanco,
    padding: 16,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colores.azul,
    marginBottom: 14,
    textAlign: "center",
  },
  searchLabel: {
    fontWeight: "bold",
    color: Colores.negro,
    marginBottom: 6,
  },
  searchBar: {
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: 6,
    marginBottom: 14,
    backgroundColor: Colores.grisClaro,
  },
  searchInput: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: Colores.grisClaro,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colores.borde,
  },
  headerText: {
    fontWeight: "bold",
    color: Colores.azul,
    textAlign: "center",
    fontSize: 14,
  },
  dataRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colores.borde,
    alignItems: "center",
  },
  dataText: {
    color: Colores.texto,
    fontSize: 14,
    textAlign: "center",
  },
  accionBtn: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 5,
    marginHorizontal: 4,
  },
  accionTxt: {
    color: Colores.blanco,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 13,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    alignItems: "center",
  },
  pageBtn: {
    backgroundColor: Colores.azul,
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  pageNumber: {
    fontWeight: "bold",
    color: Colores.azul,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: Colores.blanco,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontWeight: "bold",
    color: Colores.azul,
    fontSize: 18,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: Colores.texto,
    marginVertical: 3,
  },
  modalBtns: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    borderRadius: 8,
    marginHorizontal: 6,
    paddingVertical: 10,
    alignItems: "center",
  },
  modalBtnText: {
    color: Colores.blanco,
    fontWeight: "bold",
  },
  modalCerrar: {
    marginTop: 14,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  modalCerrarTxt: {
    color: Colores.blanco,
    fontWeight: "bold",
  },
});
