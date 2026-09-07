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
import { getServices, Service } from "../../services/bookingService";
import { addService, updateService, deleteService } from "../../services/ownerService";
import { useFocusEffect } from "@react-navigation/native";

export const ServicesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [services, setServices] = useState<Service[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: "", price: "", duration: "" });
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
    }, [])
  );

  const openAddModal = () => {
    setEditItem(null);
    setForm({ name: "", price: "", duration: "" });
    setModalVisible(true);
  };

  const openEditModal = (item: Service) => {
    setEditItem(item);
    // Parse duration string back to number if needed, or keep as is for input
    setForm({ name: item.name, price: String(item.price), duration: item.duration.replace(" นาที", "") });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.duration) {
      Alert.alert("กรุณากรอกข้อมูล", "กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    let parsedPrice = 0;
    if (form.price.includes("ฟรี") || form.price.toLowerCase().includes("free")) {
      parsedPrice = 0;
    } else {
      parsedPrice = parseInt(form.price.replace(/[^0-9]/g, ''), 10);
    }
    
    let parsedDuration = parseInt(form.duration.replace(/[^0-9]/g, ''), 10);

    if (isNaN(parsedPrice)) parsedPrice = 0;
    if (isNaN(parsedDuration)) parsedDuration = 0;

    if (parsedDuration === 0) {
      Alert.alert("รูปแบบไม่ถูกต้อง", "กรุณาระบุระยะเวลาเป็นตัวเลข (เช่น 30)");
      return;
    }

    setLoading(true);
    if (editItem) {
      const { error } = await updateService(editItem.id, {
        name: form.name,
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
        name: form.name,
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
          <View key={item.id} style={styles.glassCard}>
            <View style={styles.serviceRow}>
              <View style={styles.leftInfo}>
                <View style={[styles.iconBg, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Scissors size={20} color="#3B82F6" />
                </View>
                <View>
                  <Text style={styles.serviceName}>{item.name}</Text>
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
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editItem ? "แก้ไขบริการ" : "เพิ่มบริการใหม่"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

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

            <CustomInput
              label="ระยะเวลา (นาที)"
              placeholder="เช่น 30"
              keyboardType="numeric"
              value={form.duration}
              onChangeText={(text) => setForm({ ...form, duration: text })}
            />

            <CustomButton
              title={editItem ? "บันทึก" : "เพิ่มบริการ"}
              onPress={handleSave}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
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
    gap: 12,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#10B981",
    marginRight: 8,
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
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
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
    color: colors.text,
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
