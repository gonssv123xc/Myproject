import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  Alert,
  ImageBackground,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
} from "react-native";
import { Plus, Pencil, Trash2, Scissors, X, AlertTriangle } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";
import { CustomHeader } from "../../components/CustomHeader";
import { CustomCard } from "../../components/CustomCard";
import { CustomButton } from "../../components/CustomButton";
import { CustomInput } from "../../components/CustomInput";
import { confirmLogout } from "../../utils/logout";
import { getServices, Service, formatDuration } from "../../services/bookingService";
import { addService, updateService, deleteService } from "../../services/ownerService";
import { supabase } from "../../services/supabase";
import { useFocusEffect } from "@react-navigation/native";

export const ServicesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isMobile = width < 720;

  const [services, setServices] = useState<Service[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: "", price: "", hours: "0", minutes: "30" });
  const [loading, setLoading] = useState(true);

  // Custom delete confirm modal
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  const loadServices = async () => {
    setLoading(true);
    const data = await getServices();
    setServices(data);
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadServices();
      const channel = supabase
        .channel('services_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'Service' }, () => {
          loadServices();
        })
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }, [])
  );

  const openAddModal = () => {
    setEditItem(null);
    setForm({ name: "", price: "", hours: "0", minutes: "30" });
    setModalVisible(true);
  };

  const openEditModal = (item: Service) => {
    setEditItem(item);
    const totalMinutes = item.durationMinutes ?? (parseInt(item.duration.replace(/[^0-9]/g, ""), 10) || 0);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    setForm({
      name: item.name,
      price: String(item.price),
      hours: String(h),
      minutes: String(m),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert("กรุณากรอกข้อมูล", "กรุณากรอกชื่อบริการ");
      return;
    }

    let parsedPrice = 0;
    if (form.price.includes("ฟรี") || form.price.toLowerCase().includes("free")) {
      parsedPrice = 0;
    } else {
      parsedPrice = parseInt(form.price.replace(/[^0-9]/g, ''), 10);
    }
    if (isNaN(parsedPrice)) parsedPrice = 0;

    const parsedHours = parseInt(form.hours.replace(/[^0-9]/g, ''), 10) || 0;
    const parsedMinutes = parseInt(form.minutes.replace(/[^0-9]/g, ''), 10) || 0;
    const parsedDuration = (parsedHours * 60) + parsedMinutes;

    if (parsedDuration <= 0) {
      Alert.alert("รูปแบบไม่ถูกต้อง", "กรุณาระบุระยะเวลาอย่างน้อย 1 นาที (ชั่วโมง หรือ นาที)");
      return;
    }

    setLoading(true);
    if (editItem) {
      const { error } = await updateService(editItem.id, {
        name: form.name.trim(),
        price: parsedPrice,
        duration: parsedDuration
      });
      if (error) Alert.alert("Error", "แก้ไขไม่สำเร็จ: " + error.message);
      else {
        Alert.alert("สำเร็จ", "แก้ไขบริการเรียบร้อย");
        await loadServices();
      }
    } else {
      const { error } = await addService({
        name: form.name.trim(),
        price: parsedPrice,
        duration: parsedDuration
      });
      if (error) Alert.alert("Error", "เพิ่มไม่สำเร็จ: " + error.message);
      else {
        Alert.alert("สำเร็จ", "เพิ่มบริการใหม่เรียบร้อย");
        await loadServices();
      }
    }
    setModalVisible(false);
    setLoading(false);
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteTargetId(id);
    setDeleteTargetName(name);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    const { error } = await deleteService(deleteTargetId);
    setIsDeleting(false);
    setDeleteModal(false);
    setDeleteTargetId(null);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      await loadServices();
    }
  };

  return (
    <ImageBackground
      source={require("../../../assets/13.jpg")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <CustomHeader roleLabel="จัดการบริการ" onLogout={() => confirmLogout(navigation, "StaffLogin")} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topRow}>
          <Text style={styles.title}>รายการบริการ</Text>
          <CustomButton
            title="เพิ่มบริการ"
            onPress={openAddModal}
            icon={<Plus size={16} color="#0F172A" />}
            style={{ height: 40, paddingHorizontal: 12 }}
            textStyle={{ fontSize: 13 }}
          />
        </View>
        
        {loading ? (
          <Text style={{ textAlign: "center", marginTop: 20, color: colors.textMuted }}>กำลังโหลดข้อมูล...</Text>
        ) : services.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20, color: colors.textMuted }}>ยังไม่มีบริการ</Text>
        ) : (
          services.map((item) => (
          <View key={item.id} style={[styles.glassCard, isMobile && styles.glassCardMobile]}>
            <View style={styles.serviceRow}>
              <View style={styles.leftInfo}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Scissors size={20} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.durationText}>{item.duration}</Text>
                </View>
              </View>

              <View style={styles.rightActions}>
                <Text style={styles.priceText}>฿{item.price}</Text>
                <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
                  <Pencil size={18} color="#94A3B8" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.iconBtnDanger}>
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )))}
      </ScrollView>

      {/* Modal Dialog */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, isMobile && styles.modalContentMobile]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editItem ? "แก้ไขบริการ" : "เพิ่มบริการใหม่"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              <CustomInput
                label="ชื่อบริการ"
                placeholder="เช่น ตัดผมชาย"
                value={form.name}
                onChangeText={(text) => setForm({ ...form, name: text })}
              />

              <CustomInput
                label="ราคา (บาท)"
                placeholder="เช่น 200"
                keyboardType="numeric"
                value={form.price}
                onChangeText={(text) => setForm({ ...form, price: text })}
              />

              {/* ระยะเวลาบริการ (ชั่วโมง และ นาที) */}
              <Text style={styles.inputSectionLabel}>ระยะเวลาบริการ</Text>
              <View style={styles.durationRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <CustomInput
                    label="ชั่วโมง (ชม.)"
                    placeholder="0"
                    keyboardType="numeric"
                    value={form.hours}
                    onChangeText={(text) => setForm({ ...form, hours: text.replace(/[^0-9]/g, '') })}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <CustomInput
                    label="นาที (น.)"
                    placeholder="30"
                    keyboardType="numeric"
                    value={form.minutes}
                    onChangeText={(text) => setForm({ ...form, minutes: text.replace(/[^0-9]/g, '') })}
                  />
                </View>
              </View>

              {/* Quick Presets */}
              <Text style={styles.presetLabel}>เลือกเวลาด่วน:</Text>
              <View style={styles.presetsContainer}>
                {[
                  { label: "15 นาที", h: "0", m: "15" },
                  { label: "30 นาที", h: "0", m: "30" },
                  { label: "45 นาที", h: "0", m: "45" },
                  { label: "1 ชม.", h: "1", m: "0" },
                  { label: "1 ชม. 30 น.", h: "1", m: "30" },
                  { label: "2 ชม.", h: "2", m: "0" },
                ].map((preset) => {
                  const isSelected = form.hours === preset.h && form.minutes === preset.m;
                  return (
                    <TouchableOpacity
                      key={preset.label}
                      style={[styles.presetChip, isSelected && styles.presetChipActive]}
                      onPress={() => setForm({ ...form, hours: preset.h, minutes: preset.m })}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Duration Live Preview Badge */}
              <View style={styles.previewBox}>
                <Text style={styles.previewText}>
                  ⏱️ รวมเวลา:{" "}
                  <Text style={styles.previewHighlight}>
                    {formatDuration((parseInt(form.hours || "0", 10) * 60) + parseInt(form.minutes || "0", 10))}
                  </Text>
                  {` (${(parseInt(form.hours || "0", 10) * 60) + parseInt(form.minutes || "0", 10)} นาที)`}
                </Text>
              </View>

              <CustomButton
                title={editItem ? "บันทึก" : "เพิ่มบริการ"}
                onPress={handleSave}
                style={{ marginTop: 8 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── Custom Delete Confirm Modal ─── */}
      <Modal visible={deleteModal} animationType="fade" transparent>
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteCard}>
            <View style={styles.deleteIconRing}>
              <View style={styles.deleteIconInner}>
                <AlertTriangle size={32} color="#EF4444" />
              </View>
            </View>

            <Text style={styles.deleteTitle}>ยืนยันการลบ</Text>
            <Text style={styles.deleteSubtitle}>คุณกำลังจะลบบริการ</Text>
            <Text style={styles.deleteServiceName}>"{deleteTargetName}"</Text>
            <Text style={styles.deleteWarning}>การกระทำนี้ไม่สามารถย้อนกลับได้</Text>

            <View style={styles.deleteDivider} />

            <View style={styles.deleteButtonRow}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={() => { setDeleteModal(false); setDeleteTargetId(null); }}
                disabled={isDeleting}
              >
                <Text style={styles.deleteCancelText}>ยกเลิก</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteConfirmBtn, isDeleting && { opacity: 0.6 }]}
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                <LinearGradient
                  colors={["#EF4444", "#B91C1C"]}
                  style={styles.deleteConfirmGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Trash2 size={16} color="#FFFFFF" />
                  <Text style={styles.deleteConfirmText}>
                    {isDeleting ? "กำลังลบ..." : "ลบเลย"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(10, 15, 30, 0.82)",
  },
  scrollContent: {
    padding: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  glassCard: {
    backgroundColor: "rgba(30, 41, 59, 0.75)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  glassCardMobile: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 16,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  durationText: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 2,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#10B981",
    marginRight: 4,
  },
  iconBtn: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  iconBtnDanger: {
    padding: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#1E293B",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    padding: 22,
    width: "100%",
    maxWidth: 480,
    maxHeight: "88%",
  },
  modalContentMobile: {
    width: "100%",
    maxHeight: "92%",
    padding: 16,
    borderRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  closeBtn: {
    padding: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
  },
  inputSectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
    marginTop: 4,
  },
  durationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  presetLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
    marginTop: 2,
  },
  presetsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  presetChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  presetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetChipText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
  },
  presetChipTextActive: {
    color: "#0F172A",
    fontWeight: "bold",
  },
  previewBox: {
    backgroundColor: "rgba(59, 130, 246, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.28)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 14,
    alignItems: "center",
  },
  previewText: {
    fontSize: 13,
    color: "#93C5FD",
  },
  previewHighlight: {
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  // ─── Delete Modal ───
  deleteOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  deleteCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#0F172A",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.28)",
    padding: 28,
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  deleteIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.28)",
  },
  deleteIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(239, 68, 68, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  deleteSubtitle: {
    fontSize: 15,
    color: "#94A3B8",
    textAlign: "center",
  },
  deleteServiceName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F87171",
    marginTop: 4,
    textAlign: "center",
  },
  deleteWarning: {
    fontSize: 13,
    color: "#475569",
    marginTop: 8,
    textAlign: "center",
  },
  deleteDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 24,
  },
  deleteButtonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  deleteCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteCancelText: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "600",
  },
  deleteConfirmBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  deleteConfirmGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  deleteConfirmText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
