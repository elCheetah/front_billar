import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const Colores = {
  azul: "#0052FF",
  blanco: "#FFFFFF",
  grisClaro: "#E6E9FF",
  negro: "#000000",
  rojo: "#E53935",
};

export default function Clientes() {
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [estado, setEstado] = useState<"activo" | "suspendido" | null>(null);

  const handleSuspender = () => {
    setEstado("suspendido");
    alert(`Cliente ${nombre || "sin nombre"} suspendido`);
  };

  const handleActivar = () => {
    setEstado("activo");
    alert(`Cliente ${nombre || "sin nombre"} activado`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 1. Nombre */}
      <Text style={styles.label}>
        1. <Text style={styles.bold}>Nombre de Cliente:</Text>
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Ingrese nombre del cliente"
        value={nombre}
        onChangeText={setNombre}
      />

      {/* 2. Celular */}
      <Text style={styles.label}>
        2. <Text style={styles.bold}>Celular:</Text>
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Ingrese número de celular"
        keyboardType="phone-pad"
        value={celular}
        onChangeText={setCelular}
      />

      {/* 3. Acción */}
      <Text style={styles.label}>
        3. <Text style={styles.bold}>Acción:</Text>
      </Text>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: Colores.rojo }]}
          onPress={handleSuspender}
        >
          <Text style={styles.buttonText}>Suspender</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: Colores.azul }]}
          onPress={handleActivar}
        >
          <Text style={styles.buttonText}>Activar</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Paginación */}
      <Text style={styles.label}>
        4. <Text style={styles.bold}>Paginación</Text>
      </Text>
      <View style={styles.pagination}>
        <TouchableOpacity style={styles.pageButton}>
          <Text style={styles.pageText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.pageNumber}>1</Text>
        <TouchableOpacity style={styles.pageButton}>
          <Text style={styles.pageText}>{">"}</Text>
        </TouchableOpacity>
      </View>

      {/* 5. Buscador */}
      <Text style={styles.label}>
        5. <Text style={styles.bold}>Buscador</Text>
      </Text>
      <TextInput style={styles.input} placeholder="Buscar cliente..." />

      {/* Estado actual */}
      {estado && (
        <Text
          style={[
            styles.estado,
            { color: estado === "activo" ? "green" : Colores.rojo },
          ]}
        >
          Estado actual: {estado === "activo" ? "Activo ✅" : "Suspendido ⛔"}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: Colores.blanco,
  },
  label: {
    fontSize: 16,
    color: Colores.negro,
    marginTop: 10,
    marginBottom: 5,
  },
  bold: {
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: Colores.azul,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colores.grisClaro,
    fontSize: 15,
  },
  buttonGroup: {
    marginTop: 10,
    marginBottom: 15,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 16,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  pageButton: {
    backgroundColor: Colores.azul,
    borderRadius: 6,
    padding: 8,
  },
  pageText: {
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 16,
  },
  pageNumber: {
    marginHorizontal: 15,
    fontWeight: "bold",
    fontSize: 16,
  },
  estado: {
    marginTop: 15,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
});
