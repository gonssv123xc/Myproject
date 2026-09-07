import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import { colors } from "../../theme/colors";
import { CustomInput } from "../../components/CustomInput";
import { CustomButton } from "../../components/CustomButton";
import { StaticBackground } from "../../components/StaticBackground";
import { registerCustomer, signInWithOAuth } from "../../services/authService";
import { FontAwesome5 } from "@expo/vector-icons";

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Register">;
};

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    if (!form.name || !form.phone || !form.email || !form.password) {
      Alert.alert("ข้อมูลไม่ครบถ้วน", "กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    if (form.password.length < 6) {
      Alert.alert("รหัสผ่านไม่ปลอดภัย", "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert("รหัสผ่านไม่ตรงกัน", "กรุณายืนยันรหัสผ่านอีกครั้ง");
      return;
    }

    setLoading(true);
    const result = await registerCustomer({
      name: form.name,
      phone: form.phone,
      email: form.email,
      password: form.password,
    });
    setLoading(false);

    if (result.success) {
      Alert.alert("สมัครสมาชิกสำเร็จ", "ระบบกำลังนำคุณเข้าสู่หน้าหลัก");
      navigation.replace("CustomerMain");
    } else {
      Alert.alert("เกิดข้อผิดพลาด", result.error || "ไม่สามารถสมัครสมาชิกได้");
    }
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    const result = await signInWithOAuth(provider);
    setLoading(false);
    
    if (result.success && Platform.OS !== 'web') {
      navigation.replace("CustomerMain");
    } else if (!result.success) {
      if (result.error !== "ยกเลิกการเข้าสู่ระบบ") {
        Alert.alert("เข้าสู่ระบบไม่สำเร็จ", result.error || "เกิดข้อผิดพลาด");
      }
    }
  };

  return (
    <StaticBackground source={require("../../../assets/barer.jpg")}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.brandSection}>
            <View style={styles.logoBadge}>
              <Image 
                source={require("../../../assets/sawasdee_logo.jpg")} 
                style={{ width: 96, height: 96, borderRadius: 24 }} 
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>Sawasdee club</Text>
            <Text style={styles.subtitle}>สร้างบัญชีเพื่อจองคิวตัดผม</Text>
          </View>

          <View style={styles.card}>
            <CustomInput
              label="ชื่อ-นามสกุล"
              placeholder="สมชาย ใจดี"
              value={form.name}
              onChangeText={(text) => updateForm("name", text)}
            />

            <CustomInput
              label="เบอร์โทรศัพท์"
              placeholder="08X-XXX-XXXX"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(text) => updateForm("phone", text)}
            />

            <CustomInput
              label="อีเมล"
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(text) => updateForm("email", text)}
            />

            <CustomInput
              label="รหัสผ่าน"
              placeholder="••••••••"
              isPassword
              value={form.password}
              onChangeText={(text) => updateForm("password", text)}
            />

            <CustomInput
              label="ยืนยันรหัสผ่าน"
              placeholder="••••••••"
              isPassword
              value={form.confirmPassword}
              onChangeText={(text) => updateForm("confirmPassword", text)}
            />

            <CustomButton
              title="สมัครสมาชิก"
              onPress={handleRegister}
              loading={loading}
              style={styles.registerBtn}
            />

            <View style={styles.oauthDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>หรือสมัครสมาชิกด้วย</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.oauthRow}>
              <TouchableOpacity
                style={styles.oauthBtn}
                onPress={() => handleOAuth("google")}
                disabled={loading}
              >
                <FontAwesome5 name="google" size={18} color={colors.text} style={{ marginRight: 8 }} />
                <Text style={styles.oauthBtnText}>Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.oauthBtn, styles.facebookBtn]}
                onPress={() => handleOAuth("facebook")}
                disabled={loading}
              >
                <FontAwesome5 name="facebook-f" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.oauthBtnText}>Facebook</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerLinks}>
              <Text style={styles.mutedText}>มีบัญชีแล้ว? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.primaryLink}>เข้าสู่ระบบ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </StaticBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoBadge: {
    width: 100,
    height: 100,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  registerBtn: {
    marginTop: 8,
  },
  oauthDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  dividerText: {
    color: colors.textMuted,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  oauthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  oauthBtn: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  facebookBtn: {
    marginRight: 0,
    marginLeft: 8,
    backgroundColor: 'rgba(24, 119, 242, 0.1)',
    borderColor: 'rgba(24, 119, 242, 0.3)',
  },
  oauthBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  mutedText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  primaryLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "bold",
  },
});
