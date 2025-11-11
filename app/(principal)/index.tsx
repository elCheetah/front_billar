// app/(principal)/index.tsx
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { getUser } from "../../utils/authStorage";

type Rol = "CLIENTE" | "PROPIETARIO" | "ADMINISTRADOR";

export default function IndexPrincipal() {
  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState<Rol | null>(null);

  useEffect(() => {
    (async () => {
      const u = await getUser();
      setRol(u?.rol ?? null);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={{flex:1,alignItems:"center",justifyContent:"center"}}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!rol) return <Redirect href="/autenticacion" />;

  if (rol === "ADMINISTRADOR") return <Redirect href="/(principal)/dashboard/admin" />;
  if (rol === "PROPIETARIO")   return <Redirect href="/(principal)/dashboard/propietario" />;
  if (rol === "CLIENTE")       return <Redirect href="/(principal)/inicio/filtros" />;

  return <Redirect href="/autenticacion" />;
}
