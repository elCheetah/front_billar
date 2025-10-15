// utils/authStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const K_TOKEN = "@auth/token";
const K_USER  = "@auth/user";

export async function saveAuth(token: string, user: any) {
  await AsyncStorage.multiSet([[K_TOKEN, token], [K_USER, JSON.stringify(user)]]);
}
export async function getToken() {
  return AsyncStorage.getItem(K_TOKEN);
}
export async function getUser() {
  const str = await AsyncStorage.getItem(K_USER);
  return str ? JSON.parse(str) : null;
}
export async function clearAuth() {
  await AsyncStorage.multiRemove([K_TOKEN, K_USER]);
}
