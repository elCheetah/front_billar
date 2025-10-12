import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function RegistroPropietario() {
  const router = useRouter();

  // Datos del propietario
  const [primerAp, setPrimerAp] = useState("");
  const [segundoAp, setSegundoAp] = useState("");
  const [nombres, setNombres] = useState("");
  const [celular, setCelular] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");

  // Datos del local
  const [nombreLocal, setNombreLocal] = useState("");
  const [gps, setGps] = useState("");
  const [tipoBillar, setTipoBillar] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [direccion, setDireccion] = useState("");
  const [imagenesLocal, setImagenesLocal] = useState<string[]>([]);

  // Datos de las mesas
  const [mesas, setMesas] = useState<
    { nroMesa: string; descripcion: string; fotos: string[] }[]
  >([]);

  // Validaciones
  const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/;
  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const celularValido = /^[0-9]{8,}$/;

  const formularioValido =
    soloLetras.test(primerAp) &&
    soloLetras.test(segundoAp) &&
    soloLetras.test(nombres) &&
    celularValido.test(celular) &&
    correoValido.test(correo) &&
    contrasena.length >= 6 &&
    contrasena === confirmarContrasena &&
    soloLetras.test(nombreLocal) &&
    gps.length >= 5 &&
    tipoBillar.length >= 3 &&
    soloLetras.test(ciudad) &&
    direccion.length >= 5 &&
    mesas.length >= 1;

  // Funciones
  const agregarMesa = () => {
    setMesas([...mesas, { nroMesa: "", descripcion: "", fotos: [] }]);
  };

  const actualizarMesa = (index: number, campo: string, valor: string) => {
    const nuevasMesas = [...mesas];
    nuevasMesas[index] = { ...nuevasMesas[index], [campo]: valor };
    setMesas(nuevasMesas);
  };

  const subirImagen = async (tipo: "local" | "mesa", indexMesa?: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      const imagen = result.assets[0].uri;
      if (tipo === "local") setImagenesLocal([...imagenesLocal, imagen]);
      else if (indexMesa !== undefined) {
        const nuevasMesas = [...mesas];
        nuevasMesas[indexMesa].fotos.push(imagen);
        setMesas(nuevasMesas);
      }
    }
  };

  const manejarRegistro = () => {
    if (!formularioValido) return alert("Complete todos los campos correctamente");
    alert("Registro exitoso 🎱");
    router.replace("/(principal)");
  };

  return (
    <ScrollView contentContainerStyle={estilos.scroll}>
      <View style={estilos.contenedor}>
        {/* Título general */}
        <Text style={[estilos.titulo, { color: Colores.rojo }]}>
          Registrarse como Propietario de Local de Billar
        </Text>

        {/* Datos del propietario */}
        <Text style={[estilos.subtitulo, { color: Colores.verde }]}>
          Datos del Propietario
        </Text>

        <TextInput style={estilos.campo} placeholder="Primer Apellido" value={primerAp} onChangeText={setPrimerAp} />
        <TextInput style={estilos.campo} placeholder="Segundo Apellido" value={segundoAp} onChangeText={setSegundoAp} />
        <TextInput style={estilos.campo} placeholder="Nombres" value={nombres} onChangeText={setNombres} />
        <TextInput style={estilos.campo} placeholder="Celular" keyboardType="numeric" value={celular} onChangeText={setCelular} />
        <TextInput style={estilos.campo} placeholder="Correo electrónico" keyboardType="email-address" value={correo} onChangeText={setCorreo} />
        <TextInput style={estilos.campo} placeholder="Contraseña" secureTextEntry value={contrasena} onChangeText={setContrasena} />
        <TextInput style={estilos.campo} placeholder="Confirmar contraseña" secureTextEntry value={confirmarContrasena} onChangeText={setConfirmarContrasena} />

        {/* Datos del local */}
        <Text style={[estilos.subtitulo, { color: Colores.verde }]}>Datos del Local</Text>

        <TextInput style={estilos.campo} placeholder="Nombre del local" value={nombreLocal} onChangeText={setNombreLocal} />
        <TextInput style={estilos.campo} placeholder="URL GPS / Latitud y Longitud" value={gps} onChangeText={setGps} />
        <TextInput style={estilos.campo} placeholder="Tipo de billar (Ej. Pool, Snooker...)" value={tipoBillar} onChangeText={setTipoBillar} />
        <TextInput style={estilos.campo} placeholder="Ciudad" value={ciudad} onChangeText={setCiudad} />
        <TextInput style={estilos.campo} placeholder="Dirección o descripción" value={direccion} onChangeText={setDireccion} />

        {/* Imágenes del local */}
        <Text style={estilos.textoAzul}>Imágenes del Local</Text>
        <View style={estilos.filaImagenes}>
          {imagenesLocal.map((img, i) => (
            <Image key={i} source={{ uri: img }} style={estilos.imgPreview} />
          ))}
          <TouchableOpacity style={estilos.botonImagen} onPress={() => subirImagen("local")}>
            <Text style={estilos.textoMas}>＋</Text>
          </TouchableOpacity>
        </View>

        {/* Sección de mesas */}
        <Text style={[estilos.subtitulo, { color: Colores.rojo }]}>Datos de las Mesas</Text>
        <TouchableOpacity style={estilos.botonCrearMesa} onPress={agregarMesa}>
          <Text style={estilos.textoAzul}>＋ Crear una Mesa</Text>
        </TouchableOpacity>

        {mesas.map((mesa, index) => (
          <View key={index} style={estilos.cardMesa}>
            <Text style={estilos.textoNegrita}>Mesa {index + 1}</Text>
            <TextInput style={estilos.campo} placeholder="Número de mesa" value={mesa.nroMesa} onChangeText={(t) => actualizarMesa(index, "nroMesa", t)} />
            <TextInput style={estilos.campo} placeholder="Descripción" value={mesa.descripcion} onChangeText={(t) => actualizarMesa(index, "descripcion", t)} />
            <Text style={estilos.textoAzul}>Fotos de la mesa</Text>
            <View style={estilos.filaImagenes}>
              {mesa.fotos.map((f, i) => (
                <Image key={i} source={{ uri: f }} style={estilos.imgPreview} />
              ))}
              <TouchableOpacity style={estilos.botonImagen} onPress={() => subirImagen("mesa", index)}>
                <Text style={estilos.textoMas}>＋</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Botón final */}
        <TouchableOpacity
          style={[estilos.botonRegistrar, { backgroundColor: formularioValido ? Colores.primario : "#A0C4FF" }]}
          disabled={!formularioValido}
          onPress={manejarRegistro}
        >
          <Text style={estilos.textoLleno}>REGISTRARSE</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// 🎨 Paleta de colores
const Colores = {
  primario: "#0066FF",
  primarioOscuro: "#0033A0",
  fondo: "#F4F7FB",
  textoClaro: "#FFFFFF",
  borde: "#E0E0E0",
  error: "#FF4B4B",
  rojo: "#D62828",
  verde: "#2A9D8F",
};

// 💅 Estilos
const estilos = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: Colores.fondo,
    paddingBottom: 40,
  },
  contenedor: {
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  campo: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colores.borde,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  filaImagenes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  botonImagen: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: Colores.primario,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  imgPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  textoMas: {
    fontSize: 28,
    color: Colores.primario,
  },
  textoAzul: {
    color: Colores.primario,
    fontWeight: "600",
    marginBottom: 6,
  },
  textoNegrita: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  botonCrearMesa: {
    backgroundColor: "#E8F0FF",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  cardMesa: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  botonRegistrar: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  textoLleno: {
    color: Colores.textoClaro,
    fontWeight: "bold",
    textAlign: "center",
  },
});
