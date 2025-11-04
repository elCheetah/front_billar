// app/(principal)/inicio/mesas.tsx
import { api } from "@/components/api";
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type MesaResumenDTO = {
  id: number;
  numero_mesa: number;
  tipo_mesa: string;
  precio_hora: number;
  estado: "DISPONIBLE" | "OCUPADO";
  imagen: string | null;
};

type MesasDelLocalResponse = {
  idLocal: number;
  imagenesLocal: string[];
  nombre: string;
  direccion: string;
  contactolocal: string | null;
  mesas: MesaResumenDTO[];
};

const Colores = {
  azul: "#0052FF",
  azulMedio: "#0033CC",
  azulClaro: "#E8F1FF",
  verde: "#28A745",
  rojo: "#DC3545",
  grisFondo: "#F5F9FF",
  grisTexto: "#667085",
  blanco: "#FFFFFF",
  negro: "#0B132B",
  sombra: "rgba(16,24,40,0.08)",
};

const PLACE_LOCAL = "https://via.placeholder.com/1200x700?text=Billar";
const PLACE_MESA = "https://via.placeholder.com/800x600?text=Mesa";

export default function Mesas() {
  const { id, idLocal } = useLocalSearchParams<{ id?: string; idLocal?: string }>();
  const router = useRouter();
  const parsedId = useMemo(() => Number(idLocal ?? id ?? "0"), [id, idLocal]);

  const [data, setData] = useState<MesasDelLocalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrusel
  const [slide, setSlide] = useState(0);
  const sliderRef = useRef<FlatList<string>>(null);
  const width = Dimensions.get("window").width;
  const slideInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMesas = useCallback(async () => {
    if (!parsedId || !Number.isFinite(parsedId)) {
      setError("Parámetro inválido.");
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const res: MesasDelLocalResponse = await api(`/locales/mesas-del-local/${parsedId}`);
      setData(res);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar la información.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [parsedId]);

  useEffect(() => {
    setLoading(true);
    fetchMesas();
  }, [fetchMesas]);

  // Auto-slide cada 3 s
  useEffect(() => {
    if (!data) return;
    const imgs = data.imagenesLocal?.length ? data.imagenesLocal : [PLACE_LOCAL];
    if (imgs.length <= 1) return;
    slideInterval.current && clearInterval(slideInterval.current);
    slideInterval.current = setInterval(() => {
      setSlide((s) => {
        const next = (s + 1) % imgs.length;
        sliderRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3000);
    return () => {
      slideInterval.current && clearInterval(slideInterval.current);
    };
  }, [data]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMesas();
  };

  const openWhatsApp = async () => {
    if (!data?.contactolocal) return;
    const url = data.contactolocal;
    const can = await Linking.canOpenURL(url);
    if (can) Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colores.azul} />
        <Text style={{ marginTop: 12, color: Colores.grisTexto }}>Cargando mesas…</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errTitle}>Ups, algo salió mal</Text>
        <Text style={styles.errMsg}>{error ?? "No hay datos."}</Text>
        <TouchableOpacity style={[styles.btn, { marginTop: 14 }]} onPress={fetchMesas}>
          <Ionicons name="refresh" size={18} color={Colores.blanco} />
          <Text style={styles.btnText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = data.imagenesLocal?.length ? data.imagenesLocal : [PLACE_LOCAL];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {/* Header con back y título centrado */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <AntDesign name="arrow-left" size={22} color={Colores.azulMedio} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mesas disponibles</Text>
      </View>

      {/* Nombre y dirección */}
      <Text style={styles.localName}>{data.nombre}</Text>
      <Text style={styles.localAddr}>{data.direccion}</Text>

      {/* Carrusel */}
      <View style={styles.carouselWrap}>
        <FlatList
          ref={sliderRef}
          data={images}
          keyExtractor={(u, i) => u + i}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setSlide(idx);
          }}
          renderItem={({ item }) => (
            <Image source={{ uri: item || PLACE_LOCAL }} style={[styles.heroImg, { width }]} />
          )}
        />
        {/* Indicadores */}
        <View style={styles.dotsRow}>
          {images.map((_, i) => (
            <View key={i} style={[styles.dot, i === slide && styles.dotOn]} />
          ))}
        </View>

        {/* Contacto por WhatsApp */}
        {data.contactolocal && (
          <TouchableOpacity style={styles.whatsBtn} onPress={openWhatsApp}>
            <Ionicons name="logo-whatsapp" size={18} color={Colores.blanco} />
            <Text style={styles.whatsText}>Contactar por WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de mesas */}
      <View style={{ marginTop: 12 }}>
        {data.mesas.map((m) => {
          const estadoOn = m.estado === "DISPONIBLE";
          return (
            <View key={m.id} style={styles.card}>
              <View style={{ position: "relative" }}>
                <Image
                  source={{ uri: m.imagen || PLACE_MESA }}
                  style={styles.cardImg}
                  resizeMode="cover"
                />
                <View style={styles.cardBadges}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: estadoOn ? Colores.verde : Colores.rojo },
                    ]}
                  >
                    <Text style={styles.badgeText}>{m.estado}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{`Mesa ${m.numero_mesa}`}</Text>
                <View style={styles.metaRow}>
                  <Feather name="tag" size={14} color={Colores.azulMedio} />
                  <Text style={styles.metaText}>Tipo: {m.tipo_mesa}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="cash-outline" size={16} color={Colores.azulMedio} />
                  <Text style={styles.metaText}>Precio: Bs {m.precio_hora}/hora</Text>
                </View>

                <TouchableOpacity
                  style={[styles.btn, { marginTop: 10 }]}
                  onPress={() =>
                    router.push({
                      pathname: "/(principal)/inicio/reservar",
                      params: { mesaId: String(m.id), localId: String(data.idLocal) },
                    })
                  }
                >
                  <Text style={styles.btnText}>Reservar</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

/* === ESTILOS === */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colores.grisFondo, padding: 14 },

  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  headerBack: { position: "absolute", left: 0, padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: Colores.azulMedio },

  localName: { fontSize: 20, fontWeight: "900", color: Colores.azulMedio, textAlign: "center" },
  localAddr: { textAlign: "center", color: Colores.grisTexto, marginTop: 2, marginBottom: 10 },

  carouselWrap: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: Colores.blanco,
    elevation: 3,
    shadowColor: Colores.sombra,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 12,
  },
  heroImg: { height: 210 },
  dotsRow: { position: "absolute", bottom: 10, alignSelf: "center", flexDirection: "row", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.25)" },
  dotOn: { backgroundColor: Colores.azul },

  whatsBtn: {
    position: "absolute",
    right: 10,
    bottom: 10,
    backgroundColor: "#25D366",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    elevation: 2,
  },
  whatsText: { color: Colores.blanco, fontWeight: "800", fontSize: 12 },

  card: {
    backgroundColor: Colores.blanco,
    borderRadius: 12,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: Colores.sombra,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardImg: { width: "100%", height: 160 },
  cardBadges: { position: "absolute", top: 8, right: 8, flexDirection: "row", gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: Colores.blanco, fontWeight: "900", fontSize: 10 },

  cardBody: { padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: "900", color: Colores.azulMedio, marginBottom: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  metaText: { color: Colores.negro },

  btn: {
    backgroundColor: Colores.azul,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  btnText: { color: Colores.blanco, fontWeight: "900" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errTitle: { fontSize: 16, fontWeight: "800", color: Colores.rojo },
  errMsg: { color: Colores.grisTexto, marginTop: 4, textAlign: "center" },
});
