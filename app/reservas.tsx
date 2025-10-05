import { StyleSheet, Text, View } from "react-native";

export default function ReservasScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>📅 Pantalla de Reservas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 22, fontWeight: "bold" },
});
