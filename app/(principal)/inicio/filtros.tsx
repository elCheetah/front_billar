import { Feather } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import React, { useRef, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";

export default function Inicio() {
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [distancia, setDistancia] = useState(5); // kilómetros
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const locales = [
    {
      id: 1,
      nombre: "Billar Club Premium",
      direccion: "Av. Principal 123",
      distancia: "2.3 km",
      imagen: "https://cdn.pixabay.com/photo/2017/03/20/14/56/pool-table-2157077_1280.jpg",
      lat: -17.7835,
      lon: -63.1821,
    },
    {
      id: 2,
      nombre: "Billar La 8 Dorada",
      direccion: "Calle Sucre N°45",
      distancia: "1.1 km",
      imagen: "https://cdn.pixabay.com/photo/2016/11/19/16/56/billiards-1839029_1280.jpg",
      lat: -17.784,
      lon: -63.18,
    },
  ];

  // === Pedir permiso y obtener ubicación ===
  const obtenerUbicacion = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Activa el GPS para usar tu ubicación.");
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    const coords = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
    setLocation(coords);
    mapRef.current?.animateToRegion({
      ...coords,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  };

  // === Coordenadas iniciales si no hay GPS aún ===
  const regionInicial = {
    latitude: location?.latitude || -17.7835,
    longitude: location?.longitude || -63.1821,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };

  // === Radio del círculo (metros) ===
  const radio = distancia * 1000;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* === Barra de búsqueda === */}
      <View style={styles.searchContainer}>
        <TextInput style={styles.input} placeholder="Buscar local..." placeholderTextColor="#888" />
        <TouchableOpacity style={styles.filterBtn} onPress={() => setMostrarFiltros(!mostrarFiltros)}>
          <Feather name="sliders" size={20} color="#0052FF" />
        </TouchableOpacity>
      </View>

      {/* === FILTROS === */}
      {mostrarFiltros && (
        <View style={styles.filtrosContainer}>
          <Text style={styles.filtroTitulo}>Filtros</Text>

          {/* Botón ubicación */}
          <TouchableOpacity style={styles.btnUbicacion} onPress={obtenerUbicacion}>
            <Text style={styles.btnUbicacionText}>Usar mi ubicación</Text>
          </TouchableOpacity>

          {/* Botones de opciones */}
          <View style={styles.filtrosRow}>
            <TouchableOpacity style={styles.filtroBtn}>
              <Text style={styles.filtroText}>Distancia: {distancia.toFixed(1)} Km</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.filtroBtn}>
              <Text style={styles.filtroText}>Tipo de mesa</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.linkText}>Borrar filtros</Text>
            </TouchableOpacity>
          </View>

          {/* Slider de distancia */}
          <View style={{ marginVertical: 8 }}>
            <Slider
              style={{ width: "100%", height: 40 }}
              minimumValue={1}
              maximumValue={20}
              step={0.5}
              value={distancia}
              minimumTrackTintColor="#0052FF"
              maximumTrackTintColor="#D0D0D0"
              thumbTintColor="#0052FF"
              onValueChange={(value) => setDistancia(value)}
            />
          </View>

          {/* Mapa */}
          <View style={styles.mapContainer}>
            <MapView ref={mapRef} style={styles.map} initialRegion={regionInicial}>
              {/* Circulo de distancia */}
              {location && (
                <Circle
                  center={location}
                  radius={radio}
                  strokeColor="rgba(0, 82, 255, 0.5)"
                  fillColor="rgba(0, 82, 255, 0.1)"
                />
              )}

              {/* Marcador ubicación actual */}
              {location && <Marker coordinate={location} title="Tu ubicación" pinColor="#0052FF" />}

              {/* Marcadores de locales */}
              {locales.map((local) => (
                <Marker
                  key={local.id}
                  coordinate={{ latitude: local.lat, longitude: local.lon }}
                  title={local.nombre}
                  description={local.direccion}
                />
              ))}
            </MapView>
          </View>
        </View>
      )}

      {/* === Botones principales === */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.optionBtn}>
          <Text style={styles.optionText}>Locales disponibles</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionBtn}>
          <Text style={styles.optionText}>Mapa</Text>
        </TouchableOpacity>
      </View>

      {/* === Lista de locales === */}
      {locales.map((local) => (
        <View key={local.id} style={styles.card}>
          <Image source={{ uri: local.imagen }} style={styles.cardImage} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{local.nombre}</Text>
            <Text style={styles.cardSubtitle}>{local.direccion}</Text>
            <Text style={styles.cardSubtitle}>{local.distancia}</Text>
          </View>
          <TouchableOpacity style={styles.btnVerMesas}>
            <Text style={styles.btnVerMesasText}>Ver mesas disponibles</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

/* === ESTILOS === */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F9FF", padding: 14 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 12,
    elevation: 2,
  },
  input: { flex: 1, padding: 10, fontSize: 14, color: "#222" },
  filterBtn: { backgroundColor: "#E9F0FF", padding: 8, borderRadius: 8 },

  filtrosContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    elevation: 3,
  },
  filtroTitulo: { fontWeight: "bold", fontSize: 15, marginBottom: 6 },
  btnUbicacion: {
    backgroundColor: "#0052FF",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  btnUbicacionText: { color: "#FFF", fontWeight: "600" },
  filtrosRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  filtroBtn: {
    backgroundColor: "#D9E6FF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 5,
  },
  filtroText: { color: "#0033CC", fontWeight: "600", fontSize: 12 },
  linkText: {
    color: "#E63946",
    fontWeight: "600",
    fontSize: 12,
    textDecorationLine: "underline",
  },

  mapContainer: { height: 220, borderRadius: 12, overflow: "hidden" },
  map: { flex: 1 },

  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  optionBtn: {
    backgroundColor: "#0052FF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  optionText: { color: "#FFF", fontWeight: "600" },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    elevation: 3,
  },
  cardImage: { width: "100%", height: 130, borderRadius: 10 },
  cardInfo: { marginTop: 8 },
  cardTitle: { fontSize: 15, fontWeight: "bold", color: "#0033CC" },
  cardSubtitle: { fontSize: 12, color: "#555" },
  btnVerMesas: {
    backgroundColor: "#0052FF",
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  btnVerMesasText: { color: "#FFF", fontWeight: "bold" },
});
