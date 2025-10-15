import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { useNavigation } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import AvatarCircle from "../../components/AvatarCircle";

// 🔒 por ahora estático; luego lo tomarás del estado de usuario/tokens
const FULL_NAME = "Alex Escalera";

function HeaderAvatar() {
  const navigation = useNavigation<any>();
  return (
    <View style={{ marginRight: 12 }}>
      <AvatarCircle name={FULL_NAME} size={30} onPress={() => navigation.toggleDrawer()} />
    </View>
  );
}

function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <DrawerItemList {...props} />
      {/* Footer con nombre completo */}
      <View style={styles.footer}>
        <AvatarCircle name={FULL_NAME} size={40} />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.name}>{FULL_NAME}</Text>
          <Text style={styles.caption}>Propietario</Text>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

export default function LayoutPrincipal() {
  return (
    <Drawer
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: "#0066FF" },
        headerTintColor: "#FFFFFF",
        headerRight: () => <HeaderAvatar />,
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="index" options={{ title: "Inicio" }} />
      <Drawer.Screen name="reservas" options={{ title: "Reservas" }} />
      <Drawer.Screen name="mesas" options={{ title: "Mesas" }} />
      <Drawer.Screen name="usuarios" options={{ title: "Usuarios" }} />
      <Drawer.Screen name="configuracion" options={{ title: "Configuración" }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: "auto",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },
  name: { fontWeight: "700", fontSize: 16 },
  caption: { color: "#6B7280", marginTop: 2 },
});
