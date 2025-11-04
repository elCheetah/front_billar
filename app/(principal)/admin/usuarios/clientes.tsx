import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const Colores = {
  azul: "#0052FF",
  blanco: "#FFFFFF",
  grisClaro: "#F5F6FA",
  negro: "#000000",
  borde: "#DDE1F1",
  texto: "#333333",
};

export default function Clientes() {
  // Simulación de datos
  const [clientes] = useState([
    { id: 1, nombre: "Juan Pérez", celular: "76543210", accion: "Activo" },
    { id: 2, nombre: "María López", celular: "71234567", accion: "Suspendido" },
    { id: 3, nombre: "Carlos Gómez", celular: "78901234", accion: "Activo" },
    { id: 4, nombre: "Lucía Rivas", celular: "75678901", accion: "Activo" },
  ]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Lista de Clientes</Text>

      {/* Encabezado */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerText, { flex: 2 }]}>Nombre de Cliente</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>Celular</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>Estado</Text>
      </View>

      {/* Filas */}
      {clientes.map((c) => (
        <View key={c.id} style={styles.dataRow}>
          <Text style={[styles.dataText, { flex: 2 }]}>{c.nombre}</Text>
          <Text style={[styles.dataText, { flex: 1 }]}>{c.celular}</Text>
          <Text
            style={[
              styles.dataText,
              { flex: 1, color: c.accion === "Activo" ? "green" : "red", fontWeight: "bold" },
            ]}
          >
            {c.accion}
          </Text>
        </View>
      ))}

      {/* Paginación */}
      <View style={styles.pagination}>
        <Text style={styles.pageBtn}>{"<"}</Text>
        <Text style={styles.pageNumber}>1</Text>
        <Text style={styles.pageBtn}>{">"}</Text>
      </View>

      {/* Buscador (decorativo por ahora) */}
      <Text style={styles.searchLabel}>Buscador:</Text>
      <View style={styles.searchBar}>
        <Text style={styles.placeholder}>🔍 Buscar cliente...</Text>
      </View>
    </ScrollView>
  );
}

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
  searchLabel: {
    fontWeight: "bold",
    color: Colores.negro,
    marginTop: 20,
    marginBottom: 6,
  },
  searchBar: {
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: 6,
    padding: 10,
  },
  placeholder: {
    color: "#888",
  },
});
