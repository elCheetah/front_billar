// app/(principal)/local/configurarHorarios.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { api } from "../../../components/api";
import ConfirmModal from "../../../components/modals/ConfirmModal";
import ResultModal from "../../../components/modals/ResultModal";
import { getToken } from "../../../utils/authStorage";

/* 🎨 Paleta (igual que usas) */
const Colores = {
  primario: "#0066FF",
  primarioOscuro: "#0033A0",
  verde: "#2A9D8F",
  fondo: "#F4F7FB",
  textoClaro: "#FFFFFF",
  borde: "#E0E0E0",
  error: "#FF4B4B",
  naranja: "#FB8C00",
  inactivoFondo: "#FFEAEA",
};

/* ====== Tipos ====== */
type Shift = {
  id: string;          // uuid local para la UI
  open: number;        // 0..23 (HH)
  close: number;       // 0..23 (HH)  (regla A2: 0–23)  close > open
  active: boolean;     // estado visual (ACTIVO / INACTIVO)
  serverId?: number;   // id_horario cuando viene del backend
  isNew?: boolean;     // creado localmente aún sin persistir
};

type DayState = {
  name: string;      // "Domingo", "Lunes", ...
  enabled: boolean;  // día abierto (ON) o cerrado (OFF). OFF elimina turnos en backend.
  editing: boolean;  // habilita inputs/acciones inline
  shifts: Shift[];   // máx 2
  _original?: Omit<DayState, "editing" | "_original">; // espejo para dirty-check
};

type DiaKey = "DOMINGO" | "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES" | "SABADO";

/* ====== Constantes / helpers ====== */
const DISPLAY_DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;
const BACK_DAYS: DiaKey[] = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

const nameToKey = (n: string): DiaKey => {
  const i = DISPLAY_DAYS.indexOf(n as any);
  return BACK_DAYS[i]!;
};
const keyToName = (k: DiaKey): string => {
  const i = BACK_DAYS.indexOf(k);
  return DISPLAY_DAYS[i]!;
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const hhToStr = (h: number) => `${pad2(h)}:00`;
const fmt = (h: number) => `${pad2(h)}:00`;
const Hs = Array.from({ length: 24 }, (_, h) => h); // 0..23

const makeUUID = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Chequeo: close>open y no solapes (⚠️ incluye también INACTIVOS porque el backend valida todo el conjunto) */
function hasOverlapOrInvalid(shifts: Shift[]) {
  const all = [...shifts].sort((a, b) => a.open - b.open);
  for (let i = 0; i < all.length; i++) {
    const s = all[i];
    if (s.close <= s.open) return true;
    if (i > 0) {
      const prev = all[i - 1];
      if (s.open < prev.close) return true;
    }
  }
  return false;
}

/* ---------- Picker de hora (modal simple 0..23) ---------- */
function HourPicker({
  visible,
  onPick,
  onClose,
}: {
  visible: boolean;
  onPick: (h: number) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={pickerStyles.overlay}>
        <TouchableOpacity style={pickerStyles.backdrop} onPress={onClose} />
        <View style={pickerStyles.card}>
          <Text style={pickerStyles.title}>Selecciona hora</Text>
          <FlatList
            data={Hs}
            keyExtractor={(h) => String(h)}
            renderItem={({ item }) => (
              <TouchableOpacity style={pickerStyles.item} onPress={() => onPick(item)}>
                <Text style={{ fontWeight: "600" }}>{fmt(item)}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#eee" }} />}
            style={{ maxHeight: 360 }}
          />
          <TouchableOpacity style={[pickerStyles.item, { alignItems: "center" }]} onPress={onClose}>
            <Text style={{ color: "#666" }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ===================== Componente principal ===================== */
export default function ConfigurarHorarios() {
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  // Estado principal por día
  const [days, setDays] = useState<DayState[]>(
    DISPLAY_DAYS.map((name) => ({
      name,
      enabled: false,     // 👈 por defecto CERRADO hasta cargar desde backend
      editing: false,
      shifts: [],
    }))
  );

  // UI: pickers/modals
  const [picker, setPicker] = useState<null | { dayIdx: number; shiftIdx: number; field: "open" | "close" }>(null);
  const [confirm, setConfirm] = useState<
    | null
    | { tipo: "guardar"; dayIdx: number }
    | { tipo: "off"; dayIdx: number }
    | { tipo: "del"; dayIdx: number; shiftIdx: number }
  >(null);
  const [result, setResult] = useState<{ type: "success" | "error"; title: string; msg: string } | null>(null);

  /* ====== Cargar token + horarios del backend ====== */
  useEffect(() => {
    (async () => {
      try {
        const t = await getToken();
        setToken(t);
        await fetchHorarios(t || undefined);
      } catch (e: any) {
        setResult({ type: "error", title: "Error", msg: e?.message || "No se pudo inicializar." });
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const fetchHorarios = async (tk?: string) => {
    try {
      const json = await api("/horarios/local", { token: tk });
      const data: Record<DiaKey, Array<{ id_horario: number; hora_apertura: string; hora_cierre: string; estado: "ACTIVO" | "INACTIVO" }>> =
        json.data || {};

      const newDays: DayState[] = DISPLAY_DAYS.map((name, idx) => {
        const key = BACK_DAYS[idx];
        const arr = Array.isArray(data[key]) ? data[key] : [];
        if (!arr.length) {
          // Sin horarios => cerrado por defecto
          return {
            name,
            enabled: false,
            editing: false,
            shifts: [],
            _original: { name, enabled: false, shifts: [] },
          };
        }
        const shifts: Shift[] = arr.map((r) => ({
          id: `srv-${r.id_horario}`,
          serverId: r.id_horario,
          open: parseInt(r.hora_apertura.slice(0, 2), 10),
          close: parseInt(r.hora_cierre.slice(0, 2), 10),
          active: r.estado === "ACTIVO",
          isNew: false,
        }));
        return {
          name,
          enabled: true,
          editing: false,
          shifts,
          _original: { name, enabled: true, shifts: shifts.map((s) => ({ ...s })) },
        };
      });
      setDays(newDays);
    } catch (e: any) {
      setDays(DISPLAY_DAYS.map((name) => ({ name, enabled: false, editing: false, shifts: [] })));
      setResult({ type: "error", title: "Error", msg: e?.message || "No se pudo obtener los horarios." });
    }
  };

  /* ====== Memo: reglas por día ====== */
  const rules = useMemo(() => {
    return days.map((d) => {
      const invalid = d.enabled && (d.shifts.length === 0 || hasOverlapOrInvalid(d.shifts));
      const showSave = d.editing && d.enabled; // Guardar sólo cuando está ON y en edición
      const saveLabel = d._original ? "Guardar cambios" : "Guardar";
      return { invalid, showSave, saveLabel };
    });
  }, [days]);

  /* ====== Mutaciones ====== */
  const updateDay = (i: number, patch: Partial<DayState>) =>
    setDays((prev) => {
      const c = [...prev];
      c[i] = { ...c[i], ...patch };
      return c;
    });

  const updateShift = (dayIdx: number, shiftIdx: number, patch: Partial<Shift>) =>
    setDays((prev) => {
      const copy = [...prev];
      const ds = { ...copy[dayIdx] };
      const arr = ds.shifts.slice();
      arr[shiftIdx] = { ...arr[shiftIdx], ...patch };
      ds.shifts = arr;
      copy[dayIdx] = ds;
      return copy;
    });

  const addShift = (dayIdx: number) =>
    setDays((prev) => {
      const copy = [...prev];
      const d = { ...copy[dayIdx] };
      if (d.shifts.length >= 2) return prev; // máx 2
      // Preferencia por 08–20; si choca probar 20–22; si no, 10–18
      const candidates: [number, number][] = [
        [8, 20],
        [20, 22],
        [10, 18],
      ];
      let chosen: [number, number] = [8, 20];
      for (const cnd of candidates) {
        const temp = [...d.shifts, { id: makeUUID(), open: cnd[0], close: cnd[1], active: true }];
        if (!hasOverlapOrInvalid(temp)) {
          chosen = cnd;
          break;
        }
      }
      d.shifts = [...d.shifts, { id: makeUUID(), open: chosen[0], close: chosen[1], active: true, isNew: true }];
      copy[dayIdx] = d;
      return copy;
    });

  const removeShiftLocal = (dayIdx: number, shiftIdx: number) =>
    setDays((prev) => {
      const copy = [...prev];
      const d = { ...copy[dayIdx] };
      d.shifts = d.shifts.filter((_, i) => i !== shiftIdx);
      copy[dayIdx] = d;
      return copy;
    });

  /* ====== API helpers ====== */
  const putDia = async (dayIdx: number) => {
    const d = days[dayIdx];
    const key = nameToKey(d.name);
    const body = d.enabled
      ? {
          turnos: d.shifts.map((s) => ({
            hora_apertura: hhToStr(s.open),
            hora_cierre: hhToStr(s.close),
            estado: s.active ? "ACTIVO" : "INACTIVO",
          })),
        }
      : { turnos: [] };

    const json = await api(`/horarios/local/dia/${key}`, {
      method: "PUT",
      body,
      token: token || undefined,
    });

    // Respuesta: { ok, message, data: { [dayKey]: [...] } }
    const updatedArr = (json.data?.[key] || []) as Array<{
      id_horario: number;
      hora_apertura: string;
      hora_cierre: string;
      estado: "ACTIVO" | "INACTIVO";
    }>;

    // Aplicar a UI
    setDays((prev) => {
      const copy = [...prev];
      if (updatedArr.length === 0) {
        copy[dayIdx] = {
          name: d.name,
          enabled: false,
          editing: false,
          shifts: [],
          _original: { name: d.name, enabled: false, shifts: [] },
        };
      } else {
        const shifts: Shift[] = updatedArr.map((r) => ({
          id: `srv-${r.id_horario}`,
          serverId: r.id_horario,
          open: parseInt(r.hora_apertura.slice(0, 2), 10),
          close: parseInt(r.hora_cierre.slice(0, 2), 10),
          active: r.estado === "ACTIVO",
          isNew: false,
        }));
        copy[dayIdx] = {
          name: d.name,
          enabled: true,
          editing: false,
          shifts,
          _original: { name: d.name, enabled: true, shifts: shifts.map((s) => ({ ...s })) },
        };
      }
      return copy;
    });

    return json;
  };

  /* ====== Acciones ====== */
  // Guardar por día (reemplaza en backend)
  const onGuardar = async (dayIdx: number) => {
    setConfirm(null);
    const d = days[dayIdx];

    if (d.enabled) {
      if (d.shifts.length === 0) {
        setResult({ type: "error", title: "Sin turnos", msg: "Agrega al menos un turno o deshabilita el día." });
        return;
      }
      if (hasOverlapOrInvalid(d.shifts)) {
        setResult({ type: "error", title: "Solapamiento", msg: "Revisa horas: Cerrar > Abrir y sin solapes." });
        return;
      }
    }

    try {
      await putDia(dayIdx);
      setResult({ type: "success", title: "Guardado", msg: `Horario de ${d.name} actualizado.` });
    } catch (e: any) {
      setResult({ type: "error", title: "Error", msg: e?.message || "No se pudo guardar el día." });
    }
  };

  // Toggle ON/OFF del día
  const onToggleDay = (dayIdx: number) => {
    const d = days[dayIdx];
    if (d.enabled) {
      // Al pasar a OFF: confirmar y eliminar en backend
      setConfirm({ tipo: "off", dayIdx });
    } else {
      // ON: aparece vacío; editar en línea
      updateDay(dayIdx, { enabled: true, editing: true, shifts: [] });
      setResult({ type: "success", title: "Día habilitado", msg: `Ahora agrega turnos para ${d.name}.` });
    }
  };

  // Confirmar OFF (elimina turnos en backend)
  const onConfirmOff = async (dayIdx: number) => {
    setConfirm(null);
    // Fuerza body turnos:[]
    const d = days[dayIdx];
    try {
      // enviar día vacío
      setDays((prev) => {
        const copy = [...prev];
        copy[dayIdx] = { ...copy[dayIdx], editing: false }; // bloquear edición mientras llama
        return copy;
      });

      const key = nameToKey(d.name);
      await api(`/horarios/local/dia/${key}`, {
        method: "PUT",
        body: { turnos: [] },
        token: token || undefined,
      });

      // actualizar UI: OFF sin turnos
      setDays((prev) => {
        const copy = [...prev];
        copy[dayIdx] = {
          name: d.name,
          enabled: false,
          editing: false,
          shifts: [],
          _original: { name: d.name, enabled: false, shifts: [] },
        };
        return copy;
      });
      setResult({ type: "success", title: "Día deshabilitado", msg: `Se eliminaron los turnos de ${d.name}.` });
    } catch (e: any) {
      setResult({ type: "error", title: "Error", msg: e?.message || "No se pudo deshabilitar el día." });
    }
  };

  // Eliminar turno (local) — se persiste al Guardar
  const onDelShift = (dayIdx: number, shiftIdx: number) => {
    setConfirm({ tipo: "del", dayIdx, shiftIdx });
  };
  const onConfirmDelShift = (dayIdx: number, shiftIdx: number) => {
    setConfirm(null);
    removeShiftLocal(dayIdx, shiftIdx);
    setResult({ type: "success", title: "Turno eliminado", msg: "Recuerda guardar para aplicar cambios." });
  };

  /* ====== Render ====== */
  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colores.fondo }}>
        <ActivityIndicator size="large" color={Colores.primario} />
        <Text style={{ marginTop: 8, color: Colores.primarioOscuro, fontWeight: "600" }}>Cargando horarios…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colores.fondo }} contentContainerStyle={styles.scroll}>
      <View style={styles.contenedor}>
        <Text style={styles.titulo}>Configurar horarios</Text>

        {days.map((d, dayIdx) => {
          const { invalid, showSave, saveLabel } = rules[dayIdx];

          return (
            <View key={d.name} style={styles.dayCard}>
              {/* Encabezado del día */}
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{d.name}</Text>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  {/* Switch ON/OFF día */}
                  <TouchableOpacity onPress={() => onToggleDay(dayIdx)} style={styles.toggleWrap} activeOpacity={0.9}>
                    <View style={[styles.toggle, d.enabled ? styles.toggleOn : styles.toggleOff]}>
                      <View style={[styles.knob, d.enabled ? styles.knobOn : styles.knobOff]} />
                    </View>
                  </TouchableOpacity>

                  {/* Editar inline */}
                  <TouchableOpacity
                    onPress={() => updateDay(dayIdx, { editing: !d.editing })}
                    style={stylesActionBtn()}
                  >
                    <Ionicons name="pencil-outline" size={18} color={Colores.primario} />
                    <Text style={[styles.btnHeaderTxt, { color: Colores.primario }]}>
                      {d.editing ? "Terminar" : "Editar"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Indicador de cerrado */}
              {!d.enabled && <Text style={{ color: "#666", marginBottom: 8 }}>Cerrado</Text>}

              {/* Turnos */}
              {d.enabled && (
                <>
                  {d.shifts.map((s, shiftIdx) => {
                    const bg = s.active ? "#fff" : Colores.inactivoFondo;
                    const editable = d.editing;
                    const err = s.close <= s.open;

                    return (
                      <View key={s.id} style={[styles.shiftRow, { backgroundColor: bg }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.smallLabel}>Abrir</Text>
                          <TouchableOpacity
                            disabled={!editable}
                            onPress={() => setPicker({ dayIdx, shiftIdx, field: "open" })}
                            style={[styles.input, !editable && styles.inputDisabled, err && styles.inputError]}
                            activeOpacity={0.9}
                          >
                            <Text style={{ color: editable ? "#111" : "#777" }}>{fmt(s.open)}</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={{ marginHorizontal: 6, alignSelf: "center" }}>—</Text>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.smallLabel}>Cerrar</Text>
                          <TouchableOpacity
                            disabled={!editable}
                            onPress={() => setPicker({ dayIdx, shiftIdx, field: "close" })}
                            style={[styles.input, !editable && styles.inputDisabled, err && styles.inputError]}
                            activeOpacity={0.9}
                          >
                            <Text style={{ color: editable ? "#111" : "#777" }}>{fmt(s.close)}</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Acciones por turno: sólo visibles en edición */}
                        {editable && (
                          <View style={styles.shiftActions}>
                            {/* Activar/Inactivar */}
                            <TouchableOpacity
                              style={styles.iconBtn}
                              onPress={() => updateShift(dayIdx, shiftIdx, { active: !s.active })}
                            >
                              <Ionicons
                                name={s.active ? "checkmark-circle-outline" : "close-circle-outline"}
                                size={20}
                                color={s.active ? Colores.verde : Colores.naranja}
                              />
                            </TouchableOpacity>

                            {/* Eliminar (con confirmación) */}
                            <TouchableOpacity
                              style={styles.iconBtn}
                              onPress={() => onDelShift(dayIdx, shiftIdx)}
                            >
                              <Ionicons name="trash-outline" size={20} color={Colores.error} />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}

                  {/* Error solapamiento / validación */}
                  {invalid && (
                    <Text style={styles.textoError}>
                      Revisa las horas: Cerrar debe ser mayor que Abrir y sin solaparse.
                    </Text>
                  )}

                  {/* Añadir turno (máx 2) — sólo en edición */}
                  {d.editing && d.shifts.length < 2 && (
                    <TouchableOpacity style={styles.addSlotBtn} onPress={() => addShift(dayIdx)}>
                      <Ionicons name="add-circle-outline" size={18} color={Colores.primario} />
                      <Text style={{ color: Colores.primario, fontWeight: "700" }}>Añadir horario</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {/* Guardar por día (sólo si ON y editando) */}
              {showSave && (
                <TouchableOpacity
                  disabled={rules[dayIdx].invalid}
                  style={[
                    styles.btnGuardar,
                    { backgroundColor: rules[dayIdx].invalid ? "#A0C4FF" : Colores.primario },
                  ]}
                  onPress={() => setConfirm({ tipo: "guardar", dayIdx })}
                >
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 8 }}>{saveLabel}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* Picker de horas */}
      <HourPicker
        visible={picker !== null}
        onClose={() => setPicker(null)}
        onPick={(h) => {
          if (!picker) return;
          const { dayIdx, shiftIdx, field } = picker;
          updateShift(dayIdx, shiftIdx, { [field]: h } as any);
          setPicker(null);
        }}
      />

      {/* Confirmaciones */}
      <ConfirmModal
        visible={!!confirm && confirm.tipo === "guardar"}
        title="Guardar horario"
        message="Se aplicarán los cambios de este día."
        cancelText="Cancelar"
        confirmText="Guardar"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm && confirm.tipo === "guardar") onGuardar(confirm.dayIdx);
        }}
      />

      <ConfirmModal
        visible={!!confirm && confirm.tipo === "off"}
        title="Deshabilitar día"
        message="Se eliminarán todos los turnos de este día."
        cancelText="Cancelar"
        confirmText="Deshabilitar"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm && confirm.tipo === "off") onConfirmOff(confirm.dayIdx);
        }}
      />

      <ConfirmModal
        visible={!!confirm && confirm.tipo === "del"}
        title="Eliminar turno"
        message="Este turno será quitado de la lista."
        cancelText="Cancelar"
        confirmText="Eliminar"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm && confirm.tipo === "del") onConfirmDelShift(confirm.dayIdx, confirm.shiftIdx);
        }}
      />

      {/* Resultado */}
      <ResultModal
        visible={!!result}
        type={result?.type || "success"}
        title={result?.title || ""}
        message={result?.msg || ""}
        onClose={() => setResult(null)}
      />
    </ScrollView>
  );
}

/* 🎨 Estilos */
const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  contenedor: { paddingHorizontal: 20, paddingTop: 24 },
  titulo: { fontSize: 22, fontWeight: "bold", color: Colores.primarioOscuro, marginBottom: 12 },

  dayCard: {
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    backgroundColor: "#fff",
  },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  dayTitle: { fontSize: 16, fontWeight: "bold" },

  smallLabel: { fontSize: 12, color: "#333", marginBottom: 4, fontWeight: "600" },

  input: {
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: 10,
    paddingVertical: Platform.select({ ios: 10, android: 8 }),
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    minWidth: 110,
  },
  inputDisabled: { backgroundColor: "#f2f2f2" },
  inputError: { borderColor: Colores.error },

  shiftRow: {
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shiftActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colores.borde,
  },

  addSlotBtn: {
    backgroundColor: "#E8F0FF",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },

  btnHeaderTxt: { fontWeight: "bold" },

  btnGuardar: {
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 10,
    flexDirection: "row",
  },

  // Toggle ON/OFF del día
  toggleWrap: { paddingHorizontal: 2, paddingVertical: 2 },
  toggle: {
    width: 54,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleOn: { backgroundColor: "#c7f5e9" },
  toggleOff: { backgroundColor: "#e9e9e9" },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  knobOn: { alignSelf: "flex-end" },
  knobOff: { alignSelf: "flex-start" },

  textoError: { color: Colores.error, fontSize: 12, marginTop: 8 },
});

/* helpers de estilo (botones de acción, mismo look que Mesas) */
const stylesActionBtn = () =>
  ({
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colores.borde,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  } as const);

/* 🎛️ Estilos picker de horas */
const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  backdrop: { ...(StyleSheet.absoluteFillObject as any), backgroundColor: "rgba(0,0,0,0.35)" },
  card: { width: "85%", backgroundColor: "#fff", borderRadius: 14, padding: 16, elevation: 6 },
  title: { fontWeight: "800", fontSize: 16, marginBottom: 8, color: Colores.primarioOscuro },
  item: { paddingVertical: 12, paddingHorizontal: 4 },
});
