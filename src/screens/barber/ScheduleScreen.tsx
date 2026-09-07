import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { CustomHeader } from "../../components/CustomHeader";
import { confirmLogout } from "../../utils/logout";
import { getBarberSchedule, updateBarberSchedule, BarberScheduleDay } from "../../services/barberService";
import { getCurrentProfile } from "../../services/authService";
import { supabase } from "../../services/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { Clock, Save } from "lucide-react-native";

const defaultDays = [
  { dayOfWeek: 1, label: "จันทร์", active: true, start: "09:00", end: "19:00" },
  { dayOfWeek: 2, label: "อังคาร", active: true, start: "09:00", end: "19:00" },
  { dayOfWeek: 3, label: "พุธ", active: true, start: "09:00", end: "19:00" },
  { dayOfWeek: 4, label: "พฤหัสบดี", active: true, start: "09:00", end: "19:00" },
  { dayOfWeek: 5, label: "ศุกร์", active: true, start: "09:00", end: "19:00" },
  { dayOfWeek: 6, label: "เสาร์", active: true, start: "09:00", end: "19:00" },
  { dayOfWeek: 0, label: "อาทิตย์", active: false, start: "09:00", end: "19:00" },
];

export const ScheduleScreen: React.FC = () => {
  const navigation = useNavigation();
  const [schedule, setSchedule] = useState(defaultDays);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const loadSchedule = async () => {
        setLoading(true);
        const profile = await getCurrentProfile();
        if (profile) {
          const { data: barberRow } = await supabase
            .from("Barber")
            .select("id")
            .eq("userId", profile.id)
            .single();

          if (barberRow) {
            setBarberId(barberRow.id);
            const data = await getBarberSchedule(barberRow.id);
            if (data && data.length > 0) {
              const merged = defaultDays.map(def => {
                const found = data.find(d => d.dayOfWeek === def.dayOfWeek);
                if (found) {
                  return {
                    ...def,
                    id: found.id,
                    active: !found.isOff,
                    start: found.startTime,
                    end: found.endTime,
                  };
                }
                return def;
              });
              setSchedule(merged as any);
            }
          }
        }
        setLoading(false);
      };
      loadSchedule();
    }, [])
  );

  const toggleDay = (index: number) => {
    setSchedule((prev) =>
      prev.map((s, i) => (i === index ? { ...s, active: !s.active } : s))
    );
  };

  const updateTime = (index: number, field: "start" | "end", value: string) => {
    setSchedule((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = async () => {
    if (!barberId) return;
    setIsSaving(true);
    const toSave: BarberScheduleDay[] = schedule.map((s: any) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.start,
      endTime: s.end,
      isOff: !s.active,
    }));
    
    await updateBarberSchedule(barberId, toSave);
    setIsSaving(false);
    Alert.alert("✅ สำเร็จ", "บันทึกตารางเวลาทำงานเรียบร้อยแล้ว");
  };

  return (
    <ImageBackground
      source={require("../../../assets/13.jpg")}
      style={styles.container}
      resizeMode="repeat"
    >
      <View style={styles.overlay} />
      <CustomHeader roleLabel="ตารางงาน" onLogout={() => confirmLogout(navigation, "StaffLogin")} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>ตั้งค่าเวลาทำงาน</Text>
          <Text style={styles.subtitle}>กำหนดวันหยุดและเวลาสำหรับรับลูกค้า</Text>
        </View>

        {loading ? (
          <Text style={{ textAlign: "center", marginTop: 40, color: colors.textMuted }}>กำลังโหลดข้อมูล...</Text>
        ) : (
          <View style={styles.cardsContainer}>
            {schedule.map((item: any, i) => (
              <View 
                key={item.dayOfWeek} 
                style={[
                  styles.dayCard, 
                  item.active ? styles.dayCardActive : styles.dayCardInactive
                ]}
              >
                <View style={styles.dayHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Switch
                      value={item.active}
                      onValueChange={() => toggleDay(i)}
                      trackColor={{ false: "rgba(255,255,255,0.1)", true: colors.success }}
                      thumbColor={"#FFFFFF"}
                    />
                    <Text style={[styles.dayText, item.active ? { color: "#FFF" } : { color: "#94A3B8" }]}>
                      วัน{item.label}
                    </Text>
                  </View>
                  
                  {!item.active && (
                    <View style={styles.offBadge}>
                      <Text style={styles.offBadgeText}>หยุดทำการ</Text>
                    </View>
                  )}
                </View>

                {item.active && (
                  <View style={styles.timeInputsContainer}>
                    <View style={styles.timeInputWrapper}>
                      <Clock size={14} color="#94A3B8" style={{ marginRight: 8 }} />
                      <Text style={styles.timeLabel}>เริ่มงาน</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={item.start}
                        onChangeText={(val) => updateTime(i, "start", val)}
                        placeholder="09:00"
                        placeholderTextColor="#64748B"
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                      />
                    </View>
                    <Text style={{ color: "#64748B", marginHorizontal: 8 }}>-</Text>
                    <View style={styles.timeInputWrapper}>
                      <Clock size={14} color="#94A3B8" style={{ marginRight: 8 }} />
                      <Text style={styles.timeLabel}>เลิกงาน</Text>
                      <TextInput
                        style={styles.timeInput}
                        value={item.end}
                        onChangeText={(val) => updateTime(i, "end", val)}
                        placeholder="19:00"
                        placeholderTextColor="#64748B"
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                      />
                    </View>
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity 
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              <Save size={20} color="#0F172A" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>
                {isSaving ? "กำลังบันทึก..." : "บันทึกตารางงาน"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: colors.background,
  },
  overlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(10,15,30,0.72)", // Dark overlay matching BarberDashboard
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  cardsContainer: {
    gap: 16,
  },
  dayCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dayCardActive: {
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  dayCardInactive: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderColor: "rgba(239, 68, 68, 0.2)", // Subtle red border for off days
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  offBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  offBadgeText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "bold",
  },
  timeInputsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  timeInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  timeLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginRight: 8,
  },
  timeInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    paddingVertical: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "bold",
  },
});
