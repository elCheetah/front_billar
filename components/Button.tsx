import { TouchableOpacity, Text } from "react-native";

export default function Button({ title, onPress }: { title: string, onPress: () => void }) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-blue-600 px-4 py-2 rounded-lg mt-4"
    >
      <Text className="text-white font-bold">{title}</Text>
    </TouchableOpacity>
  );
}
