// utils/authStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Rol = "CLIENTE" | "PROPIETARIO" | "ADMINISTRADOR";

export interface AuthUser {
  id: number;
  correo: string;
  nombreCompleto: string;
  rol: Rol;
}

const K_TOKEN = "@auth/token";
const K_USER  = "@auth/user";

export async function saveAuth(token: string, user: AuthUser) {
  await AsyncStorage.multiSet([
    [K_TOKEN, token],
    [K_USER, JSON.stringify(user)],
  ]);
}

export async function getToken() {
  return AsyncStorage.getItem(K_TOKEN);
}

export async function getUser(): Promise<AuthUser | null> {
  const str = await AsyncStorage.getItem(K_USER);
  return str ? (JSON.parse(str) as AuthUser) : null;
}

export async function clearAuth() {
  await AsyncStorage.multiRemove([K_TOKEN, K_USER]);
}

export function roleLabel(rol?: Rol) {
  switch (rol) {
    case "ADMINISTRADOR": return "Administrador";
    case "PROPIETARIO":   return "Propietario";
    case "CLIENTE":       return "Cliente";
    default:              return "";
  }
}
