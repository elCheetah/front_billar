import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// 🎨 Paleta de colores
const Colores = {
  azul: "#0052FF",
  azulOscuro: "#0033CC",
  azulClaro: "#E8F1FF",
  verde: "#28A745",
  rojo: "#DC3545",
  grisFondo: "#F5F9FF",
  grisTexto: "#666",
  blanco: "#FFFFFF",
};

// 🔍 Tipos de filtro simulados
const filtros = ["Todos", "Americano", "Inglés", "Snooker"];

export default function Inicio() {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("Todos");

  // 🧾 Datos simulados de mesas/promociones
  const mesas = [
    {
      id: 1,
      nombre: "Mesa Premium 1",
      tipo: "Americano",
      precio: "Bs25/hora",
      imagen:
        "https://cdn.pixabay.com/photo/2016/11/19/16/56/billiards-1839029_1280.jpg",
      destacado: true,
    },
    {
      id: 2,
      nombre: "Mesa Clásica 2",
      tipo: "Inglés",
      precio: "Bs18/hora",
      imagen:
        "https://cdn.pixabay.com/photo/2017/03/20/14/56/pool-table-2157077_1280.jpg",
      destacado: false,
    },
    {
      id: 3,
      nombre: "Mesa VIP 3",
      tipo: "Snooker",
      precio: "Bs30/hora",
      imagen:
        "https://cdn.pixabay.com/photo/2016/11/19/16/56/billiard-1839027_1280.jpg",
      destacado: true,
    },
  ];

  // 🔍 Filtrado
  const mesasFiltradas = mesas.filter(
    (m) =>
      (filtro === "Todos" || m.tipo === filtro) &&
      m.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Text style={styles.titulo}>Inicio</Text>

      {/* Barra de búsqueda */}
      <View style={styles.barraBusqueda}>
        <Ionicons name="search-outline" size={20} color={Colores.azul} />
        <TextInput
          placeholder="Buscar mesas o locales..."
          placeholderTextColor={Colores.grisTexto}
          style={styles.inputBusqueda}
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtros}>
        {filtros.map((tipo) => (
          <TouchableOpacity
            key={tipo}
            style={[
              styles.filtro,
              filtro === tipo && { backgroundColor: Colores.azul },
            ]}
            onPress={() => setFiltro(tipo)}
          >
            <Text
              style={[
                styles.textoFiltro,
                filtro === tipo && { color: Colores.blanco },
              ]}
            >
              {tipo}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Promociones destacadas */}
      <Text style={styles.subtitulo}>Promociones y Ofertas</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        {mesas
          .filter((m) => m.destacado)
          .map((m) => (
            <View key={m.id} style={styles.cardPromo}>
              <Image source={{ uri: m.imagen }} style={styles.imagenPromo} />
              <View style={styles.infoPromo}>
                <Text style={styles.nombreMesa}>{m.nombre}</Text>
                <Text style={styles.tipoMesa}>{m.tipo}</Text>
                <Text style={styles.precioMesa}>{m.precio}</Text>
              </View>
            </View>
          ))}
      </ScrollView>

      {/* Resultados de búsqueda */}
      <Text style={styles.subtitulo}>Mesas disponibles</Text>
      {mesasFiltradas.map((mesa) => (
        <View key={mesa.id} style={styles.cardMesa}>
          <Image source={{ uri: mesa.imagen }} style={styles.imagenMesa} />
          <View style={styles.infoMesa}>
            <Text style={styles.nombreMesa}>{mesa.nombre}</Text>
            <Text style={styles.tipoMesa}>{mesa.tipo}</Text>
            <Text style={styles.precioMesa}>{mesa.precio}</Text>
          </View>

          <TouchableOpacity style={styles.botonReservar}>
            <Text style={styles.textoBoton}>Reservar</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

// 💅 Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colores.grisFondo,
    padding: 14,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colores.azul,
    textAlign: "center",
    marginBottom: 12,
  },
  barraBusqueda: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colores.blanco,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 10,
  },
  inputBusqueda: {
    marginLeft: 8,
    flex: 1,
    color: "#000",
  },
  filtros: {
    flexDirection: "row",
    marginBottom: 15,
  },
  filtro: {
    backgroundColor: Colores.azulClaro,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 8,
  },
  textoFiltro: {
    color: Colores.azul,
    fontWeight: "600",
  },
  subtitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colores.azulOscuro,
    marginBottom: 8,
  },
  cardPromo: {
    backgroundColor: Colores.blanco,
    borderRadius: 10,
    marginRight: 10,
    width: 180,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  imagenPromo: {
    width: "100%",
    height: 100,
  },
  infoPromo: {
    padding: 8,
  },
  cardMesa: {
    backgroundColor: Colores.blanco,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    elevation: 3,
  },
  imagenMesa: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },
  infoMesa: {
    flex: 1,
    marginLeft: 10,
  },
  nombreMesa: {
    fontWeight: "bold",
    fontSize: 15,
    color: Colores.azul,
  },
  tipoMesa: {
    fontSize: 13,
    color: Colores.grisTexto,
  },
  precioMesa: {
    color: Colores.verde,
    fontWeight: "bold",
    marginTop: 4,
  },
  botonReservar: {
    backgroundColor: Colores.azul,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  textoBoton: {
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 13,
  },
});
