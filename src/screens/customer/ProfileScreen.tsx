import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Camera, Save, Award, User, Store } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../theme/colors";
import { CustomHeader } from "../../components/CustomHeader";
import { getCurrentProfile, updateUserProfile, uploadAvatar, UserProfile } from "../../services/authService";

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const data = await getCurrentProfile();
    if (data) {
      setProfile(data);
      setFirstName(data.firstName);
      setLastName(data.lastName || "");
      setPhone(data.phone || "");
    }
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0] && profile) {
      setLoading(true);
      try {
        const uploadRes = await uploadAvatar(profile.id, result.assets[0].uri);
        if (uploadRes.success && uploadRes.avatarUrl) {
          setProfile({ ...profile, avatar: uploadRes.avatarUrl });
          if (Platform.OS === 'web') {
            window.alert("อัปโหลดรูปโปรไฟล์สำเร็จ");
          } else {
            Alert.alert("สำเร็จ", "อัปโหลดรูปโปรไฟล์สำเร็จ");
          }
        } else {
          throw new Error(uploadRes.error);
        }
      } catch (err: any) {
        if (Platform.OS === 'web') {
          window.alert("ไม่สามารถอัปโหลดรูปได้: " + err.message);
        } else {
          Alert.alert("ข้อผิดพลาด", "ไม่สามารถอัปโหลดรูปได้: " + err.message);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);
    
    const res = await updateUserProfile(profile.id, {
      firstName,
      lastName,
      phone,
    });

    if (res.success) {
      if (Platform.OS === 'web') {
        window.alert("บันทึกข้อมูลเรียบร้อย");
      } else {
        Alert.alert("สำเร็จ", "บันทึกข้อมูลเรียบร้อย");
      }
      loadProfile();
    } else {
      if (Platform.OS === 'web') {
        window.alert("บันทึกข้อมูลไม่สำเร็จ: " + res.error);
      } else {
        Alert.alert("ข้อผิดพลาด", "บันทึกข้อมูลไม่สำเร็จ: " + res.error);
      }
    }
    setLoading(false);
  };

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
        navigation.navigate("Login");
      }
    } else {
      Alert.alert("ออกจากระบบ", "คุณต้องการออกจากระบบใช่หรือไม่?", [
        { text: "ยกเลิก", style: "cancel" },
        { text: "ออกจากระบบ", style: "destructive", onPress: () => navigation.navigate("Login") },
      ]);
    }
  };

  return (
    <ImageBackground 
      source={require("../../../assets/13.jpg")} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <CustomHeader title="โปรไฟล์ของฉัน" roleLabel={profile ? `${profile.firstName} ${profile.lastName || ""}`.trim() : "ลูกค้า"} onLogout={confirmLogout} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {profile?.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <User size={48} color="#94A3B8" />
                </View>
              )}
              <TouchableOpacity style={styles.editAvatarBtn} onPress={pickImage} disabled={loading}>
                <Camera size={16} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileEmail}>{profile?.email || "กำลังโหลด..."}</Text>
          </View>

          {/* Points Card */}
          <View style={styles.pointsCard}>
            <View style={styles.pointsLeft}>
              <Award size={32} color="#F59E0B" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.pointsTitle}>คะแนนสะสมของคุณ</Text>
                <Text style={styles.pointsSub}>นำมาแลกส่วนลดตัดผมฟรีได้!</Text>
              </View>
            </View>
            <View style={styles.pointsRight}>
              <Text style={styles.pointsValue}>{profile?.points || 0}</Text>
              <Text style={styles.pointsLabel}>แต้ม</Text>
              
              <TouchableOpacity 
                style={styles.shopBtn}
                onPress={() => navigation.navigate("RewardShop")}
              >
                <Store size={14} color="#0F172A" />
                <Text style={styles.shopBtnText}>ร้านค้าแลกรางวัล</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Edit Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>ข้อมูลส่วนตัว</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ชื่อ</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="ชื่อของคุณ"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>นามสกุล</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="นามสกุลของคุณ"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>เบอร์โทรศัพท์</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="เบอร์โทรศัพท์"
                keyboardType="phone-pad"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]} 
              onPress={handleSave}
              disabled={loading}
            >
              <Save size={20} color="#0F172A" />
              <Text style={styles.saveBtnText}>{loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
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
    position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100, // Space for Bottom Tab Bar
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(255,255,255,0.2)",
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#1E293B",
  },
  profileEmail: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: "500",
  },
  pointsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(245, 158, 11, 0.15)", // amber with opacity
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(8px)' } : {}) as any,
  },
  pointsLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FBBF24",
  },
  pointsSub: {
    fontSize: 13,
    color: "#FDE68A",
    marginTop: 4,
  },
  pointsRight: {
    alignItems: "center",
  },
  pointsValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FBBF24",
  },
  pointsLabel: {
    fontSize: 12,
    color: "#FDE68A",
    fontWeight: "bold",
  },
  shopBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  shopBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0F172A",
  },
  formCard: {
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {}) as any,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 16,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as any,
  },
  saveBtn: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F172A",
  },
});
