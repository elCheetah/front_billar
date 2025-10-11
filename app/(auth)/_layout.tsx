import { Stack } from "expo-router";

export default function LayoutAutenticacion() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="autenticacion/index"
        options={{ title: "Billarcito" }}
      />
      <Stack.Screen
        name="autenticacion/iniciar-sesion"
        options={{ title: "Iniciar sesión" }}
      />
    </Stack>
  );
}
