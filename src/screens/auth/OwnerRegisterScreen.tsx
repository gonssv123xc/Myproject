import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import { LinearGradient } from "expo-linear-gradient";
import {
  Store,
  MapPin,
  Clock,
  Phone,
  CreditCard,
  User,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Share2,
  Building2,
  ShieldCheck,
  Check,
} from "lucide-react-native";
import { colors } from "../../theme/colors";
import { CustomInput } from "../../components/CustomInput";
import { StaticBackground } from "../../components/StaticBackground";
import { registerOwnerWithShop, OwnerRegistrationData } from "../../services/authService";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "OwnerRegister">;
};

type Step = 1 | 2 | 3;

export const OwnerRegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    // Step 1: Owner info
    ownerName: "",
    ownerPhone: "",
    email: "",
    password: "",
    confirmPassword: "",

    // Step 2: Shop details & Location
    shopName: "",
    shopSubtitle: "",
    shopAddress: "",
    shopOpenHours: "09:00 – 19:00",
    shopPhone: "",

    // Step 3: Payment & Socials
    shopPromptPay: "",
    shopLine: "",
    shopFacebook: "",
    shopInstagram: "",
    shopTiktok: "",
  });

  const updateField = (key: keyof typeof form, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  // Step Validations
  const validateStep1 = (): boolean => {
    if (!form.ownerName.trim()) {
      Alert.alert("กรุณาระบุข้อมูล", "กรุณากรอกชื่อ-นามสกุล เจ้าของร้าน");
      return false;
    }
    if (!form.ownerPhone.trim()) {
      Alert.alert("กรุณาระบุข้อมูล", "กรุณากรอกเบอร์โทรศัพท์เจ้าของร้าน");
      return false;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      Alert.alert("อีเมลไม่ถูกต้อง", "กรุณากรอกอีเมลที่ถูกต้องสำหรับใช้เข้าสู่ระบบ");
      return false;
    }
    if (form.password.length < 6) {
      Alert.alert("รหัสผ่านไม่ปลอดภัย", "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert("รหัสผ่านไม่ตรงกัน", "กรุณายืนยันรหัสผ่านให้ตรงกัน");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!form.shopName.trim()) {
      Alert.alert("กรุณาระบุข้อมูล", "กรุณากรอกชื่อร้านตัดผมของคุณ");
      return false;
    }
    if (!form.shopAddress.trim()) {
      Alert.alert("กรุณาระบุข้อมูล", "กรุณาระบุที่ตั้ง / พิกัดร้านตัดผมอย่างละเอียดเพื่อให้ลูกค้าค้นหาเจอ");
      return false;
    }
    if (!form.shopOpenHours.trim()) {
      Alert.alert("กรุณาระบุข้อมูล", "กรุณาระบุเวลาเปิด-ปิดทำการของร้าน");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) setCurrentStep(1);
    else if (currentStep === 3) setCurrentStep(2);
  };

  const handleRegisterSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      return;
    }

    setLoading(true);

    const payload: OwnerRegistrationData = {
      name: form.ownerName.trim(),
      phone: form.ownerPhone.trim(),
      email: form.email.trim(),
      password: form.password,
      shopName: form.shopName.trim(),
      shopSubtitle: form.shopSubtitle.trim() || "ระบบจองคิวออนไลน์",
      shopAddress: form.shopAddress.trim(),
      shopOpenHours: form.shopOpenHours.trim() || "09:00 – 19:00",
      shopPhone: form.shopPhone.trim() || form.ownerPhone.trim(),
      shopPromptPay: form.shopPromptPay.trim(),
      shopFacebook: form.shopFacebook.trim(),
      shopInstagram: form.shopInstagram.trim(),
      shopLine: form.shopLine.trim(),
      shopTiktok: form.shopTiktok.trim(),
    };

    const result = await registerOwnerWithShop(payload);
    setLoading(false);

    if (result.success) {
      Alert.alert(
        "ลงทะเบียนร้านสำเร็จ!",
        `ยินดีต้อนรับร้าน "${form.shopName}" เข้าสู่ระบบจัดการร้านตัดผม`,
        [
          {
            text: "เข้าสู่แดชบอร์ด",
            onPress: () => navigation.replace("OwnerMain"),
          },
        ]
      );
    } else {
      Alert.alert("เกิดข้อผิดพลาด", result.error || "ไม่สามารถลงทะเบียนร้านได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <StaticBackground source={require("../../../assets/barer.jpg")}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isDesktop && styles.desktopWrapper]}>
          {/* Header Navigation */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => {
                if (currentStep > 1) {
                  handlePrevStep();
                } else {
                  navigation.navigate("StaffLogin");
                }
              }}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <ArrowLeft size={18} color="#94A3B8" />
              <Text style={styles.backButtonText}>
                {currentStep > 1 ? "ย้อนกลับขั้นตอนก่อนหน้า" : "กลับหน้าเข้าสู่ระบบ"}
              </Text>
            </TouchableOpacity>

            <View style={styles.badgePill}>
              <Sparkles size={13} color={colors.primary} />
              <Text style={styles.badgePillText}>สำหรับเจ้าของร้าน</Text>
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.titleIconBadge}>
              <Store size={32} color={colors.primary} />
            </View>
            <Text style={styles.mainTitle}>ลงทะเบียนร้านตัดผมใหม่</Text>
            <Text style={styles.subTitle}>
              สร้างบัญชีและกรอกข้อมูลร้านของคุณเพื่อเริ่มเปิดรับจองคิวออนไลน์ทันที
            </Text>
          </View>

          {/* Step Progress Bar */}
          <View style={styles.stepperContainer}>
            {/* Step 1 */}
            <TouchableOpacity
              style={styles.stepItem}
              onPress={() => setCurrentStep(1)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.stepCircle,
                  currentStep === 1 && styles.stepCircleActive,
                  currentStep > 1 && styles.stepCircleDone,
                ]}
              >
                {currentStep > 1 ? (
                  <Check size={16} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.stepNumber, currentStep === 1 && styles.stepNumberActive]}>
                    1
                  </Text>
                )}
              </View>
              <Text style={[styles.stepLabel, currentStep === 1 && styles.stepLabelActive]}>
                บัญชีเจ้าของ
              </Text>
            </TouchableOpacity>

            <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />

            {/* Step 2 */}
            <TouchableOpacity
              style={styles.stepItem}
              onPress={() => {
                if (validateStep1()) setCurrentStep(2);
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.stepCircle,
                  currentStep === 2 && styles.stepCircleActive,
                  currentStep > 2 && styles.stepCircleDone,
                ]}
              >
                {currentStep > 2 ? (
                  <Check size={16} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.stepNumber, currentStep === 2 && styles.stepNumberActive]}>
                    2
                  </Text>
                )}
              </View>
              <Text style={[styles.stepLabel, currentStep === 2 && styles.stepLabelActive]}>
                ข้อมูลร้าน & พิกัด
              </Text>
            </TouchableOpacity>

            <View style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]} />

            {/* Step 3 */}
            <TouchableOpacity
              style={styles.stepItem}
              onPress={() => {
                if (validateStep1() && validateStep2()) setCurrentStep(3);
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.stepCircle,
                  currentStep === 3 && styles.stepCircleActive,
                ]}
              >
                <Text style={[styles.stepNumber, currentStep === 3 && styles.stepNumberActive]}>
                  3
                </Text>
              </View>
              <Text style={[styles.stepLabel, currentStep === 3 && styles.stepLabelActive]}>
                การเงิน & โซเชียล
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Card Container */}
          <LinearGradient
            colors={["rgba(30, 41, 59, 0.95)", "rgba(15, 23, 42, 0.98)"]}
            style={styles.formCard}
          >
            {/* STEP 1: OWNER ACCOUNT */}
            {currentStep === 1 && (
              <View style={styles.stepContent}>
                <View style={styles.sectionHeader}>
                  <User size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>ข้อมูลบัญชีเจ้าของร้าน</Text>
                </View>
                <Text style={styles.sectionDesc}>
                  ใช้สำหรับเข้าสู่ระบบแดชบอร์ดจัดการร้านของคุณ
                </Text>

                <CustomInput
                  label="ชื่อ - นามสกุล เจ้าของร้าน *"
                  placeholder="เช่น สมชาย ใจบริการ"
                  value={form.ownerName}
                  onChangeText={(val) => updateField("ownerName", val)}
                />

                <CustomInput
                  label="เบอร์โทรศัพท์มือถือ *"
                  placeholder="08X-XXX-XXXX"
                  value={form.ownerPhone}
                  onChangeText={(val) => updateField("ownerPhone", val)}
                  keyboardType="phone-pad"
                />

                <CustomInput
                  label="อีเมลสำหรับเข้าสู่ระบบ *"
                  placeholder="owner@barbershop.com"
                  value={form.email}
                  onChangeText={(val) => updateField("email", val)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <CustomInput
                  label="รหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร) *"
                  placeholder="••••••••"
                  value={form.password}
                  onChangeText={(val) => updateField("password", val)}
                  isPassword
                />

                <CustomInput
                  label="ยืนยันรหัสผ่านอีกครั้ง *"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChangeText={(val) => updateField("confirmPassword", val)}
                  isPassword
                />

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleNextStep}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={[colors.primary, "#D97706"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionBtnGradient}
                  >
                    <Text style={styles.actionBtnText}>ถัดไป: ข้อมูลร้าน & พิกัด</Text>
                    <ArrowRight size={18} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: SHOP DETAILS & LOCATION */}
            {currentStep === 2 && (
              <View style={styles.stepContent}>
                <View style={styles.sectionHeader}>
                  <Building2 size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>ข้อมูลร้านตัดผม & พิกัดที่ตั้ง</Text>
                </View>
                <Text style={styles.sectionDesc}>
                  ข้อมูลนี้จะแสดงในหน้ารายชื่อร้านและหน้าจอเลือกร้านของลูกค้า
                </Text>

                <CustomInput
                  label="ชื่อร้านตัดผม *"
                  placeholder="เช่น Classic Cut Barbershop"
                  value={form.shopName}
                  onChangeText={(val) => updateField("shopName", val)}
                />

                <CustomInput
                  label="คำโปรย / สโลแกนร้าน"
                  placeholder="เช่น ตัดแต่งทรงผมสไตล์วินเทจและโมเดิร์น"
                  value={form.shopSubtitle}
                  onChangeText={(val) => updateField("shopSubtitle", val)}
                />

                <CustomInput
                  label="ที่ตั้งร้าน / พิกัด / จุดสังเกต *"
                  placeholder="เช่น 123/4 ถ.จิระ ต.ในเมือง อ.เมืองบุรีรัมย์ (ตรงข้ามสถานีรถไฟ)"
                  value={form.shopAddress}
                  onChangeText={(val) => updateField("shopAddress", val)}
                  multiline
                  numberOfLines={3}
                />

                <CustomInput
                  label="เวลาทำการเปิด - ปิด *"
                  placeholder="เช่น 09:00 – 20:00 (เปิดทุกวัน)"
                  value={form.shopOpenHours}
                  onChangeText={(val) => updateField("shopOpenHours", val)}
                />

                <CustomInput
                  label="เบอร์โทรศัพท์ประจำร้าน (ถ้ามี)"
                  placeholder="เช่น 044-XXX-XXX หรือเว้นว่างเพื่อใช้เบอร์เจ้าของ"
                  value={form.shopPhone}
                  onChangeText={(val) => updateField("shopPhone", val)}
                  keyboardType="phone-pad"
                />

                <View style={styles.dualButtonRow}>
                  <TouchableOpacity
                    style={styles.prevButton}
                    onPress={handlePrevStep}
                    activeOpacity={0.8}
                  >
                    <ArrowLeft size={16} color="#CBD5E1" />
                    <Text style={styles.prevBtnText}>ย้อนกลับ</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { flex: 1, marginTop: 0 }]}
                    onPress={handleNextStep}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={[colors.primary, "#D97706"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.actionBtnGradient}
                    >
                      <Text style={styles.actionBtnText}>ถัดไป: บัญชีรับเงิน</Text>
                      <ArrowRight size={18} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 3: PAYMENTS & SOCIALS & SUBMISSION */}
            {currentStep === 3 && (
              <View style={styles.stepContent}>
                <View style={styles.sectionHeader}>
                  <CreditCard size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>บัญชีรับเงิน & ช่องทางติดต่อ</Text>
                </View>
                <Text style={styles.sectionDesc}>
                  ใช้สำหรับรับเงินค่ามัดจำ/บริการ และให้ลูกค้ากดติดต่อสอบถาม
                </Text>

                <CustomInput
                  label="หมายเลขพร้อมเพย์ (PromptPay)"
                  placeholder="เช่น เบอร์โทรศัพท์ 10 หลัก หรือเลขบัตรประชาชน"
                  value={form.shopPromptPay}
                  onChangeText={(val) => updateField("shopPromptPay", val)}
                  keyboardType="numeric"
                />

                <CustomInput
                  label="LINE ID หรือ ลิงก์ LINE Official"
                  placeholder="เช่น @classiccut หรือ https://line.me/ti/p/..."
                  value={form.shopLine}
                  onChangeText={(val) => updateField("shopLine", val)}
                  autoCapitalize="none"
                />

                <CustomInput
                  label="Facebook Page (ลิงก์หรือชื่อเพจ)"
                  placeholder="เช่น https://facebook.com/classiccutbarber"
                  value={form.shopFacebook}
                  onChangeText={(val) => updateField("shopFacebook", val)}
                  autoCapitalize="none"
                />

                <CustomInput
                  label="Instagram (ถ้ามี)"
                  placeholder="เช่น https://instagram.com/classiccut"
                  value={form.shopInstagram}
                  onChangeText={(val) => updateField("shopInstagram", val)}
                  autoCapitalize="none"
                />

                <CustomInput
                  label="TikTok (ถ้ามี)"
                  placeholder="เช่น @classiccut"
                  value={form.shopTiktok}
                  onChangeText={(val) => updateField("shopTiktok", val)}
                  autoCapitalize="none"
                />

                {/* Summary Box */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryTitleRow}>
                    <ShieldCheck size={18} color="#10B981" />
                    <Text style={styles.summaryTitle}>สรุปข้อมูลร้านที่จะลงทะเบียน</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>ชื่อร้าน:</Text>
                    <Text style={styles.summaryValue}>{form.shopName || "-"}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>เจ้าของร้าน:</Text>
                    <Text style={styles.summaryValue}>{form.ownerName || "-"}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>พิกัด/ที่ตั้ง:</Text>
                    <Text style={[styles.summaryValue, { flex: 1 }]} numberOfLines={2}>
                      {form.shopAddress || "-"}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>เวลาทำการ:</Text>
                    <Text style={styles.summaryValue}>{form.shopOpenHours || "-"}</Text>
                  </View>
                  {form.shopPromptPay ? (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>พร้อมเพย์:</Text>
                      <Text style={styles.summaryValue}>{form.shopPromptPay}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Submit Buttons */}
                <View style={styles.dualButtonRow}>
                  <TouchableOpacity
                    style={styles.prevButton}
                    onPress={handlePrevStep}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <ArrowLeft size={16} color="#CBD5E1" />
                    <Text style={styles.prevBtnText}>ย้อนกลับ</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { flex: 1, marginTop: 0 }]}
                    onPress={handleRegisterSubmit}
                    disabled={loading}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={["#10B981", "#059669"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.actionBtnGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <CheckCircle2 size={18} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}>สร้างร้าน & เข้าสู่แดชบอร์ด</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </LinearGradient>

          {/* Footer Note */}
          <View style={styles.footerInfoBox}>
            <Text style={styles.footerInfoText}>
              เมื่อลงทะเบียนเสร็จสิ้น คุณสามารถเพิ่มช่างตัดผม, จัดการทรงผม/ราคา, และดูรายงานคิวได้จากแดชบอร์ด
            </Text>
          </View>
        </View>
      </ScrollView>
    </StaticBackground>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingBottom: 48,
    justifyContent: "center",
  },
  mainWrapper: {
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
  },
  desktopWrapper: {
    maxWidth: 580,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  backButtonText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 6,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  badgePillText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 5,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  titleIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(245, 158, 11, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 16,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  stepItem: {
    alignItems: "center",
  },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1E293B",
    borderWidth: 1.5,
    borderColor: "#475569",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  stepCircleDone: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  stepNumber: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "700",
  },
  stepNumberActive: {
    color: "#FFFFFF",
  },
  stepLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },
  stepLabelActive: {
    color: "#E2E8F0",
    fontWeight: "700",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#334155",
    marginHorizontal: 10,
    marginBottom: 20,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  formCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  stepContent: {
    width: "100%",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  sectionDesc: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 20,
  },
  dualButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },
  prevButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(51, 65, 85, 0.8)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  prevBtnText: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  actionButton: {
    marginTop: 16,
    borderRadius: 14,
    overflow: "hidden",
  },
  actionBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    marginTop: 8,
    marginBottom: 8,
  },
  summaryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    paddingBottom: 8,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#10B981",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    gap: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#94A3B8",
    width: 80,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 12,
    color: "#E2E8F0",
    fontWeight: "600",
    flex: 1,
  },
  footerInfoBox: {
    marginTop: 20,
    alignItems: "center",
  },
  footerInfoText: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
});
