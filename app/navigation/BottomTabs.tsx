import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MesasScreen from "../screens/MesasScreen";
import MisReservasScreen from "../screens/MisReservasScreen";
import PerfilScreen from "../screens/PerfilScreen";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Mesas" component={MesasScreen} />
      <Tab.Screen name="Reservas" component={MisReservasScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}
