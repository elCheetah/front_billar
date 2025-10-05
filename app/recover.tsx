import { useRouter } from "expo-router";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function RecoverScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔑 Recuperar Contraseña</Text>

      <TextInput placeholder="Correo" style={styles.input} />

      <Button title="Enviar enlace" onPress={() => router.replace("/login")} />

      <View style={{ marginTop: 20 }}>
        <Button title="Volver a Login" onPress={() => router.replace("/login")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, marginBottom: 20, fontWeight: "bold" },
  input: {
    width: "90%",
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
});
