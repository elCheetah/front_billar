import { createDrawerNavigator } from "@react-navigation/drawer";
import BottomTabs from "./BottomTabs";
import MenuScreen from "../screens/MenuScreen";

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen
        name="HomeTabs"
        component={BottomTabs}
        options={{ headerShown: false, title: "Inicio" }}
      />
      <Drawer.Screen name="Menú" component={MenuScreen} />
    </Drawer.Navigator>
  );
}
