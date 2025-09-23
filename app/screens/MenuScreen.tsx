import { View, Text } from "react-native";

export default function MenuScreen() {
  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-lg font-bold mb-4">Menú</Text>
      <Text className="mb-2">Mesas Disponibles</Text>
      <Text className="mb-2">Mis Reservas</Text>
      <Text className="mb-2">Promociones</Text>
      <Text className="mb-2">Contacto</Text>
      <Text className="mb-2">Acerca de</Text>
    </View>
  );
}
