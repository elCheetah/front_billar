import { Redirect } from "expo-router";

export default function Index() {
  // Al abrir la app, se redirige automáticamente al módulo de autenticación
  return <Redirect href="/autenticacion" />;
}
