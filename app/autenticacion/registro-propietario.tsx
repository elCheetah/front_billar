import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

export default function RegistroPropietario() {
  const router = useRouter();

  // Estado del formulario
  const [form, setForm] = useState({
    primerAp: "",
    segundoAp: "",
    nombres: "",
    celular: "",
    correo: "",
    contrasena: "",
    confirmarContrasena: "",
    nombreLocal: "",
    gps: "",
    tipoBillar: "",
    ciudad: "",
    direccion: "",
  });

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [imagenesLocal, setImagenesLocal] = useState<string[]>([]);
  const [mesas, setMesas] = useState<
    { nroMesa: string; descripcion: string; fotos: string[] }[]
  >([{ nroMesa: "", descripcion: "", fotos: [] }]);

  // Expresiones regulares
  const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/;
  const empiezaConMayuscula = /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]*$/;
  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const celularValido = /^[0-9]{8,}$/;
  const gpsValido = /^-?\d{1,2}\.\d{1,8},\s*-?\d{1,3}\.\d{1,8}$/;
  const contrasenaValida =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_.])[A-Za-z\d!@#$%^&*_.]{6,}$/;

  // Funciones de validación
  const actualizarCampo = (campo: string, valor: string) => {
    setForm({ ...form, [campo]: valor });
    validarCampo(campo, valor);
  };

  const validarCampo = (campo: string, valor: string) => {
    let error = "";

    switch (campo) {
      case "primerAp":
      case "segundoAp":
      case "nombres":
      case "ciudad":
      case "nombreLocal":
        if (!soloLetras.test(valor.trim())) error = "Solo letras permitidas.";
        else if (!empiezaConMayuscula.test(valor.trim()))
          error = "Debe comenzar con mayúscula.";
        break;
      case "celular":
        if (!celularValido.test(valor.trim()))
          error = "Debe tener al menos 8 dígitos numéricos.";
        break;
      case "correo":
        if (!correoValido.test(valor.trim()))
          error = "Correo no válido (ej: usuario@correo.com).";
        break;
      case "contrasena":
        if (!contrasenaValida.test(valor))
          error =
            "Debe tener 6+ caracteres, 1 mayúscula, 1 número y 1 símbolo.";
        break;
      case "confirmarContrasena":
        if (valor !== form.contrasena) error = "Las contraseñas no coinciden.";
        break;
      case "gps":
        if (valor.trim() !== "" && !gpsValido.test(valor.trim()))
          error = "Formato: -17.3895, -66.1567";
        break;
      case "direccion":
        if (valor.trim().length < 5)
          error = "Debe tener al menos 5 caracteres.";
        break;
    }

    setErrores((prev) => ({ ...prev, [campo]: error }));
  };

  // Validar formulario completo
  const formularioValido =
    Object.values(form).every((v) => v.trim() !== "") &&
    Object.values(errores).every((e) => e === "") &&
    mesas.length > 0 &&
    mesas.every((m) => m.nroMesa.trim() && m.descripcion.trim());

  // Subir imagen
  const subirImagen = async (tipo: "local" | "mesa", indexMesa?: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (tipo === "local") setImagenesLocal([...imagenesLocal, uri]);
      else if (indexMesa !== undefined) {
        const nuevasMesas = [...mesas];
        nuevasMesas[indexMesa].fotos.push(uri);
        setMesas(nuevasMesas);
      }
    }
  };

  // Agregar y quitar mesas
  const agregarMesa = () =>
    setMesas([...mesas, { nroMesa: "", descripcion: "", fotos: [] }]);

  const quitarMesa = (index: number) => {
    if (mesas.length === 1)
      return Alert.alert("Aviso", "Debe haber al menos una mesa registrada.");
    const nuevas = mesas.filter((_, i) => i !== index);
    setMesas(nuevas);
  };

  // Registro
  const manejarRegistro = () => {
    if (!formularioValido) {
      Alert.alert("Error", "Revisa los campos en rojo antes de continuar.");
      return;
    }
    Alert.alert("Registro exitoso", "¡Propietario registrado correctamente!");
    router.replace("/(principal)");
  };

  return (
    <ScrollView contentContainerStyle={estilos.scroll}>
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>
          Registrarse como Propietario de Local de Billar
        </Text>

        {/* DATOS DEL PROPIETARIO */}
        <Text style={estilos.subtitulo}>Datos del Propietario</Text>

        {[
          "primerAp",
          "segundoAp",
          "nombres",
          "celular",
          "correo",
          "contrasena",
          "confirmarContrasena",
        ].map((campo, idx) => (
          <View key={idx}>
            <TextInput
              style={estilos.campo}
              placeholder={
                campo === "primerAp"
                  ? "Primer Apellido"
                  : campo === "segundoAp"
                  ? "Segundo Apellido"
                  : campo === "nombres"
                  ? "Nombres"
                  : campo === "celular"
                  ? "Celular"
                  : campo === "correo"
                  ? "Correo electrónico"
                  : campo === "contrasena"
                  ? "Contraseña"
                  : "Confirmar Contraseña"
              }
              secureTextEntry={campo.includes("contrasena")}
              keyboardType={
                campo === "correo"
                  ? "email-address"
                  : campo === "celular"
                  ? "numeric"
                  : "default"
              }
              autoCapitalize={campo === "correo" ? "none" : "words"}
              value={(form as any)[campo]}
              onChangeText={(v) => actualizarCampo(campo, v)}
            />
            {errores[campo] && (
              <Text style={estilos.textoError}>{errores[campo]}</Text>
            )}
          </View>
        ))}

        {/* DATOS DEL LOCAL */}
        <Text style={estilos.subtitulo}>Datos del Local</Text>

        {["nombreLocal", "gps", "tipoBillar", "ciudad", "direccion"].map(
          (campo, idx) => (
            <View key={idx}>
              <TextInput
                style={estilos.campo}
                placeholder={
                  campo === "nombreLocal"
                    ? "Nombre del Local"
                    : campo === "gps"
                    ? "Latitud, Longitud (ej: -17.38, -66.15)"
                    : campo === "tipoBillar"
                    ? "Tipo de Billar"
                    : campo === "ciudad"
                    ? "Ciudad"
                    : "Dirección o Descripción"
                }
                value={(form as any)[campo]}
                onChangeText={(v) => actualizarCampo(campo, v)}
              />
              {errores[campo] && (
                <Text style={estilos.textoError}>{errores[campo]}</Text>
              )}
            </View>
          )
        )}

        {/* IMÁGENES DEL LOCAL */}
        <Text style={estilos.textoAzul}>Imágenes del Local</Text>
        <View style={estilos.filaImagenes}>
          {imagenesLocal.map((img, i) => (
            <Image key={i} source={{ uri: img }} style={estilos.imgPreview} />
          ))}
          <TouchableOpacity
            style={estilos.botonImagen}
            onPress={() => subirImagen("local")}
          >
            <Text style={estilos.textoMas}>＋</Text>
          </TouchableOpacity>
        </View>

        {/* MESAS */}
        <Text style={estilos.subtitulo}>Datos de las Mesas (mínimo 1)</Text>

        <TouchableOpacity style={estilos.botonCrearMesa} onPress={agregarMesa}>
          <Text style={estilos.textoAzul}>＋ Crear una Mesa</Text>
        </TouchableOpacity>

        {mesas.map((mesa, index) => (
          <View key={index} style={estilos.cardMesa}>
            <View style={estilos.headerMesa}>
              <Text style={estilos.textoNegrita}>Mesa {index + 1}</Text>
              <TouchableOpacity onPress={() => quitarMesa(index)}>
                <Text style={estilos.textoRojo}>🗑️ Quitar</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={estilos.campo}
              placeholder="Nro de Mesa"
              value={mesa.nroMesa}
              onChangeText={(t) =>
                setMesas(
                  mesas.map((m, i) =>
                    i === index ? { ...m, nroMesa: t } : m
                  )
                )
              }
            />
            <TextInput
              style={estilos.campo}
              placeholder="Descripción"
              value={mesa.descripcion}
              onChangeText={(t) =>
                setMesas(
                  mesas.map((m, i) =>
                    i === index ? { ...m, descripcion: t } : m
                  )
                )
              }
            />

            <Text style={estilos.textoAzul}>Fotos de la Mesa</Text>
            <View style={estilos.filaImagenes}>
              {mesa.fotos.map((f, i) => (
                <Image key={i} source={{ uri: f }} style={estilos.imgPreview} />
              ))}
              <TouchableOpacity
                style={estilos.botonImagen}
                onPress={() => subirImagen("mesa", index)}
              >
                <Text style={estilos.textoMas}>＋</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[
            estilos.botonRegistrar,
            { backgroundColor: formularioValido ? Colores.primario : "#A0C4FF" },
          ]}
          disabled={!formularioValido}
          onPress={manejarRegistro}
        >
          <Text style={estilos.textoLleno}>REGISTRARSE</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// 🎨 PALETA UNIFICADA
const Colores = {
  primario: "#0066FF", // Azul principal
  primarioOscuro: "#0033A0", // Azul oscuro
  verde: "#2A9D8F", // Verde acento
  fondo: "#F4F7FB", // Fondo claro
  textoClaro: "#FFFFFF",
  borde: "#E0E0E0",
  error: "#FF4B4B", // Rojo suave
};

const estilos = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: Colores.fondo, paddingBottom: 40 },
  contenedor: { paddingHorizontal: 24, paddingVertical: 30 },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: Colores.primarioOscuro,
    marginBottom: 20,
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colores.verde,
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
    marginBottom: 8,
  },
  textoError: { color: Colores.error, fontSize: 13, marginBottom: 8 },
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
  imgPreview: { width: 60, height: 60, borderRadius: 8 },
  textoMas: { fontSize: 28, color: Colores.primario },
  textoAzul: { color: Colores.primario, fontWeight: "600", marginBottom: 6 },
  textoRojo: { color: Colores.error, fontWeight: "bold" },
  textoNegrita: { fontWeight: "bold", marginBottom: 5 },
  headerMesa: { flexDirection: "row", justifyContent: "space-between" },
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
  botonRegistrar: { width: "100%", padding: 14, borderRadius: 12, marginTop: 10 },
  textoLleno: {
    color: Colores.textoClaro,
    fontWeight: "bold",
    textAlign: "center",
  },
});
