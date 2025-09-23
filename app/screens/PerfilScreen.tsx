import { View, Text } from "react-native";

export default function PerfilScreen() {
  return (
    <View className="flex-1 bg-white p-4 items-center">
      <Text className="text-xl font-bold mb-4">Mi Perfil</Text>
      <Text className="text-lg">Juan Pérez</Text>
      <Text className="text-gray-500">juan.perez@email.com</Text>

      <View className="w-full mt-6">
        <Text className="p-3 border-b">Información personal</Text>
        <Text className="p-3 border-b">Historial de reservas</Text>
        <Text className="p-3 border-b">Métodos de pago</Text>
        <Text className="p-3 border-b">Configuración</Text>
      </View>
    </View>
  );
}
