// components/modals/ResultModal.tsx
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const C = { primary:"#0066FF", success:"#2A9D8F", danger:"#FF4B4B" };

export default function ResultModal({
  visible, type, title, message, buttonText = "Aceptar", onClose,
}: {
  visible: boolean;
  type: "success" | "error";
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
}) {
  const color = type === "success" ? C.success : C.danger;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={[styles.title, { color }]}>{title}</Text>
          <Text style={styles.msg}>{message}</Text>
          <TouchableOpacity style={[styles.btn, { backgroundColor: color }]} onPress={onClose}>
            <Text style={styles.btnText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:{ flex:1, backgroundColor:"rgba(0,0,0,0.35)", justifyContent:"center", alignItems:"center" },
  card:{ width:"85%", backgroundColor:"#fff", borderRadius:14, padding:18, gap:10 },
  title:{ fontSize:18, fontWeight:"800" },
  msg:{ fontSize:14, color:"#444" },
  btn:{ paddingVertical:12, borderRadius:10, alignItems:"center" },
  btnText:{ color:"#fff", fontWeight:"800" },
});
