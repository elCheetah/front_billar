import { Stack } from "expo-router";

export default function LayoutRecuperar() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="ingresar-correo"
        options={{ title: "Restablecer contraseña" }}
      />
      <Stack.Screen
        name="verificar-codigo"
        options={{ title: "Verificar código" }}
      />
      <Stack.Screen
        name="nueva-contrasena"
        options={{ title: "Nueva contraseña" }}
      />
    </Stack>
  );
}
