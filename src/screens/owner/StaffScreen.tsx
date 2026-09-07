import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Image,
  TextInput,
} from "react-native";
import { Plus, Trash2, User, X, Edit2, Upload, Search, Link2, Unlink } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from 'expo-image-picker';
import { colors } from "../../theme/colors";
import { CustomHeader } from "../../components/CustomHeader";
import { CustomInput } from "../../components/CustomInput";
import { confirmLogout } from "../../utils/logout";
import { 
  getStaff, StaffMember, addBarber, deleteBarber, updateBarber, uploadBarberAvatar,
  searchCustomers, getLinkedCustomers, linkCustomerToBarber, unlinkCustomerFromBarber
} from "../../services/ownerService";
import { supabase } from "../../services/supabase";
import { useFocusEffect } from "@react-navigation/native";

export const StaffScreen: React.FC = () => {
  const navigation = useNavigation();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({ name: "", email: "", specialty: "", phone: "", avatar: "" });
  
  // Connection Manager State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [linkedCustomers, setLinkedCustomers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const loadStaff = async () => {
    if (staff.length === 0) setLoading(true);
    const data = await getStaff();
    setStaff(data.filter(s => s.status === 'active'));
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadStaff();
      const channel = supabase
        .channel('staff_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'Barber' }, () => loadStaff())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'User' }, () => loadStaff())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'BarberCustomerLink' }, () => loadStaff())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }, [])
  );

  // Avatar Picker
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.base64) {
        setForm({ ...form, avatar: `data:image/jpeg;base64,${asset.base64}` });
      }
    }
  };

  // Connection Manager functions
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const res = await searchCustomers(searchQuery);
        // Filter out already linked customers from search results
        const linkedIds = linkedCustomers.map(lc => lc.id);
        setSearchResults(res.filter(r => !linkedIds.includes(r.id)));
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, linkedCustomers]);

  const loadLinked = async (barberId: string) => {
    const res = await getLinkedCustomers(barberId);
    setLinkedCustomers(res);
  };

  const handleLink = async (customerId: string) => {
    if (!editingId) {
      Alert.alert("กรุณาบันทึกช่างก่อน", "คุณต้องเพิ่มช่างให้สำเร็จก่อนถึงจะเชื่อมโยงลูกค้าได้");
      return;
    }
    const success = await linkCustomerToBarber(editingId, customerId);
    if (success) {
      setSearchQuery("");
      loadLinked(editingId);
    }
  };

  const handleUnlink = async (customerId: string) => {
    if (!editingId) return;
    const success = await unlinkCustomerFromBarber(editingId, customerId);
    if (success) loadLinked(editingId);
  };

  const openAddModal = () => {
    setForm({ name: "", email: "", specialty: "", phone: "", avatar: "" });
    setEditingId(null);
    setLinkedCustomers([]);
    setSearchQuery("");
    setSearchResults([]);
    setModalVisible(true);
  };

  const handleEdit = (staffMember: StaffMember) => {
    setForm({ 
      name: staffMember.name, 
      email: staffMember.email, 
      specialty: staffMember.experience,
      phone: staffMember.phone || "",
      avatar: staffMember.avatar || ""
    });
    setEditingId(staffMember.id);
    loadLinked(staffMember.id);
    setSearchQuery("");
    setSearchResults([]);
    setModalVisible(true);
  };

  const handleSaveStaff = async () => {
    if (!form.name) {
      Alert.alert("กรุณากรอกข้อมูล", "กรุณากรอกชื่อ-นามสกุลช่าง");
      return;
    }

    setSaving(true);
    let finalAvatarUrl = form.avatar;

    if (editingId) {
      // If editing and image is base64, upload it
      if (form.avatar && form.avatar.startsWith("data:image")) {
        const base64Data = form.avatar.split(",")[1];
        const uploadedUrl = await uploadBarberAvatar(editingId, base64Data);
        if (uploadedUrl) finalAvatarUrl = uploadedUrl;
      }

      const result = await updateBarber(editingId, {
        name: form.name,
        specialty: form.specialty,
        phone: form.phone,
        avatar: finalAvatarUrl,
      });
      setSaving(false);
      
      if (!result.success) {
        Alert.alert("เกิดข้อผิดพลาด", result.error || "ไม่สามารถอัปเดตข้อมูลได้");
        return;
      }
    } else {
      if (!form.email) {
        Alert.alert("กรุณากรอกข้อมูล", "กรุณากรอกอีเมลสำหรับช่างใหม่");
        setSaving(false);
        return;
      }
      
      const result = await addBarber({
        name: form.name,
        email: form.email,
        specialty: form.specialty,
        phone: form.phone,
        avatar: finalAvatarUrl, // New barbers won't have the uploaded URL initially due to ID generation inside addBarber, but for now we pass it (will need refactor for true avatar on create)
      });
      setSaving(false);

      if (!result.success) {
        Alert.alert("เกิดข้อผิดพลาด", result.error || "ไม่สามารถเพิ่มช่างได้");
        return;
      }

      Alert.alert(
        "เพิ่มช่างสำเร็จ! 🎉",
        `ช่าง ${form.name} ถูกเพิ่มเรียบร้อยแล้ว\n(หากต้องการผูกลูกค้า กรุณากดแก้ไขช่างคนนี้อีกครั้ง)`
      );
    }
    
    setModalVisible(false);
    loadStaff(); 
  };

  const handleDeleteStaff = (id: string, name: string) => {
    Alert.alert("ลบช่าง", `คุณต้องการลบช่าง "${name}" ใช่หรือไม่?`, [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ", style: "destructive",
        onPress: async () => {
          const result = await deleteBarber(id);
          if (!result.success) Alert.alert("เกิดข้อผิดพลาด", result.error || "ไม่สามารถลบช่างได้");
        },
      },
    ]);
  };

  return (
    <ImageBackground source={require("../../../assets/13.jpg")} style={styles.container} resizeMode="cover">
      <View style={styles.overlay} />
      <CustomHeader roleLabel="จัดการพนักงาน" onLogout={() => confirmLogout(navigation, "StaffLogin")} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topRow}>
          <Text style={styles.title}>ทีมงานช่างตัดผม (Barber Team)</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.8}>
            <LinearGradient colors={["#FBBF24", "#F59E0B"]} style={styles.addBtnGrad}>
              <Plus size={16} color="#0F172A" />
              <Text style={styles.addBtnText}>เพิ่มช่างใหม่</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={{ textAlign: "center", marginTop: 20, color: colors.textMuted }}>กำลังโหลดข้อมูล...</Text>
        ) : staff.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={48} color="#475569" style={{ marginBottom: 16 }} />
            <Text style={{ color: colors.textMuted, fontSize: 16 }}>ยังไม่มีพนักงานในระบบ</Text>
          </View>
        ) : (
          <View style={styles.staffGrid}>
            {staff.map((item) => (
              <View key={item.id} style={styles.glassCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarContainer}>
                    <Image 
                      source={{ uri: item.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random` }} 
                      style={{ width: '100%', height: '100%' }} 
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.staffName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.staffPhone}>{item.phone || "ไม่มีเบอร์ติดต่อ"}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconBtn}>
                    <Edit2 size={18} color="#94A3B8" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteStaff(item.id, item.name)} style={[styles.iconBtn, {marginLeft: 8}]}>
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.specialtiesBox}>
                  <Text style={styles.specialtiesText} numberOfLines={2}>
                    Specialties: {item.experience !== "ไม่ระบุ" ? item.experience : "-"}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <User size={16} color="#94A3B8" />
                    <Text style={styles.customerCount}>{item.linkedCustomersCount} Customers</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleEdit(item)}>
                    <Text style={styles.manageLinkText}>Manage Connections</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Advanced Add/Edit Staff Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? "แก้ไขข้อมูลช่าง" : "เพิ่มช่างตัดผมใหม่"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSplit}>
              {/* Left Column */}
              <View style={styles.leftCol}>
                <View style={styles.avatarUploadSection}>
                  <View style={styles.largeAvatarContainer}>
                    {form.avatar ? (
                      <Image source={{ uri: form.avatar }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <User size={40} color="#475569" />
                    )}
                  </View>
                  <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                    <Upload size={16} color="#E2E8F0" />
                    <Text style={styles.uploadBtnText}>อัปโหลดรูปภาพ</Text>
                  </TouchableOpacity>
                </View>

                <CustomInput
                  label="ความเชี่ยวชาญ / สไตล์ทรงผม"
                  placeholder="เช่น [Modern Cut], [Crop Top]"
                  value={form.specialty}
                  onChangeText={(text) => setForm({ ...form, specialty: text })}
                />
              </View>

              {/* Right Column */}
              <View style={styles.rightCol}>
                <View style={styles.rowInputs}>
                  <View style={{flex: 1, marginRight: 8}}>
                    <CustomInput
                      label="ชื่อ-นามสกุลช่าง"
                      placeholder="เช่น กาย ธันวา"
                      value={form.name}
                      onChangeText={(text) => setForm({ ...form, name: text })}
                    />
                  </View>
                  <View style={{flex: 1, marginLeft: 8}}>
                    <CustomInput
                      label="เบอร์โทรศัพท์"
                      placeholder="+66 8X-XXX-XXXX"
                      value={form.phone}
                      onChangeText={(text) => setForm({ ...form, phone: text })}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                {!editingId && (
                  <CustomInput
                    label="อีเมล (สำหรับช่างเข้าสู่ระบบ)"
                    placeholder="guy@barber.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={form.email}
                    onChangeText={(text) => setForm({ ...form, email: text })}
                  />
                )}

                {editingId && (
                  <View style={styles.connectionManager}>
                    <Text style={styles.label}>ลิ้งกับข้อมูลลูกค้า</Text>
                    <View style={styles.searchBar}>
                      <Search size={18} color="#94A3B8" />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="ค้นหาและเลือกลูกค้า..."
                        placeholderTextColor="#64748B"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                    </View>

                    {/* Search Results Chips */}
                    {searchResults.length > 0 && (
                      <View style={styles.chipsContainer}>
                        {searchResults.map(res => (
                          <TouchableOpacity key={res.id} style={styles.chip} onPress={() => handleLink(res.id)}>
                            <Image 
                              source={{ uri: res.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(res.name)}&background=random` }} 
                              style={styles.chipAvatar} 
                            />
                            <Text style={styles.chipText}>{res.name}</Text>
                            <View style={styles.chipAddIcon}><Plus size={12} color="#FFFFFF" /></View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <Text style={[styles.label, {marginTop: 16, marginBottom: 8}]}>ลูกค้าที่เชื่อมต่อ ({linkedCustomers.length})</Text>
                    <ScrollView style={styles.linkedList}>
                      {linkedCustomers.length === 0 ? (
                        <Text style={{color: "#64748B", fontSize: 13}}>ยังไม่มีลูกค้าที่เชื่อมต่อ</Text>
                      ) : (
                        linkedCustomers.map(lc => (
                          <View key={lc.id} style={styles.linkedRow}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                              <Image 
                                source={{ uri: lc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(lc.name)}&background=random` }} 
                                style={styles.chipAvatar} 
                              />
                              <Text style={styles.linkedName}>ลูกค้า: {lc.name}</Text>
                            </View>
                            <TouchableOpacity style={styles.unlinkBtn} onPress={() => handleUnlink(lc.id)}>
                              <Text style={styles.unlinkText}>ลบการเชื่อมต่อ</Text>
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
                
                <View style={{flex: 1}} /> {/* Spacer */}
                
                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSaveStaff} disabled={saving} activeOpacity={0.8}>
                  <LinearGradient colors={["#FBBF24", "#F59E0B"]} style={styles.saveBtnGrad}>
                    {saving ? <ActivityIndicator size="small" color="#0F172A" /> : <Text style={styles.saveBtnText}>{editingId ? "บันทึกการแก้ไข" : "เพิ่มช่าง"}</Text>}
                  </LinearGradient>
                </TouchableOpacity>

              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%", height: "100%" },
  overlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(10, 15, 30, 0.85)" },
  scrollContent: { padding: 16 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF", textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 },
  addBtn: { borderRadius: 12, overflow: "hidden" },
  addBtnGrad: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  addBtnText: { color: "#0F172A", fontWeight: "bold", fontSize: 14 },
  
  staffGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  glassCard: { 
    backgroundColor: "rgba(30, 41, 59, 0.6)", 
    borderRadius: 16, padding: 16, marginBottom: 16, 
    borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)",
    width: "48%" // For grid layout, assuming tablet/web or large screen. Can use 100% for small mobile
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', borderWidth: 2, borderColor: colors.primary },
  staffName: { fontSize: 16, fontWeight: "bold", color: "#FFFFFF" },
  staffPhone: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  iconBtn: { padding: 6 },
  specialtiesBox: { backgroundColor: "rgba(0,0,0,0.2)", padding: 10, borderRadius: 8, marginBottom: 16 },
  specialtiesText: { color: "#CBD5E1", fontSize: 12, lineHeight: 18 },
  cardFooter: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerCount: { color: "#94A3B8", fontSize: 13, marginLeft: 6, fontWeight: "500" },
  manageLinkText: { color: "#3B82F6", fontSize: 12, fontWeight: "bold" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContentLarge: { backgroundColor: "#1E293B", borderRadius: 24, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.1)", padding: 24, width: '100%', maxWidth: 800, maxHeight: '90%' },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF" },
  closeBtn: { padding: 4, backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: 12 },
  
  modalSplit: { flexDirection: 'row', gap: 24 },
  leftCol: { flex: 1, maxWidth: 250 },
  rightCol: { flex: 2 },
  
  avatarUploadSection: { alignItems: 'center', marginBottom: 24 },
  largeAvatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12 },
  uploadBtnText: { color: "#E2E8F0", fontSize: 13 },
  
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
  
  // Connection Manager
  connectionManager: { marginTop: 8, flex: 1 },
  label: { fontSize: 14, color: "#E2E8F0", marginBottom: 8, fontWeight: "500" },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  searchInput: { flex: 1, color: "#FFFFFF", marginLeft: 8, fontSize: 14 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, paddingRight: 10, paddingVertical: 4 },
  chipAvatar: { width: 24, height: 24, borderRadius: 12, marginLeft: 4, marginRight: 6 },
  chipText: { color: "#E2E8F0", fontSize: 12, marginRight: 6 },
  chipAddIcon: { backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 2 },
  
  linkedList: { maxHeight: 150 },
  linkedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 12, padding: 8, marginBottom: 8 },
  linkedName: { color: "#E2E8F0", fontSize: 13, fontWeight: "500" },
  unlinkBtn: { backgroundColor: "rgba(255,255,255,0.05)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  unlinkText: { color: "#94A3B8", fontSize: 12 },
  
  saveBtn: { width: "100%", borderRadius: 12, overflow: "hidden", marginTop: 24 },
  saveBtnGrad: { paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: "#0F172A", fontSize: 16, fontWeight: "bold" },
});

