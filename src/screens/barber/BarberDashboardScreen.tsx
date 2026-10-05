import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  ImageBackground,
  TextInput,
} from "react-native";
import { User, Clock, CircleCheck, CircleX, Bell, CheckCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { CustomHeader } from "../../components/CustomHeader";
import { CustomCard } from "../../components/CustomCard";
import { CustomButton } from "../../components/CustomButton";
import { confirmLogout } from "../../utils/logout";
import { 
  getBarberQueue, 
  updateBookingStatus, 
  updateBarberStatus, 
  BarberQueueItem,
  getBarberSchedule,
  updateBarberSchedule,
  BarberScheduleDay,
  getCompletedUnsubmittedBookings,
  submitWorkToOwner,
  UnsubmittedBookingItem
} from "../../services/barberService";
import { getCurrentProfile } from "../../services/authService";
import { supabase } from "../../services/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { Calendar } from "lucide-react-native";

export const BarberDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const [queue, setQueue] = useState<BarberQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [barberProfile, setBarberProfile] = useState<any>(null);
  const [myStatus, setMyStatus] = useState<"available" | "busy" | "break">("available");
  
  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState<BarberQueueItem | null>(null);

  // Detail Modal State
  const [selectedDetailItem, setSelectedDetailItem] = useState<BarberQueueItem | null>(null);

  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState<BarberScheduleDay[]>([]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Submit Work State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [unsubmittedWork, setUnsubmittedWork] = useState<UnsubmittedBookingItem[]>([]);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  const loadQueue = async () => {
    setLoading(true);
    const profile = await getCurrentProfile();
    if (profile) {
      // Fetch Barber row with joined User data
      const { data: barberRow } = await supabase
        .from("Barber")
        .select("*, User!userId (firstName, lastName, email)")
        .eq("userId", profile.id)
        .single();

      if (barberRow) {
        setBarberId(barberRow.id);
        // Merge User name into profile object for easy access
        setBarberProfile({
          ...barberRow,
          firstName: barberRow.User?.firstName || "",
          lastName: barberRow.User?.lastName || "",
          email: barberRow.User?.email || "",
        });
        const statusMap: Record<string, "available" | "busy" | "break"> = {
          AVAILABLE: "available",
          BUSY: "busy",
          BREAK: "break",
        };
        setMyStatus(statusMap[barberRow.status] || "available");

        // Load queue using real barberId (UUID from Barber table)
        const data = await getBarberQueue(barberRow.id);
        setQueue(data);
      }
    }
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadQueue();
    }, [])
  );

  // Real-time synchronization for Booking, Barber profile, and User name
  React.useEffect(() => {
    if (!barberId) return;

    // Channel 1: Booking changes (queue updates)
    const bookingChannel = supabase
      .channel(`barber-booking-${barberId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Booking', filter: `"barberId"=eq.${barberId}` },
        () => { loadQueue(); }
      )
      .subscribe();

    // Channel 2: Barber row changes (specialties, avatar, status updated by owner)
    const barberChannel = supabase
      .channel(`barber-profile-${barberId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'Barber', filter: `id=eq.${barberId}` },
        () => { loadQueue(); }
      )
      .subscribe();

    // Channel 3: User row changes (firstName, lastName updated by owner)
    const userChannel = supabase
      .channel(`barber-user-${barberId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'User' },
        () => { loadQueue(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingChannel);
      supabase.removeChannel(barberChannel);
      supabase.removeChannel(userChannel);
    };
  }, [barberId]);

  const updateStatus = async (id: string, status: string) => {
    setLoading(true);
    const { error } = await updateBookingStatus(id, status);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      if (status === "COMPLETED") {
        Alert.alert("ตัดเสร็จแล้ว!", "ระบบบันทึกข้อมูลเรียบร้อย");
      }
      loadQueue();
    }
    setLoading(false);
  };

  const barberStatuses = [
    { key: "available" as const, label: "ว่าง", emoji: "🟢" },
    { key: "busy" as const, label: "ติดลูกค้า", emoji: "🔴" },
    { key: "break" as const, label: "พักเบรก", emoji: "🟡" },
  ];

  const loadSchedule = async () => {
    if (!barberId) return;
    const data = await getBarberSchedule(barberId);
    
    // Fill missing days with default
    const fullSchedule: BarberScheduleDay[] = [];
    for (let i = 0; i < 7; i++) {
      const existing = data.find(d => d.dayOfWeek === i);
      if (existing) {
        fullSchedule.push(existing);
      } else {
        fullSchedule.push({
          dayOfWeek: i,
          startTime: "09:00",
          endTime: "19:00",
          isOff: false
        });
      }
    }
    setScheduleData(fullSchedule);
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async () => {
    if (!barberId) return;
    setIsSavingSchedule(true);
    await updateBarberSchedule(barberId, scheduleData);
    setIsSavingSchedule(false);
    setShowScheduleModal(false);
    Alert.alert("สำเร็จ", "บันทึกเวลาทำงานเรียบร้อยแล้ว");
  };

  const handleOpenSubmitWork = async () => {
    if (!barberId) return;
    setLoading(true);
    const data = await getCompletedUnsubmittedBookings(barberId);
    setUnsubmittedWork(data);
    setLoading(false);
    setShowSubmitModal(true);
  };

  const handleConfirmSubmitWork = async () => {
    if (unsubmittedWork.length === 0) return;
    setIsSubmittingWork(true);
    const ids = unsubmittedWork.map(w => w.id);
    const { success, error } = await submitWorkToOwner(ids);
    setIsSubmittingWork(false);
    if (success) {
      Alert.alert("✅ สำเร็จ", "ส่งรายงานยอดให้หัวหน้าเรียบร้อยแล้ว");
      setShowSubmitModal(false);
    } else {
      Alert.alert("เกิดข้อผิดพลาด", error || "ไม่สามารถส่งงานได้");
    }
  };

  const DAYS_TH = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

  return (
    <ImageBackground
      source={require("../../../assets/13.jpg")}
      style={styles.container}
      resizeMode="repeat"
    >
      <View style={styles.overlay} />
      <CustomHeader roleLabel="ช่างตัดผม" onLogout={() => confirmLogout(navigation, "StaffLogin")} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Barber Profile Card */}
        {barberProfile && (
          <View style={{ backgroundColor: "rgba(30, 41, 59, 0.75)", borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', borderWidth: 2, borderColor: colors.primary }}>
              {barberProfile.avatar ? (
                <Image source={{ uri: barberProfile.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Image source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent((barberProfile.firstName || barberProfile.nickname || "ช่าง"))}&background=random` }} style={{ width: '100%', height: '100%' }} />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 20 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 4 }}>
                {barberProfile.firstName
                  ? `${barberProfile.firstName}${barberProfile.lastName ? ' ' + barberProfile.lastName : ''}`
                  : (barberProfile.nickname || "ไม่ระบุชื่อ")
                }
              </Text>
              {barberProfile.bio && (
                <Text style={{ fontSize: 14, color: '#94A3B8', marginBottom: 4 }} numberOfLines={2}>
                  {barberProfile.bio}
                </Text>
              )}
              {barberProfile.specialties && (
                <Text style={{ fontSize: 13, color: colors.primary, fontWeight: 'bold' }}>
                  {barberProfile.specialties}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Status Toggle Card - Modern Pill Design */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View style={styles.floatingStatusContainer}>
            {barberStatuses.map((s) => {
              const isActive = myStatus === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.statusBtn, isActive ? { padding: 0 } : {}]}
                  onPress={async () => {
                    setMyStatus(s.key);
                    if (barberId) {
                      const result = await updateBarberStatus(barberId, s.key);
                      if (!result.success) {
                        Alert.alert("ไม่สามารถอัปเดตสถานะได้", result.error);
                        setMyStatus(myStatus); // revert
                      }
                    }
                  }}
                  activeOpacity={0.8}
                >
                  {isActive ? (
                    <LinearGradient colors={["#FBBF24", "#F59E0B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statusBtnGrad}>
                      <Text style={styles.activeStatusBtnText}>{s.emoji} {s.label}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.statusBtnText}>{s.label}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <TouchableOpacity 
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' }}
            onPress={handleOpenSubmitWork}
            activeOpacity={0.7}
          >
            <CheckCircle size={18} color={colors.success} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.success, fontSize: 15, fontWeight: 'bold' }}>สรุปยอดส่งงาน</Text>
          </TouchableOpacity>
        </View>

        {/* Queue list */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>
            คิวงานวันนี้ ({queue.filter((i) => ["PENDING", "CONFIRMED", "IN_PROGRESS"].includes(i.status)).length} รอ)
          </Text>
        </View>
        
        {loading ? (
          <Text style={{ textAlign: "center", color: colors.textMuted }}>กำลังโหลดคิวงาน...</Text>
        ) : queue.length === 0 ? (
          <View style={styles.emptyBox}>
            <CircleCheck size={44} color="#475569" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>ไม่มีคิวงาน</Text>
            <Text style={styles.emptySub}>พักผ่อนให้เต็มที่ครับ</Text>
          </View>
        ) : (
          queue.map((item) => {
            const isWaiting = ["PENDING", "CONFIRMED"].includes(item.status);
            return (
          <TouchableOpacity key={item.id} onPress={() => setSelectedDetailItem(item)} activeOpacity={0.8} style={{ marginBottom: 12 }}>
            <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.75)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', borderWidth: 2, borderColor: item.status === 'IN_PROGRESS' ? colors.primary : 'rgba(255,255,255,0.1)' }}>
                  {item.customerAvatar ? (
                    <Image source={{ uri: item.customerAvatar }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Image source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.customerName)}&background=random` }} style={{ width: '100%', height: '100%' }} />
                  )}
                </View>
                
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#FFF', marginBottom: 4 }} numberOfLines={1}>{item.customerName}</Text>
                  <Text style={{ fontSize: 13, color: '#94A3B8' }} numberOfLines={1}>{item.serviceName}</Text>
                </View>
                
                <View style={{ alignItems: 'flex-end', minWidth: 80 }}>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: colors.primary }}>{item.startTime}</Text>
                  <View style={[{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 }, 
                    item.status === 'IN_PROGRESS' ? { backgroundColor: 'rgba(251, 191, 36, 0.2)' } :
                    item.status === 'CONFIRMED' ? { backgroundColor: 'rgba(16, 185, 129, 0.2)' } :
                    { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                  ]}>
                    <Text style={[{ fontSize: 11, fontWeight: 'bold' },
                      item.status === 'IN_PROGRESS' ? { color: colors.primary } :
                      item.status === 'CONFIRMED' ? { color: '#10B981' } :
                      { color: '#CBD5E1' }
                    ]}>
                      {item.status === "PENDING" ? "รอยืนยัน" : item.status === "CONFIRMED" ? "ยืนยันแล้ว" : item.status === "IN_PROGRESS" ? "กำลังตัด" : item.status}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
          );
        }))}
      </ScrollView>

      {/* Booking Detail Modal */}
      <Modal
        visible={!!selectedDetailItem}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDetailItem(null)}
      >
        <View style={styles.paymentModalBackdrop}>
          {selectedDetailItem && (
            <View style={styles.paymentModalContent}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>รายละเอียดการจอง</Text>
                <TouchableOpacity onPress={() => setSelectedDetailItem(null)}>
                  <Text style={{ color: colors.danger, fontSize: 16 }}>ปิด</Text>
                </TouchableOpacity>
              </View>

              <View style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 16, marginBottom: 24, gap: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.textMuted }}>ลูกค้า</Text>
                  <Text style={{ color: "#FFF", fontWeight: "bold" }}>{selectedDetailItem.customerName}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.textMuted }}>บริการ</Text>
                  <Text style={{ color: "#FFF", fontWeight: "bold" }}>{selectedDetailItem.serviceName}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.textMuted }}>วันที่</Text>
                  <Text style={{ color: "#FFF", fontWeight: "bold" }}>{new Date(selectedDetailItem.date).toLocaleDateString('th-TH')}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.textMuted }}>เวลา</Text>
                  <Text style={{ color: colors.primary, fontWeight: "bold" }}>{selectedDetailItem.startTime}</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.textMuted }}>มัดจำ</Text>
                  <Text style={{ color: colors.success, fontWeight: "bold" }}>฿{selectedDetailItem.depositAmount}</Text>
                </View>
                {selectedDetailItem.couponName && (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: colors.textMuted }}>ส่วนลดที่ใช้</Text>
                    <Text style={{ color: colors.primary, fontWeight: "bold" }}>{selectedDetailItem.couponName}</Text>
                  </View>
                )}
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" }}>
                  <Text style={{ color: colors.textMuted }}>ยอดรวม</Text>
                  <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 18 }}>฿{selectedDetailItem.price}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              {["PENDING", "CONFIRMED"].includes(selectedDetailItem.status) && (
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                  <TouchableOpacity 
                    style={{ flex: 1 }} 
                    onPress={() => {
                      updateStatus(selectedDetailItem.id, "IN_PROGRESS");
                      setSelectedDetailItem(null);
                    }} 
                    activeOpacity={0.8}
                  >
                    <LinearGradient colors={["#FBBF24", "#F59E0B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionBtnGrad}>
                      <CircleCheck size={18} color="#0F172A" />
                      <Text style={[styles.actionBtnText, { fontSize: 16 }]}>เริ่มตัด</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ flex: 1 }} 
                    onPress={() => {
                      updateStatus(selectedDetailItem.id, "NO_SHOW");
                      setSelectedDetailItem(null);
                    }} 
                    activeOpacity={0.8}
                  >
                    <LinearGradient colors={["#EF4444", "#DC2626"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionBtnGrad}>
                      <CircleX size={18} color="#FFFFFF" />
                      <Text style={[styles.actionBtnText, { color: "#FFFFFF", fontSize: 16 }]}>ไม่มา</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {selectedDetailItem.status === "IN_PROGRESS" && (
                <TouchableOpacity 
                  style={{ width: "100%", marginBottom: 12 }} 
                  onPress={() => {
                    setSelectedQueueItem(selectedDetailItem);
                    setSelectedDetailItem(null);
                    setShowPaymentModal(true);
                  }} 
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={["#10B981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.actionBtnGrad, { paddingVertical: 16 }]}>
                    <CircleCheck size={20} color="#FFFFFF" />
                    <Text style={[styles.actionBtnText, { color: "#FFFFFF", fontSize: 16 }]}>ตัดเสร็จแล้ว (เรียกเก็บเงิน)</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Modal>

      {/* Payment Collection Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.paymentModalBackdrop}>
          <View style={styles.paymentModalContent}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>เรียกเก็บเงินส่วนที่เหลือ</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Text style={{ color: colors.danger, fontSize: 16 }}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>

            {selectedQueueItem && (
              <View style={{ width: "100%", alignItems: "center" }}>
                <View style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 16, marginBottom: 24 }}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>ราคารวมทั้งหมด (หลังหักส่วนลด)</Text>
                    <Text style={styles.priceValue}>฿{selectedQueueItem.price}</Text>
                  </View>
                  {selectedQueueItem.couponName && (
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceLabel, { color: colors.success }]}>คูปองที่ใช้</Text>
                      <Text style={[styles.priceValue, { color: colors.success, fontSize: 14 }]}>{selectedQueueItem.couponName}</Text>
                    </View>
                  )}
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>หักมัดจำ</Text>
                    <Text style={styles.priceValue}>-฿{selectedQueueItem.depositAmount}</Text>
                  </View>
                  <View style={[styles.priceRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" }]}>
                    <Text style={{ fontSize: 18, color: "#FFFFFF", fontWeight: "bold" }}>ยอดต้องชำระ</Text>
                    <Text style={{ fontSize: 24, color: colors.primary, fontWeight: "bold" }}>
                      ฿{Math.max(0, selectedQueueItem.price - selectedQueueItem.depositAmount)}
                    </Text>
                  </View>
                </View>

                {Math.max(0, selectedQueueItem.price - selectedQueueItem.depositAmount) > 0 ? (
                  <View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24, alignItems: "center", marginBottom: 24, width: "100%" }}>
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: "#0F172A", marginBottom: 4 }}>ให้ลูกค้าสแกนเพื่อชำระเงิน</Text>
                    <Text style={{ fontSize: 24, fontWeight: "900", color: "#EF4444", marginBottom: 16 }}>
                      ยอดชำระ: ฿{Math.max(0, selectedQueueItem.price - selectedQueueItem.depositAmount)}
                    </Text>
                    <View style={{ padding: 16, backgroundColor: "#FFFFFF", borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4, marginBottom: 12 }}>
                      <Image source={require("../../../assets/payment_qr.jpg")} style={{ width: 220, height: 280 }} resizeMode="contain" />
                    </View>
                  </View>
                ) : (
                  <View style={{ padding: 24, alignItems: "center" }}>
                    <Text style={{ color: colors.success, fontSize: 18, fontWeight: "bold" }}>ชำระเงินครบถ้วนแล้ว</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.statusBtn, { backgroundColor: colors.success, width: "100%", paddingVertical: 16, borderRadius: 16, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }]}
                  onPress={() => {
                    setShowPaymentModal(false);
                    updateStatus(selectedQueueItem.id, "COMPLETED");
                  }}
                >
                  <CircleCheck size={20} color="#0F172A" />
                  <Text style={{ color: "#0F172A", fontSize: 16, fontWeight: "bold" }}>ยืนยันว่าลูกค้าจ่ายแล้ว (ปิดคิว)</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
      {/* Schedule Modal */}
      <Modal
        visible={showScheduleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.paymentModalBackdrop}>
          <View style={[styles.paymentModalContent, { maxHeight: "95%" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>ตั้งค่าเวลาทำงาน</Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <Text style={{ color: colors.danger, fontSize: 16 }}>ปิด</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ width: "100%", marginBottom: 16 }}>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 16 }}>
                ระบบจะนำเวลาเหล่านี้ไปสร้างเป็นช่วงเวลา (Slots) ให้ลูกค้าเลือกจอง
              </Text>
              
              {scheduleData.map((day, index) => (
                <View key={day.dayOfWeek} style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "bold" }}>วัน{DAYS_TH[day.dayOfWeek]}</Text>
                    <TouchableOpacity
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: day.isOff ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)" }}
                      onPress={() => {
                        const newData = [...scheduleData];
                        newData[index].isOff = !newData[index].isOff;
                        setScheduleData(newData);
                      }}
                    >
                      <Text style={{ color: day.isOff ? colors.danger : colors.success, fontSize: 12, fontWeight: "bold" }}>
                        {day.isOff ? "หยุดงาน" : "ทำงาน"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {!day.isOff && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>เวลาเริ่ม</Text>
                        <TextInput
                          style={{ backgroundColor: "rgba(0,0,0,0.2)", color: "#FFF", padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", textAlign: "center" }}
                          value={day.startTime}
                          onChangeText={(text) => {
                            const newData = [...scheduleData];
                            newData[index].startTime = text;
                            setScheduleData(newData);
                          }}
                          placeholder="09:00"
                          placeholderTextColor="#64748B"
                        />
                      </View>
                      <Text style={{ color: "#FFF", marginTop: 16 }}>-</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>เวลาเลิก</Text>
                        <TextInput
                          style={{ backgroundColor: "rgba(0,0,0,0.2)", color: "#FFF", padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", textAlign: "center" }}
                          value={day.endTime}
                          onChangeText={(text) => {
                            const newData = [...scheduleData];
                            newData[index].endTime = text;
                            setScheduleData(newData);
                          }}
                          placeholder="19:00"
                          placeholderTextColor="#64748B"
                        />
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.statusBtn, { backgroundColor: colors.primary, width: "100%", paddingVertical: 16, borderRadius: 16, alignItems: "center" }]}
              onPress={handleSaveSchedule}
              disabled={isSavingSchedule}
            >
              <Text style={{ color: "#0F172A", fontSize: 16, fontWeight: "bold" }}>
                {isSavingSchedule ? "กำลังบันทึก..." : "บันทึกเวลาทำงาน"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Submit Work Modal */}
      <Modal
        visible={showSubmitModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View style={styles.paymentModalBackdrop}>
          <View style={[styles.paymentModalContent, { maxHeight: "90%" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>สรุปยอดส่งงาน (วันนี้)</Text>
              <TouchableOpacity onPress={() => setShowSubmitModal(false)}>
                <Text style={{ color: colors.danger, fontSize: 16 }}>ปิด</Text>
              </TouchableOpacity>
            </View>

            {barberProfile && (
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 12, marginBottom: 20 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden' }}>
                  {barberProfile.avatar ? (
                    <Image source={{ uri: barberProfile.avatar }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Image source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(barberProfile.nickname || "ช่าง")}&background=random` }} style={{ width: '100%', height: '100%' }} />
                  )}
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 16 }}>{barberProfile.nickname || barberProfile.firstName || "ไม่ระบุชื่อ"}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>ผู้ส่งรายงาน</Text>
                </View>
              </View>
            )}

            {unsubmittedWork.length === 0 ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <CheckCircle size={48} color={colors.success} style={{ marginBottom: 16 }} />
                <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "bold" }}>ส่งงานครบหมดแล้ว</Text>
                <Text style={{ color: colors.textMuted, marginTop: 8 }}>ไม่มีรายการค้างส่งในระบบ</Text>
              </View>
            ) : (
              <>
                <ScrollView style={{ width: "100%", maxHeight: 300, marginBottom: 16 }}>
                  {unsubmittedWork.map((item, index) => (
                    <View key={item.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: index === unsubmittedWork.length - 1 ? 0 : 1, borderBottomColor: "rgba(255,255,255,0.05)" }}>
                      <View>
                        <Text style={{ color: "#FFF", fontWeight: "bold" }}>{item.customerName}</Text>
                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                          {item.serviceName} • {new Date(item.date).toLocaleDateString('th-TH')} {item.startTime}
                        </Text>
                      </View>
                      <Text style={{ color: colors.primary, fontWeight: "bold" }}>฿{item.price}</Text>
                    </View>
                  ))}
                </ScrollView>

                <View style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 16, marginBottom: 24 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={{ color: colors.textMuted }}>ยอดรวมลูกค้าจ่าย ({unsubmittedWork.length} บิล)</Text>
                    <Text style={{ color: "#FFF", fontWeight: "bold" }}>฿{unsubmittedWork.reduce((acc, curr) => acc + curr.price, 0)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                    <Text style={{ color: colors.danger }}>หักส่วนแบ่งช่าง (หัวละ 100 บาท)</Text>
                    <Text style={{ color: colors.danger, fontWeight: "bold" }}>-฿{unsubmittedWork.length * 100}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" }}>
                    <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "bold" }}>ยอดสุทธิที่ต้องส่งร้าน</Text>
                    <Text style={{ color: colors.primary, fontSize: 24, fontWeight: "900" }}>
                      ฿{Math.max(0, unsubmittedWork.reduce((acc, curr) => acc + curr.price, 0) - (unsubmittedWork.length * 100))}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.statusBtn, { backgroundColor: colors.success, width: "100%", paddingVertical: 16, borderRadius: 16, alignItems: "center" }]}
                  onPress={handleConfirmSubmitWork}
                  disabled={isSubmittingWork}
                >
                  <Text style={{ color: "#0F172A", fontSize: 16, fontWeight: "bold" }}>
                    {isSubmittingWork ? "กำลังส่ง..." : "ยืนยันการส่งยอดให้ร้าน"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%", height: "100%" },
  overlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(10,15,30,0.72)" },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  glassCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
  },
  floatingStatusContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    borderRadius: 30,
    padding: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    width: "100%",
    maxWidth: 400,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  statusBtnGrad: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  activeStatusBtnText: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 8,
    marginBottom: 12,
  },
  queueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  customerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  serviceText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.warningBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: "bold",
  },
  noteBox: {
    backgroundColor: colors.cardBorder,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  noteText: {
    fontSize: 13,
    color: colors.text,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  actionBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0F172A",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  emptyText: {
    fontSize: 15,
    color: "#94A3B8",
    fontWeight: "700",
  },
  emptySub: {
    fontSize: 13,
    color: "#475569",
    marginTop: 8,
  },
  paymentModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "flex-end",
  },
  paymentModalContent: {
    backgroundColor: "#1E293B",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: colors.textMuted,
  },
  priceValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "bold",
  },
});
