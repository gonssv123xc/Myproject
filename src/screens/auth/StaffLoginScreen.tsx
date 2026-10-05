import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import { colors } from "../../theme/colors";
import { CustomInput } from "../../components/CustomInput";
import { CustomButton } from "../../components/CustomButton";
import { StaticBackground } from "../../components/StaticBackground";
import { Store, ChevronRight } from "lucide-react-native";

import { loginUser } from "../../services/authService";
import { getShopInfo, ShopInfo, subscribeToShopUpdates } from "../../services/shopService";

type StaffLoginProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "StaffLogin">;
};

export const StaffLoginScreen: React.FC<StaffLoginProps> = ({ navigation }) => {
  const [role, setRole] = useState<"barber" | "owner">("barber");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);

  useEffect(() => {
    getShopInfo().then(setShopInfo);
    const unsubscribe = subscribeToShopUpdates(setShopInfo);
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("กรุณากรอกข้อมูล", "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setLoading(true);
    const result = await loginUser(email, password);
    setLoading(false);

    if (result.success && result.profile) {
      if (role === "barber") {
        navigation.replace("BarberMain");
      } else {
        navigation.replace("OwnerMain");
      }
    } else {
      Alert.alert("เข้าสู่ระบบไม่สำเร็จ", result.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <StaticBackground
      source={
        shopInfo?.coverUrl
          ? { uri: shopInfo.coverUrl }
          : require("../../../assets/barer.jpg")
      }
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.brandSection}>
            <View style={styles.logoBadge}>
              <Image 
                source={require("../../../assets/app_logo.jpg")} 
                style={{ width: 96, height: 96, borderRadius: 24 }} 
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>จองคิวร้านตัดผม (ทีมงาน)</Text>
            <Text style={styles.subtitle}>ระบบจัดการสำหรับช่างและเจ้าของร้าน</Text>
          </View>

          <View style={styles.card}>
            {/* Tab Selector */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, role === "barber" && styles.activeTab]}
                onPress={() => setRole("barber")}
              >
                <Text style={[styles.tabText, role === "barber" && styles.activeTabText]}>
                  ช่างตัดผม
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, role === "owner" && styles.activeTab]}
                onPress={() => setRole("owner")}
              >
                <Text style={[styles.tabText, role === "owner" && styles.activeTabText]}>
                  เจ้าของร้าน
                </Text>
              </TouchableOpacity>
            </View>

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
              style={styles.submitBtn}
            />

            {/* Owner Register CTA */}
            {role === "owner" && (
              <View style={styles.ownerRegisterBox}>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>หรือ</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.registerOwnerBtn}
                  onPress={() => navigation.navigate("OwnerRegister")}
                  activeOpacity={0.85}
                >
                  <View style={styles.registerOwnerIconBox}>
                    <Store size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.registerOwnerTitle}>เปิดร้านใหม่? ลงทะเบียนร้านตัดผม</Text>
                    <Text style={styles.registerOwnerSub}>กรอกพิกัด รายละเอียดร้าน และเปิดรับจอง</Text>
                  </View>
                  <ChevronRight size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                  });
                }
              }}
            >
              <Text style={styles.backText}>← กลับหน้าเข้าสู่ระบบลูกค้า</Text>
            </TouchableOpacity>
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
    fontSize: 26,
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.cardBorder,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  activeTabText: {
    color: "#0F172A",
    fontWeight: "bold",
  },
  submitBtn: {
    marginTop: 8,
  },
  ownerRegisterBox: {
    marginTop: 16,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  dividerText: {
    fontSize: 12,
    color: "#94A3B8",
    marginHorizontal: 10,
    fontWeight: "500",
  },
  registerOwnerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
    borderRadius: 14,
    padding: 12,
  },
  registerOwnerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(245, 158, 11, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  registerOwnerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 2,
  },
  registerOwnerSub: {
    fontSize: 11,
    color: "#94A3B8",
  },
  backBtn: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 13,
    color: colors.primary,
  },
});
