import { Feather } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import MapView, { Callout, Circle, Marker } from "react-native-maps";

export default function Filtros() {
  const router = useRouter();
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [distancia, setDistancia] = useState(5);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const locales = [
    {
      id: 1,
      nombre: "Billar Sacaba Center",
      direccion: "Av. Chapare 456",
      distancia: "1.2 km",
      imagen: "https://cdn.pixabay.com/photo/2017/03/20/14/56/pool-table-2157077_1280.jpg",
      lat: -17.3985,
      lon: -66.0392,
    },
    {
      id: 2,
      nombre: "Billar Don Beto",
      direccion: "Calle Bolívar 123",
      distancia: "0.9 km",
      imagen: "https://cdn.pixabay.com/photo/2016/11/19/16/56/billiards-1839029_1280.jpg",
      lat: -17.396,
      lon: -66.037,
    },
  ];

  const obtenerUbicacion = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Activa el GPS para usar tu ubicación.");
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    setLocation(coords);
    mapRef.current?.animateToRegion({
      ...coords,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  };

  const regionInicial = {
    latitude: location?.latitude || -17.397,
    longitude: location?.longitude || -66.038,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };

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

          <TouchableOpacity style={styles.btnUbicacion} onPress={obtenerUbicacion}>
            <Text style={styles.btnUbicacionText}>Usar mi ubicación</Text>
          </TouchableOpacity>

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

          {/* === MAPA === */}
          <View style={styles.mapContainer}>
            <MapView ref={mapRef} style={styles.map} initialRegion={regionInicial}>
              {/* Círculo de distancia */}
              {location && (
                <Circle
                  center={location}
                  radius={radio}
                  strokeColor="rgba(0, 82, 255, 0.5)"
                  fillColor="rgba(0, 82, 255, 0.1)"
                />
              )}

              {/* Marcador de ubicación actual */}
              {location && <Marker coordinate={location} title="Tu ubicación" pinColor="#0052FF" />}

              {/* Marcadores de locales */}
              {locales.map((local) => (
                <Marker
                  key={local.id}
                  coordinate={{ latitude: local.lat, longitude: local.lon }}
                  title={local.nombre}
                >
                  <Callout tooltip>
                    <View style={styles.popup}>
                      <View style={styles.popupRow}>
                        <Image source={{ uri: local.imagen }} style={styles.popupImagen} />
                        <View style={{ flex: 1, marginLeft: 6 }}>
                          <Text style={styles.popupNombre}>{local.nombre}</Text>
                          <Text style={styles.popupDireccion}>{local.direccion}</Text>
                          <Text style={styles.popupDistancia}>{local.distancia}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.popupBtn}
                        onPress={() => router.push(`/(principal)/inicio/mesas?id=${local.id}`)} // ✅ corregido
                      >
                        <Text style={styles.popupBtnText}>Ver mesas disponibles</Text>
                      </TouchableOpacity>
                    </View>
                  </Callout>
                </Marker>
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
          <TouchableOpacity
            style={styles.btnVerMesas}
            onPress={() => router.push(`/(principal)/inicio/mesas?id=${local.id}`)} // ✅ corregido
          >
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
  linkText: { color: "#E63946", fontWeight: "600", fontSize: 12, textDecorationLine: "underline" },
  mapContainer: { height: 250, borderRadius: 12, overflow: "hidden" },
  map: { flex: 1 },
  popup: {
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    elevation: 6,
  },
  popupRow: { flexDirection: "row", marginBottom: 6 },
  popupImagen: { width: 50, height: 50, borderRadius: 8, backgroundColor: "#ccc" },
  popupNombre: { fontWeight: "700", color: "#0033A0", fontSize: 13 },
  popupDireccion: { fontSize: 11, color: "#555" },
  popupDistancia: { fontSize: 11, color: "#777" },
  popupBtn: { backgroundColor: "#0052FF", borderRadius: 6, paddingVertical: 5, alignItems: "center", marginTop: 4 },
  popupBtnText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  buttonsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
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
  card: { backgroundColor: "#FFF", borderRadius: 10, padding: 10, marginBottom: 12, elevation: 3 },
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
