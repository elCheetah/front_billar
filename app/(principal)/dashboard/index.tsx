import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

const Colores = {
  azul: "#0052FF",
  verde: "#28A745",
  rojo: "#DC3545",
  grisFondo: "#F5F9FF",
  blanco: "#FFFFFF",
  grisTexto: "#666",
};

export default function Dashboard() {
  // Datos del gráfico
  const datos = [
    { label: "Reservas", valor: 60, color: Colores.azul },
    { label: "Canceladas", valor: 20, color: Colores.rojo },
    { label: "Finalizadas", valor: 20, color: Colores.verde },
  ];

  // Calcular porcentajes totales
  const total = datos.reduce((acc, item) => acc + item.valor, 0);

  // Calcular el ángulo de cada segmento
  let startAngle = 0;
  const segmentos = datos.map((item) => {
    const angle = (item.valor / total) * 360;
    const segmento = {
      ...item,
      startAngle,
      endAngle: startAngle + angle,
    };
    startAngle += angle;
    return segmento;
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>📊 Dashboard del Propietario</Text>

      {/* === GRÁFICO DE PASTEL === */}
      <View style={styles.card}>
        <Text style={styles.subtitulo}>Distribución de Reservas</Text>
        <Svg height="200" width="200" viewBox="0 0 200 200">
          <G rotation="-90" origin="100, 100">
            {segmentos.map((item, index) => {
              const r = 80;
              const cx = 100;
              const cy = 100;
              const start = polarToCartesian(cx, cy, r, item.endAngle);
              const end = polarToCartesian(cx, cy, r, item.startAngle);
              const largeArc = item.endAngle - item.startAngle <= 180 ? 0 : 1;
              const d = [
                `M ${cx} ${cy}`,
                `L ${start.x} ${start.y}`,
                `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
                "Z",
              ].join(" ");
              return <Circle key={index} cx={cx} cy={cy} r={r} fill={item.color} strokeWidth={0} />;
            })}
          </G>
        </Svg>

        <View style={styles.leyenda}>
          {datos.map((item, index) => (
            <View key={index} style={styles.leyendaItem}>
              <View style={[styles.colorBox, { backgroundColor: item.color }]} />
              <Text style={styles.textLeyenda}>
                {item.label}: {item.valor}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// 🔹 Convierte ángulos a coordenadas cartesianas
function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

// === ESTILOS ===
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colores.grisFondo,
    padding: 16,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colores.azul,
    textAlign: "center",
    marginVertical: 10,
  },
  card: {
    backgroundColor: Colores.blanco,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    elevation: 3,
  },
  subtitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colores.azul,
    marginBottom: 10,
  },
  leyenda: {
    marginTop: 10,
  },
  leyendaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  colorBox: {
    width: 15,
    height: 15,
    borderRadius: 3,
    marginRight: 8,
  },
  textLeyenda: {
    fontSize: 14,
    color: Colores.grisTexto,
  },
});
