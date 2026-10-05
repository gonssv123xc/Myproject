import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import {
  X,
  Store,
  Camera,
  Upload,
  Check,
  Phone,
  MapPin,
  CreditCard,
  Sparkles,
  Clock,
  Globe,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";
import {
  ShopInfo,
  getShopInfo,
  updateShopInfo,
  uploadShopImage,
} from "../services/shopService";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved?: (updated: ShopInfo) => void;
}

export const ShopSettingsModal: React.FC<Props> = ({
  visible,
  onClose,
  onSaved,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Form states
  const [shopId, setShopId] = useState("default_shop");
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [openHours, setOpenHours] = useState("");
  const [promptpayNumber, setPromptpayNumber] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadShopData();
    }
  }, [visible]);

  const loadShopData = async () => {
    setLoading(true);
    const shop = await getShopInfo();
    setShopId(shop.id || "default_shop");
    setName(shop.name || "ร้านตัดผม");
    setSubtitle(shop.subtitle || "");
    setPhone(shop.phone || "");
    setAddress(shop.address || "");
    setOpenHours(shop.openHours || "09:00 – 19:00");
    setPromptpayNumber(shop.promptpayNumber || "");
    setTelegramChatId(shop.telegramChatId || "");
    setLogoUrl(shop.logoUrl || null);
    setCoverUrl(shop.coverUrl || null);
    setLoading(false);
  };

  const handlePickImage = async (type: "logo" | "cover") => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("จำเป็นต้องขอสิทธิ์", "กรุณาอนุญาตให้เข้าถึงรูปภาพในเครื่องเพื่ออัปโหลด");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === "logo" ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        if (type === "logo") {
          setUploadingLogo(true);
          const uploadedUrl = await uploadShopImage(uri, "logo");
          if (uploadedUrl) {
            setLogoUrl(uploadedUrl);
          } else {
            Alert.alert("ข้อผิดพลาด", "ไม่สามารถอัปโหลดรูปโลโก้ได้ กรุณาลองใหม่");
          }
          setUploadingLogo(false);
        } else {
          setUploadingCover(true);
          const uploadedUrl = await uploadShopImage(uri, "cover");
          if (uploadedUrl) {
            setCoverUrl(uploadedUrl);
          } else {
            Alert.alert("ข้อผิดพลาด", "ไม่สามารถอัปโหลดรูปภาพปกได้ กรุณาลองใหม่");
          }
          setUploadingCover(false);
        }
      }
    } catch (err) {
      console.error("Pick image error:", err);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเลือกรูปภาพได้");
      setUploadingLogo(false);
      setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("ข้อมูลไม่ครบถ้วน", "กรุณากรอกชื่อร้านค้า");
      return;
    }

    setSaving(true);
    const result = await updateShopInfo(shopId, {
      name: name.trim(),
      subtitle: subtitle.trim(),
      phone: phone.trim(),
      address: address.trim(),
      openHours: openHours.trim(),
      promptpayNumber: promptpayNumber.trim(),
      telegramChatId: telegramChatId.trim(),
      logoUrl,
      coverUrl,
    });

    setSaving(false);

    if (result.success && result.data) {
      Alert.alert("สำเร็จ", "บันทึกข้อมูลและรูปภาพร้านค้าเรียบร้อยแล้ว", [
        {
          text: "ตกลง",
          onPress: () => {
            if (onSaved && result.data) onSaved(result.data);
            onClose();
          },
        },
      ]);
    } else {
      Alert.alert("เกิดข้อผิดพลาด", result.error || "ไม่สามารถบันทึกข้อมูลร้านได้");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <LinearGradient
            colors={["#1E293B", "#0F172A"]}
            style={styles.header}
          >
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Store size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>จัดการข้อมูล & รูปภาพร้าน</Text>
                <Text style={styles.headerSub}>แก้ไขชื่อร้าน โลโก้ รูปภาพปก และข้อมูลติดต่อ</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>กำลังโหลดข้อมูลร้าน...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollBody}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Cover Banner Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionLabel}>รูปภาพหน้าปก / แบนเนอร์ร้าน (16:9)</Text>
                <TouchableOpacity
                  style={styles.coverPreviewContainer}
                  activeOpacity={0.8}
                  onPress={() => handlePickImage("cover")}
                  disabled={uploadingCover}
                >
                  {coverUrl ? (
                    <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
                  ) : (
                    <Image
                      source={require("../../assets/13.jpg")}
                      style={styles.coverImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.coverOverlay}>
                    {uploadingCover ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={styles.uploadBadge}>
                        <Camera size={14} color="#FFFFFF" />
                        <Text style={styles.uploadBadgeText}>เปลี่ยนภาพปก</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Logo Section */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionLabel}>รูปโลโก้ร้านค้า (จัตุรัส 1:1)</Text>
                <View style={styles.logoRow}>
                  <TouchableOpacity
                    style={styles.logoContainer}
                    activeOpacity={0.8}
                    onPress={() => handlePickImage("logo")}
                    disabled={uploadingLogo}
                  >
                    {logoUrl ? (
                      <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="cover" />
                    ) : (
                      <Image
                        source={require("../../assets/sawasdee_logo.jpg")}
                        style={styles.logoImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.logoBadge}>
                      {uploadingLogo ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Camera size={12} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>

                  <View style={styles.logoInfo}>
                    <Text style={styles.logoInfoTitle}>โลโก้หน้าร้าน</Text>
                    <Text style={styles.logoInfoDesc}>
                      แนะนำภาพขนาดสัดส่วน 1:1 รูปทรงกลมหรือจัตุรัส จะแสดงที่ส่วนหัวของแอปและใบเสร็จ
                    </Text>
                    <TouchableOpacity
                      style={styles.changeLogoBtn}
                      onPress={() => handlePickImage("logo")}
                      disabled={uploadingLogo}
                    >
                      <Upload size={14} color={colors.primary} />
                      <Text style={styles.changeLogoBtnText}>
                        {uploadingLogo ? "กำลังอัปโหลด..." : "อัปโหลดโลโก้ใหม่"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Basic Info Fields */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionLabel}>ข้อมูลพื้นฐานร้านค้า</Text>

                {/* Shop Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    ชื่อร้านค้า <Text style={{ color: "#EF4444" }}>*</Text>
                  </Text>
                  <View style={styles.inputWrap}>
                    <Store size={18} color={colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={name}
                      onChangeText={setName}
                      placeholder="เช่น บาร์เบอร์ช็อป"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                {/* Subtitle / Slogan */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>สโลแกน / คำโปรยร้าน</Text>
                  <View style={styles.inputWrap}>
                    <Sparkles size={18} color={colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={subtitle}
                      onChangeText={setSubtitle}
                      placeholder="เช่น ตัดผมชายสไตล์โมเดิร์นและวินเทจ"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                {/* Phone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>เบอร์โทรศัพท์ติดต่อ</Text>
                  <View style={styles.inputWrap}>
                    <Phone size={18} color={colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="เช่น 090-360-3093"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                {/* Open Hours */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>เวลาทำการปกติ</Text>
                  <View style={styles.inputWrap}>
                    <Clock size={18} color={colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={openHours}
                      onChangeText={setOpenHours}
                      placeholder="เช่น 09:00 – 19:00"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                {/* PromptPay */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>เบอร์พร้อมเพย์รับเงินมัดจำ (PromptPay)</Text>
                  <View style={styles.inputWrap}>
                    <CreditCard size={18} color={colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={promptpayNumber}
                      onChangeText={setPromptpayNumber}
                      placeholder="เช่น เบอร์โทรศัพท์ หรือ เลขประจำตัวประชาชน"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                {/* Telegram Group Chat ID */}
                <View style={styles.inputGroup}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.inputLabel}>Telegram Group Chat ID (แจ้งเตือนคิว)</Text>
                    <Text style={{ fontSize: 11, color: colors.primary }}>ค่าเริ่มต้น: -5464640980</Text>
                  </View>
                  <View style={styles.inputWrap}>
                    <Globe size={18} color={colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      value={telegramChatId}
                      onChangeText={setTelegramChatId}
                      placeholder="เช่น -5464640980"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                    />
                  </View>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4, marginLeft: 2 }}>
                    บอตจะส่งแจ้งเตือนคิวใหม่ไปยังกลุ่มที่มี Chat ID นี้
                  </Text>
                </View>

                {/* Address */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ที่อยู่ของร้าน</Text>
                  <View style={[styles.inputWrap, { height: 80, alignItems: "flex-start", paddingTop: 10 }]}>
                    <MapPin size={18} color={colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, { height: 60 }]}
                      value={address}
                      onChangeText={setAddress}
                      placeholder="ระบุที่อยู่ ตำบล อำเภอ จังหวัด..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelBtnText}>ยกเลิก</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#FBBF24", "#F59E0B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtnGrad}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <>
                    <Check size={18} color="#0F172A" />
                    <Text style={styles.saveBtnText}>บันทึกข้อมูล</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    minHeight: "75%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    padding: 50,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  coverPreviewContainer: {
    width: "100%",
    height: 140,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  uploadBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: "relative",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  logoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
  },
  logoBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0F172A",
  },
  logoInfo: {
    flex: 1,
    gap: 4,
  },
  logoInfoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  logoInfoDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  changeLogoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  changeLogoBtnText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#1E293B",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cancelBtnText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
  },
  saveBtnGrad: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },
});
