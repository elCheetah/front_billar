import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Colores = {
  azul: "#0052FF",
  azulClaro: "#E8F1FF",
  azulOscuro: "#0033CC",
  verde: "#28A745",
  rojo: "#DC3545",
  grisFondo: "#F5F9FF",
  grisTexto: "#666",
  blanco: "#FFFFFF",
};

export default function PerfilCliente() {
  const [usuario, setUsuario] = useState({
    nombre: "Saul",
    primerApellido: "Efe",
    segundoApellido: "Ala",
    correo: "correo@gmail.com",
    celular: "55673456",
    fechaRegistro: "10/30/40",
    foto: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
  });

  const [editable, setEditable] = useState(false);
  const [modificado, setModificado] = useState(false);
  const [nuevaFoto, setNuevaFoto] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("⚠️ Se necesitan permisos para acceder a la galería.");
      }
    })();
  }, []);

  const seleccionarImagen = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setNuevaFoto(result.assets[0].uri);
      setModificado(true);
    }
  };

  const habilitarEdicion = () => {
    setEditable(true);
  };

  const guardarCambios = () => {
    Alert.alert("✅ Cambios guardados", "El perfil ha sido actualizado.");
    setEditable(false);
    setModificado(false);
  };

  const cerrarSesion = () => {
    Alert.alert("Cerrar Sesión", "¿Deseas salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sí, salir", onPress: () => console.log("Sesión cerrada") },
    ]);
  };

  const fotoActual = nuevaFoto || usuario.foto;

  // 🧠 Validar valores antes de guardar
  const handleChange = (campo: string, valor: string) => {
    let nuevoValor = valor;

    if (["nombre", "primerApellido", "segundoApellido"].includes(campo)) {
      // Solo letras y espacios
      nuevoValor = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    }

    if (campo === "celular") {
      // Solo números
      nuevoValor = valor.replace(/[^0-9]/g, "");
    }

    setUsuario((prev) => ({ ...prev, [campo]: nuevoValor }));
    setModificado(true);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.fotoContainer}>
        <Image source={{ uri: fotoActual }} style={styles.fotoPerfil} />
        <TouchableOpacity style={styles.botonFoto} onPress={seleccionarImagen}>
          <Ionicons name="camera" size={18} color={Colores.blanco} />
        </TouchableOpacity>
      </View>

      <Text style={styles.titulo}>Perfil</Text>

      <View style={styles.rolContainer}>
        <Text style={styles.rolTexto}>CLIENTE</Text>
        <TouchableOpacity onPress={habilitarEdicion}>
          <Ionicons name="create-outline" size={18} color={Colores.azulOscuro} />
        </TouchableOpacity>
      </View>

      <View style={styles.datosContainer}>
        <Campo label="Nombre" value={usuario.nombre} editable={editable} onChangeText={(v) => handleChange("nombre", v)} />
        <Campo label="Primer Apellido" value={usuario.primerApellido} editable={editable} onChangeText={(v) => handleChange("primerApellido", v)} />
        <Campo label="Segundo Apellido" value={usuario.segundoApellido} editable={editable} onChangeText={(v) => handleChange("segundoApellido", v)} />

        {/* ❌ Correo no editable */}
        <Campo label="Correo" value={usuario.correo} editable={false} onChangeText={() => {}} />

        <Campo label="Celular" value={usuario.celular} editable={editable} onChangeText={(v) => handleChange("celular", v)} />

        <Text style={styles.fecha}>Miembro desde: {usuario.fechaRegistro}</Text>
      </View>

      <TouchableOpacity
        style={[styles.botonGuardar, !modificado && { backgroundColor: "#ccc" }]}
        disabled={!modificado}
        onPress={guardarCambios}
      >
        <Ionicons name="save-outline" size={20} color={Colores.blanco} />
        <Text style={styles.textoGuardar}>Guardar Cambios</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botonSalir} onPress={cerrarSesion}>
        <Ionicons name="log-out-outline" size={20} color={Colores.rojo} />
        <Text style={styles.textoSalir}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// 🔹 Campo genérico
function Campo({
  label,
  value,
  editable,
  onChangeText,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={styles.campo}>
      <Text style={styles.label}>{label}</Text>
      {editable ? (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
        />
      ) : (
        <Text style={styles.valor}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colores.grisFondo, padding: 20 },
  fotoContainer: { alignItems: "center", marginBottom: 15 },
  fotoPerfil: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: Colores.azul,
  },
  botonFoto: {
    position: "absolute",
    bottom: 5,
    right: "35%",
    backgroundColor: Colores.azul,
    borderRadius: 15,
    padding: 6,
  },
  titulo: {
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 10,
    color: Colores.azulOscuro,
  },
  rolContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colores.azulClaro,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  rolTexto: { fontWeight: "bold", letterSpacing: 2, color: Colores.azulOscuro },
  datosContainer: {
    backgroundColor: Colores.blanco,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    marginBottom: 20,
  },
  campo: { flexDirection: "row", marginBottom: 8 },
  label: { width: 140, color: Colores.azulOscuro, fontWeight: "bold" },
  valor: { flex: 1, color: Colores.grisTexto },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: Colores.azul,
    paddingVertical: 2,
  },
  fecha: { marginTop: 10, textAlign: "right", color: Colores.grisTexto },
  botonGuardar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colores.verde,
    paddingVertical: 10,
    borderRadius: 10,
  },
  textoGuardar: {
    color: Colores.blanco,
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
  botonSalir: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  textoSalir: {
    color: Colores.rojo,
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 6,
  },
});
