import { View, Text } from "react-native";

export default function MisReservasScreen() {
  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold mb-4">Mis Reservas</Text>

      <View className="bg-gray-100 p-3 rounded-lg mb-3">
        <Text className="font-semibold">Mesa Premium 1</Text>
        <Text>20/01/2024 - 18:00</Text>
        <Text className="text-green-500">Confirmada</Text>
      </View>

      <View className="bg-gray-100 p-3 rounded-lg mb-3">
        <Text className="font-semibold">Mesa Clásica 2</Text>
        <Text>22/01/2024 - 20:00</Text>
        <Text className="text-yellow-500">Pendiente</Text>
      </View>
    </View>
  );
}
