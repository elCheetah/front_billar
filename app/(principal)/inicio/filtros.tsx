import { Feather, Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  LayoutChangeEvent,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Circle, Marker, Region } from "react-native-maps";

/* ---------- colores compartidos ---------- */
const Colores = {
  azul: "#0052FF",
  azulClaro: "#E8F1FF",
  verde: "#28A745",
  rojo: "#DC3545",
  amarillo: "#FFC107",
  grisFondo: "#F5F9FF",
  grisTexto: "#666",
  blanco: "#FFFFFF",
  negro: "#000000",
};

/* ---------- tipos ---------- */
type TipoMesa = "POOL" | "CARAMBOLA" | "SNOOKER" | "MIXTO";
const TIPOS: TipoMesa[] = ["POOL", "CARAMBOLA", "SNOOKER", "MIXTO"];

type Local = {
  id: number;
  nombre: string;
  direccion: string;
  tiposDeMesa: TipoMesa[];
  distancia: string;
  imagen: string;
  horarios: Record<string, { hora_apertura: string; hora_cierre: string }[]>;
  estadoActual: "abierto" | "cerrado";
  lat: number;
  lon: number;
};

const CENTER_CBBA = { latitude: -17.3895, longitude: -66.1568 };

/* util */
const toRad = (deg: number) => (deg * Math.PI) / 180;
const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export default function Filtros() {
  const router = useRouter();

  /* UI: modos/filtros */
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [modoMapa, setModoMapa] = useState(false);
  const [distancia, setDistancia] = useState(5);
  const [tiposSeleccionados, setTiposSeleccionados] = useState<TipoMesa[]>([]);
  const [busqueda, setBusqueda] = useState("");

  /* ubicación */
  const [location, setLocation] = useState(CENTER_CBBA);
  const [usandoUbicacionReal, setUsandoUbicacionReal] = useState(false);

  /* refs/map layout */
  const mapRef = useRef<MapView | null>(null);
  const [mapLayout, setMapLayout] = useState({ x: 0, y: 0, w: 1, h: 1 });

  /* popup anclado */
  const [activeLocal, setActiveLocal] = useState<Local | null>(null);
  const [bubblePos, setBubblePos] = useState<{ x: number; y: number } | null>(null);
  const BUBBLE_W = 300; // ancho fijo para clamp consistente
  const BUBBLE_H = 210; // alto aprox de la card
  const BUBBLE_OFFSET_Y = 56; // separación visual encima del pin
  const BUBBLE_PADDING = 8; // margen interior respecto al contenedor del mapa

  /* modales */
  const [modalHorarios, setModalHorarios] = useState<{ visible: boolean; local?: Local }>({
    visible: false,
  });
  const [modalTipos, setModalTipos] = useState(false);

  /* mock data */
  const locales: Local[] = [
    {
      id: 1,
      nombre: "Billar Sacaba Center",
      direccion: "Av. Chapare 456",
      tiposDeMesa: ["POOL", "CARAMBOLA"],
      distancia: "1.2 km",
      imagen:
        "https://res.cloudinary.com/dbdtskhuk/image/upload/v1761091247/billar/mesas/esudnjify8sdesalymiu.jpg",
      horarios: {
        LUNES: [{ hora_apertura: "10:00", hora_cierre: "23:00" }],
        MARTES: [],
        MIERCOLES: [],
        JUEVES: [],
        VIERNES: [],
        SABADO: [],
        DOMINGO: [],
      },
      estadoActual: "abierto",
      lat: -17.3985,
      lon: -66.0392,
    },
    {
      id: 2,
      nombre: "Billar Don Beto",
      direccion: "Calle Bolívar 123",
      tiposDeMesa: ["POOL", "CARAMBOLA"],
      distancia: "0.9 km",
      imagen:
        "https://res.cloudinary.com/dbdtskhuk/image/upload/v1761091247/billar/mesas/esudnjify8sdesalymiu.jpg",
      horarios: {
        LUNES: [{ hora_apertura: "20:00", hora_cierre: "23:00" }],
        MARTES: [{ hora_apertura: "20:00", hora_cierre: "23:00" }],
        MIERCOLES: [],
        JUEVES: [{ hora_apertura: "20:00", hora_cierre: "23:00" }],
        VIERNES: [],
        SABADO: [{ hora_apertura: "20:00", hora_cierre: "23:00" }],
        DOMINGO: [],
      },
      estadoActual: "cerrado",
      lat: -17.396,
      lon: -66.037,
    },
  ];

  /* filtros */
  const tiposActivos = tiposSeleccionados.length ? tiposSeleccionados : TIPOS;
  const localesFiltrados = useMemo(() => {
    let arr = locales.filter((l) =>
      l.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
    );
    arr = arr.filter((l) => l.tiposDeMesa.some((t) => tiposActivos.includes(t)));
    arr = arr.filter(
      (l) => haversineKm(location.latitude, location.longitude, l.lat, l.lon) <= distancia
    );
    return arr;
  }, [busqueda, tiposActivos, location, distancia]);

  const resultados = localesFiltrados.length;

  /* ubicación actual */
  const obtenerUbicacion = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Activa el GPS para usar tu ubicación.");
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    setLocation(coords);
    setUsandoUbicacionReal(true);
    mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.02, longitudeDelta: 0.02 });
  };

  const borrarFiltros = () => {
    setDistancia(5);
    setTiposSeleccionados([]);
    setBusqueda("");
  };

  /* mapa */
  const regionInicial: Region = {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };
  const radio = distancia * 1000;
  const MAP_HEIGHT = mostrarFiltros
    ? 420
    : Math.max(520, Math.floor(Dimensions.get("window").height * 0.65));

  /* chips */
  const TipoChip = ({ value }: { value: string }) => (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{value}</Text>
    </View>
  );

  /* pin bola 8 */
  const EightBallMarker = () => (
    <View style={styles.ballOuter}>
      <View style={styles.ballInner}>
        <Text style={styles.ballText}>8</Text>
      </View>
    </View>
  );

  /* -------- bubble projection & clamp -------- */
  const projectAndClamp = useCallback(
    async (coord: { latitude: number; longitude: number }) => {
      if (!mapRef.current) return;
      try {
        const p = await mapRef.current.pointForCoordinate(coord);
        // posición deseada del bubble: centrado en X y elevado Y
        const leftRaw = p.x - BUBBLE_W / 2;
        const topRaw = p.y - (BUBBLE_H + BUBBLE_OFFSET_Y);

        const left = clamp(
          leftRaw,
          BUBBLE_PADDING,
          Math.max(BUBBLE_PADDING, mapLayout.w - BUBBLE_W - BUBBLE_PADDING)
        );
        const top = clamp(
          topRaw,
          BUBBLE_PADDING,
          Math.max(BUBBLE_PADDING, mapLayout.h - BUBBLE_H - BUBBLE_PADDING)
        );
        setBubblePos({ x: left, y: top });
      } catch {
        // en algunos frames pointForCoordinate puede fallar si el mapa no terminó de pintar
      }
    },
    [mapLayout.w, mapLayout.h]
  );

  // throttle con rAF para que no se sienta pesado
  const rafRef = useRef<number | null>(null);
  const scheduleProject = useCallback(
    (coord: { latitude: number; longitude: number }) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => projectAndClamp(coord));
    },
    [projectAndClamp]
  );

  const handleMarkerPress = (l: Local) => {
    setActiveLocal((prev) => (prev?.id === l.id ? null : l));
    scheduleProject({ latitude: l.lat, longitude: l.lon });
  };

  const onRegionChangeComplete = () => {
    if (activeLocal) scheduleProject({ latitude: activeLocal.lat, longitude: activeLocal.lon });
  };

  const onMapLayout = (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    setMapLayout({ x, y, w: width, h: height });
    if (activeLocal) scheduleProject({ latitude: activeLocal.lat, longitude: activeLocal.lon });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Toggle Lista/Mapa */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.optionBtn, !modoMapa ? styles.optionBtnActive : styles.optionBtnInactive]}
          onPress={() => setModoMapa(false)}
        >
          <Text
            style={[
              styles.optionText,
              !modoMapa ? styles.optionTextActive : styles.optionTextInactive,
            ]}
          >
            Locales disponibles
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionBtn, modoMapa ? styles.optionBtnActive : styles.optionBtnInactive]}
          onPress={() => setModoMapa(true)}
        >
          <Text
            style={[
              styles.optionText,
              modoMapa ? styles.optionTextActive : styles.optionTextInactive,
            ]}
          >
            Mapa
          </Text>
        </TouchableOpacity>
      </View>

      {/* Buscador + filtros */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Buscar local..."
          placeholderTextColor="#888"
          value={busqueda}
          onChangeText={setBusqueda}
        />
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setMostrarFiltros((v) => !v)}
          accessibilityLabel="Abrir filtros"
        >
          <Feather name="sliders" size={20} color={Colores.azul} />
        </TouchableOpacity>
      </View>

      <Text style={styles.resultadosText}>Resultados encontrados: {localesFiltrados.length}</Text>

      {/* Panel de Filtros */}
      {mostrarFiltros && (
        <View style={styles.filtrosContainer}>
          <TouchableOpacity style={styles.btnUbicacion} onPress={obtenerUbicacion}>
            <Ionicons name="location-outline" size={18} color={Colores.blanco} />
            <Text style={styles.btnUbicacionText}>Usar mi ubicación</Text>
          </TouchableOpacity>

          <View style={styles.filtrosRow}>
            <View style={styles.filtroPill}>
              <Text style={styles.filtroText}>Distancia: {distancia.toFixed(1)} km</Text>
            </View>

            <TouchableOpacity style={styles.filtroPill} onPress={() => setModalTipos(true)}>
              <Text style={styles.filtroText}>
                Tipo de mesa: {tiposSeleccionados.length ? tiposSeleccionados.join(", ") : "Todos"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearBtn} onPress={borrarFiltros}>
              <Feather name="trash-2" size={18} color={Colores.rojo} />
            </TouchableOpacity>
          </View>

          <View style={{ marginVertical: 6 }}>
            <Slider
              style={{ width: "100%", height: 40 }}
              minimumValue={1}
              maximumValue={20}
              step={0.5}
              value={distancia}
              minimumTrackTintColor={Colores.azul}
              maximumTrackTintColor="#D0D0D0"
              thumbTintColor={Colores.azul}
              onValueChange={(v) => setDistancia(v)}
            />
          </View>
        </View>
      )}

      {/* Mapa */}
      {modoMapa && (
        <View style={[styles.mapContainer, { height: MAP_HEIGHT }]}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={regionInicial}
            onMapReady={() => onRegionChangeComplete()}
            onRegionChangeComplete={onRegionChangeComplete}
            onLayout={onMapLayout}
            onPress={() => setActiveLocal(null)}
          >
            <Circle
              center={location}
              radius={radio}
              strokeColor="rgba(0, 82, 255, 0.4)"
              fillColor="rgba(0, 82, 255, 0.1)"
            />

            {/* marcador central draggable */}
            <Marker
              coordinate={location}
              draggable
              onDragEnd={(e) => setLocation(e.nativeEvent.coordinate)}
              title={usandoUbicacionReal ? "Tu ubicación" : "Centro"}
              pinColor={Colores.azul}
            />

            {/* billares */}
            {localesFiltrados.map((l) => (
              <Marker
                key={l.id}
                coordinate={{ latitude: l.lat, longitude: l.lon }}
                anchor={{ x: 0.5, y: 1 }}
                onPress={() => handleMarkerPress(l)}
              >
                <EightBallMarker />
              </Marker>
            ))}
          </MapView>

          {/* Bubble propio absolutamente posicionado dentro del contenedor del mapa */}
          {activeLocal && bubblePos && (
            <View
              pointerEvents="box-none"
              style={[
                styles.absoluteFill,
                { justifyContent: "flex-start", alignItems: "flex-start" },
              ]}
            >
              <View style={{ position: "absolute", left: bubblePos.x, top: bubblePos.y }}>
                <View style={styles.bubbleCard}>
                  <Image source={{ uri: activeLocal.imagen }} style={styles.bubbleImg} />

                  {/* estado + info (i) */}
                  <View style={styles.bubbleStatusRow}>
                    <Text
                      style={[
                        styles.estadoTextInline,
                        {
                          color:
                            activeLocal.estadoActual === "abierto"
                              ? Colores.verde
                              : Colores.rojo,
                        },
                      ]}
                    >
                      {activeLocal.estadoActual.toUpperCase()}
                    </Text>

                    <TouchableOpacity
                      style={styles.infoIconInline}
                      onPress={() =>
                        setModalHorarios({ visible: true, local: activeLocal })
                      }
                    >
                      <Feather name="info" size={16} color={Colores.blanco} />
                    </TouchableOpacity>
                  </View>

                  <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                    <Text style={styles.cardTitle}>{activeLocal.nombre}</Text>
                    <Text style={styles.cardSub}>{activeLocal.direccion}</Text>

                    <View style={styles.chipsRow}>
                      {activeLocal.tiposDeMesa.map((t) => (
                        <TipoChip key={t} value={t} />
                      ))}
                    </View>

                    <Text style={[styles.cardDist, { marginTop: 4 }]}>
                      {activeLocal.distancia}
                    </Text>

                    <TouchableOpacity
                      style={[styles.btnAzul, { marginTop: 10 }]}
                      onPress={() => {
                        setActiveLocal(null);
                        router.push(`/(principal)/inicio/mesas?id=${activeLocal.id}`);
                      }}
                    >
                      <Text style={styles.btnAzulText}>Ver mesas disponibles</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.bubbleArrow} />
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Lista (sin cambios mayores) */}
      {!modoMapa && (
        <View style={{ marginTop: 6 }}>
          {localesFiltrados.map((local) => (
            <View key={local.id} style={styles.card}>
              <View style={{ position: "relative" }}>
                <Image source={{ uri: local.imagen }} style={styles.cardImage} />
                <View style={styles.topRightWrap}>
                  <View
                    style={[
                      styles.estadoBadge,
                      {
                        backgroundColor:
                          local.estadoActual === "abierto" ? Colores.verde : Colores.rojo,
                      },
                    ]}
                  >
                    <Text style={styles.estadoBadgeText}>
                      {local.estadoActual.toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.infoIcon}
                    onPress={() => setModalHorarios({ visible: true, local })}
                  >
                    <Feather name="info" size={16} color={Colores.blanco} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{local.nombre}</Text>
                <Text style={styles.cardSub}>{local.direccion}</Text>

                <View style={styles.chipsRow}>
                  {local.tiposDeMesa.map((t) => (
                    <TipoChip key={t} value={t} />
                  ))}
                </View>

                <Text style={styles.cardDist}>{local.distancia}</Text>
              </View>

              <TouchableOpacity
                style={styles.btnAzul}
                onPress={() => router.push(`/(principal)/inicio/mesas?id=${local.id}`)}
              >
                <Text style={styles.btnAzulText}>Ver mesas disponibles</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Modal Horarios */}
      <Modal
        visible={modalHorarios.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalHorarios({ visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Horarios</Text>
              <TouchableOpacity onPress={() => setModalHorarios({ visible: false })}>
                <Feather name="x" size={18} color={Colores.azul} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {modalHorarios.local &&
                Object.entries(modalHorarios.local.horarios).map(([dia, rangos]) => (
                  <View key={dia} style={styles.horRow}>
                    <Text style={styles.horDia}>{dia.slice(0, 3)}</Text>
                    {rangos.length === 0 ? (
                      <Text style={styles.horRango}>—</Text>
                    ) : (
                      <Text style={styles.horRango}>
                        {rangos.map((r) => `${r.hora_apertura}–${r.hora_cierre}`).join("  ·  ")}
                      </Text>
                    )}
                  </View>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Tipos (multi) */}
      <Modal
        visible={modalTipos}
        transparent
        animationType="fade"
        onRequestClose={() => setModalTipos(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tipos de mesa</Text>
              <TouchableOpacity onPress={() => setModalTipos(false)}>
                <Feather name="x" size={18} color={Colores.azul} />
              </TouchableOpacity>
            </View>

            {/* Todos */}
            <TouchableOpacity
              style={styles.tipoRow}
              onPress={() =>
                setTiposSeleccionados((prev) => (prev.length === TIPOS.length ? [] : [...TIPOS]))
              }
            >
              <View
                style={[
                  styles.checkbox,
                  tiposSeleccionados.length === TIPOS.length && styles.checkboxOn,
                ]}
              >
                {tiposSeleccionados.length === TIPOS.length && (
                  <Feather name="check" size={14} color={Colores.blanco} />
                )}
              </View>
              <Text style={styles.tipoLabel}>Todos</Text>
            </TouchableOpacity>

            {TIPOS.map((t) => {
              const on = tiposSeleccionados.includes(t);
              return (
                <TouchableOpacity
                  key={t}
                  style={styles.tipoRow}
                  onPress={() =>
                    setTiposSeleccionados((prev) => (on ? prev.filter((x) => x !== t) : [...prev, t]))
                  }
                >
                  <View style={[styles.checkbox, on && styles.checkboxOn]}>
                    {on && <Feather name="check" size={14} color={Colores.blanco} />}
                  </View>
                  <Text style={styles.tipoLabel}>{t}</Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={[styles.btnAzul, { marginTop: 12 }]} onPress={() => setModalTipos(false)}>
              <Text style={styles.btnAzulText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* ---------- estilos ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colores.grisFondo, padding: 14, paddingBottom: 50 },

  buttonsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  optionBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6, flex: 1, marginHorizontal: 4, alignItems: "center" },
  optionBtnActive: { backgroundColor: Colores.azul },
  optionBtnInactive: { backgroundColor: Colores.azulClaro },
  optionText: { fontWeight: "700" },
  optionTextActive: { color: Colores.blanco },
  optionTextInactive: { color: Colores.azul },

  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: Colores.blanco, borderRadius: 10, paddingHorizontal: 10, marginBottom: 8, elevation: 2 },
  input: { flex: 1, padding: Platform.OS === "ios" ? 12 : 10, fontSize: 14, color: "#222" },
  filterBtn: { backgroundColor: Colores.azulClaro, padding: 8, borderRadius: 8 },
  resultadosText: { color: Colores.grisTexto, marginBottom: 8, fontSize: 12 },

  filtrosContainer: { backgroundColor: Colores.blanco, borderRadius: 12, padding: 12, marginBottom: 12, elevation: 3 },
  btnUbicacion: { backgroundColor: Colores.azul, paddingVertical: 8, borderRadius: 8, alignItems: "center", marginBottom: 8, flexDirection: "row", justifyContent: "center", gap: 6 },
  btnUbicacionText: { color: Colores.blanco, fontWeight: "700" },
  filtrosRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, justifyContent: "space-between", marginBottom: 4 },
  filtroPill: { backgroundColor: "#D9E6FF", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  filtroText: { color: "#0033CC", fontWeight: "700", fontSize: 12 },
  clearBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, backgroundColor: "#FDECEC" },

  mapContainer: { borderRadius: 12, overflow: "hidden", position: "relative" },
  map: { flex: 1 },
  absoluteFill: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },

  /* bubble/card sobre el mapa */
  bubbleCard: { width: 300, backgroundColor: Colores.blanco, borderRadius: 12, elevation: 8, overflow: "hidden" },
  bubbleImg: { width: "100%", height: 110 },
  bubbleArrow: { alignSelf: "center", width: 16, height: 16, backgroundColor: Colores.blanco, transform: [{ rotate: "45deg" }], marginTop: -8, borderRadius: 2, elevation: 4 },

  bubbleStatusRow: { position: "absolute", top: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 6 },
  estadoTextInline: { fontWeight: "800", backgroundColor: Colores.blanco, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, elevation: 3 },
  infoIconInline: { width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },

  chip: { backgroundColor: Colores.azulClaro, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  chipText: { color: Colores.azul, fontWeight: "700", fontSize: 11 },

  card: { backgroundColor: Colores.blanco, borderRadius: 10, padding: 10, marginBottom: 12, elevation: 3 },
  cardImage: { width: "100%", height: 150, borderRadius: 10 },
  topRightWrap: { position: "absolute", top: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 6 },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  estadoBadgeText: { color: Colores.blanco, fontWeight: "800", fontSize: 10 },
  infoIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  cardInfo: { marginTop: 8 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#0033A0" },
  cardSub: { fontSize: 12, color: Colores.grisTexto, marginTop: 2 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  cardDist: { marginTop: 4, color: Colores.grisTexto, fontSize: 12 },

  btnAzul: { backgroundColor: Colores.azul, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  btnAzulText: { color: Colores.blanco, fontWeight: "800" },

  /* marker bola 8 */
  ballOuter: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colores.negro, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: Colores.blanco },
  ballInner: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colores.blanco, alignItems: "center", justifyContent: "center" },
  ballText: { fontWeight: "900", color: Colores.negro, fontSize: 10 },

  /* modales genéricos */
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center", padding: 16 },
  modalCard: { backgroundColor: Colores.blanco, borderRadius: 12, width: "100%", maxWidth: 420, padding: 12 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#0033A0" },
  horRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#EEE", paddingVertical: 6 },
  horDia: { fontWeight: "800", color: Colores.grisTexto, width: 70 },
  horRango: { color: Colores.negro, flex: 1, textAlign: "right" },
});
