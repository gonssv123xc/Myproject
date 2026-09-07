import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import { colors } from "../../theme/colors";
import { CustomInput } from "../../components/CustomInput";
import { CustomButton } from "../../components/CustomButton";
import { StaticBackground } from "../../components/StaticBackground";
import { FontAwesome5 } from "@expo/vector-icons";
import { loginUser, signInWithOAuth } from "../../services/authService";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("กรุณากรอกข้อมูล", "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setLoading(true);
    const result = await loginUser(email, password);
    setLoading(false);

    if (result.success && result.profile) {
      const userRole = result.profile.role;
      if (userRole === "BARBER") {
        navigation.replace("BarberMain");
      } else if (userRole === "OWNER") {
        navigation.replace("OwnerMain");
      } else {
        navigation.replace("CustomerMain");
      }
    } else {
      Alert.alert("เข้าสู่ระบบไม่สำเร็จ", result.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
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
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header Branding */}
          <View style={styles.brandSection}>
            <View style={styles.logoBadge}>
              <Image 
                source={require("../../../assets/sawasdee_logo.jpg")} 
                style={{ width: 96, height: 96, borderRadius: 24 }} 
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>Sawasdee club</Text>
            <Text style={styles.subtitle}>ระบบจองคิวร้านสวัสดีคลับ</Text>
          </View>

          {/* Card Form */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>เข้าสู่ระบบ (ลูกค้า)</Text>

            <CustomInput
              label="อีเมล"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <CustomInput
              label="รหัสผ่าน"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              isPassword
            />

            <CustomButton
              title="เข้าสู่ระบบ"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginBtn}
            />

            <View style={styles.oauthDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>หรือเข้าสู่ระบบด้วย</Text>
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
              <View style={styles.registerRow}>
                <Text style={styles.mutedText}>ยังไม่มีบัญชี? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                  <Text style={styles.primaryLink}>สมัครสมาชิก</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Separated Staff Login Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("StaffLogin")}
            style={styles.staffPill}
          >
            <Text style={styles.staffPillText}>ช่างตัดผม | เจ้าของร้าน</Text>
          </TouchableOpacity>
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
    borderColor: "rgba(212, 175, 55, 0.3)", // Subtle gold border
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: "center",
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
  cardHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: 24,
  },
  loginBtn: {
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
    marginTop: 20,
    alignItems: "center",
  },
  registerRow: {
    flexDirection: "row",
    alignItems: "center",
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
  staffPill: {
    marginTop: 32,
    alignSelf: "center",
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.5)",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  staffPillText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
