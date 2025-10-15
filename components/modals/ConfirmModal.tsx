// components/modals/ConfirmModal.tsx
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const C = { primary:"#0066FF", primaryDark:"#0033A0", danger:"#FF4B4B", bg:"#FFFFFF" };

export default function ConfirmModal({
  visible, title, message, onCancel, onConfirm,
  confirmText = "Confirmar", cancelText = "Cancelar",
}: {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.msg}>{message}</Text>

          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.outline]} onPress={onCancel}>
              <Text style={[styles.btnText, { color: C.primaryDark }]}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.fill]} onPress={onConfirm}>
              <Text style={[styles.btnText, { color: "#FFF" }]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:{ flex:1, backgroundColor:"rgba(0,0,0,0.35)", justifyContent:"center", alignItems:"center" },
  card:{ width:"85%", backgroundColor:"#fff", borderRadius:14, padding:18 },
  title:{ fontSize:18, fontWeight:"700", marginBottom:8, color:C.primaryDark },
  msg:{ fontSize:14, color:"#444", marginBottom:16 },
  row:{ flexDirection:"row", gap:10, justifyContent:"flex-end" },
  btn:{ paddingVertical:12, paddingHorizontal:16, borderRadius:10, minWidth:110, alignItems:"center" },
  outline:{ borderWidth:2, borderColor:C.primary },
  fill:{ backgroundColor:C.primary },
  btnText:{ fontWeight:"700" },
});
