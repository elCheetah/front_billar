import { View, Text, TouchableOpacity } from "react-native";

export default function ReservarMesaScreen() {
  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold mb-4">Reservar Mesa</Text>
      <Text className="text-lg font-semibold">Mesa Premium 1</Text>
      <Text className="text-green-500">$25/hora</Text>

      <Text className="mt-4 font-semibold">Fecha</Text>
      <Text>23/09/2025</Text>

      <Text className="mt-4 font-semibold">Hora</Text>
      <View className="flex-row flex-wrap">
        {["18:00", "19:00", "20:00", "21:00"].map((hora) => (
          <TouchableOpacity
            key={hora}
            className="p-2 m-1 bg-gray-200 rounded"
          >
            <Text>{hora}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity className="bg-green-500 p-3 mt-6 rounded">
        <Text className="text-white text-center">Confirmar Reserva</Text>
      </TouchableOpacity>
    </View>
  );
}
