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

  // Datos del propietario
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

  const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/;
  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const celularValido = /^[0-9]{8,}$/;
  const gpsValido =
    /^-?\d{1,2}\.\d{1,8},\s*-?\d{1,3}\.\d{1,8}$/; // ej: "-17.3895, -66.1567"
  const contrasenaValida =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_.])[A-Za-z\d!@#$%^&*_.]{6,}$/;

  // Actualiza campo y valida al instante
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
        if (!soloLetras.test(valor.trim())) error = "Solo se permiten letras.";
        break;
      case "celular":
        if (!celularValido.test(valor.trim()))
          error = "Debe tener al menos 8 dígitos numéricos.";
        break;
      case "correo":
        if (!correoValido.test(valor.trim()))
          error = "Formato de correo no válido (ej: nombre@correo.com).";
        break;
      case "contrasena":
        if (!contrasenaValida.test(valor))
          error =
            "Debe tener 6+ caracteres, una mayúscula, un número y un símbolo.";
        break;
      case "confirmarContrasena":
        if (valor !== form.contrasena)
          error = "Las contraseñas no coinciden.";
        break;
      case "gps":
        if (valor.trim() !== "" && !gpsValido.test(valor.trim()))
          error = "Formato incorrecto. Ejemplo: -17.3895, -66.1567";
        break;
      case "direccion":
        if (valor.trim().length < 5)
          error = "La dirección debe tener al menos 5 caracteres.";
        break;
    }

    setErrores((prev) => ({ ...prev, [campo]: error }));
  };

  const formularioValido =
    Object.values(form).every((v) => v.trim() !== "") &&
    Object.values(errores).every((e) => e === "") &&
    mesas.length > 0 &&
    mesas.every((m) => m.nroMesa.trim() && m.descripcion.trim());

  const agregarMesa = () => {
    setMesas([...mesas, { nroMesa: "", descripcion: "", fotos: [] }]);
  };

  const actualizarMesa = (i: number, campo: string, valor: string) => {
    const copia = [...mesas];
    copia[i] = { ...copia[i], [campo]: valor };
    setMesas(copia);
  };

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

  const manejarRegistro = () => {
    if (!formularioValido) {
      Alert.alert("Formulario incompleto", "Corrige los errores antes de continuar.");
      return;
    }
    Alert.alert("Éxito", "Propietario registrado correctamente 🎱");
    router.replace("/(principal)");
  };

  return (
    <ScrollView contentContainerStyle={estilos.scroll}>
      <View style={estilos.contenedor}>
        <Text style={[estilos.titulo, { color: Colores.rojo }]}>
          Registrarse como Propietario de Local de Billar
        </Text>

        {/* DATOS DEL PROPIETARIO */}
        <Text style={[estilos.subtitulo, { color: Colores.verde }]}>
          Datos del Propietario
        </Text>

        {["primerAp", "segundoAp", "nombres", "celular", "correo", "contrasena", "confirmarContrasena"].map(
          (campo, idx) => (
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
              {errores[campo] ? (
                <Text style={estilos.textoError}>{errores[campo]}</Text>
              ) : null}
            </View>
          )
        )}

        {/* DATOS DEL LOCAL */}
        <Text style={[estilos.subtitulo, { color: Colores.verde }]}>
          Datos del Local
        </Text>

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
              {errores[campo] ? (
                <Text style={estilos.textoError}>{errores[campo]}</Text>
              ) : null}
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

        {/* DATOS DE MESAS */}
        <Text style={[estilos.subtitulo, { color: Colores.rojo }]}>
          Datos de las Mesas (mínimo 1)
        </Text>
        <TouchableOpacity style={estilos.botonCrearMesa} onPress={agregarMesa}>
          <Text style={estilos.textoAzul}>＋ Crear una Mesa</Text>
        </TouchableOpacity>

        {mesas.map((mesa, index) => (
          <View key={index} style={estilos.cardMesa}>
            <Text style={estilos.textoNegrita}>Mesa {index + 1}</Text>
            <TextInput
              style={estilos.campo}
              placeholder="Nro de Mesa"
              value={mesa.nroMesa}
              onChangeText={(t) => actualizarMesa(index, "nroMesa", t)}
            />
            <TextInput
              style={estilos.campo}
              placeholder="Descripción"
              value={mesa.descripcion}
              onChangeText={(t) => actualizarMesa(index, "descripcion", t)}
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

const estilos = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: Colores.fondo, paddingBottom: 40 },
  contenedor: { paddingHorizontal: 24, paddingVertical: 30 },
  titulo: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  subtitulo: { fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10 },
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
  textoNegrita: { fontWeight: "bold", marginBottom: 5 },
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
