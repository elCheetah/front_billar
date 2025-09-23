import { View, Text, ScrollView, TouchableOpacity } from "react-native";

export default function MesasScreen() {
  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold mb-4">Mesas Disponibles</Text>

      <View className="bg-green-100 p-3 rounded-lg mb-4">
        <Text className="font-semibold">Billar Club Premium</Text>
        <Text className="text-sm text-gray-600">Av. Principal 123, Centro</Text>
        <TouchableOpacity className="bg-green-500 p-2 mt-2 rounded">
          <Text className="text-white text-center">Reservar Mesa</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-gray-200 p-3 rounded-lg mb-4">
        <Text className="font-bold">Mesa VIP 3</Text>
        <Text className="text-sm text-gray-500">Snooker - Zona privada</Text>
        <Text className="text-red-500">No disponible</Text>
      </View>
    </ScrollView>
  );
}
