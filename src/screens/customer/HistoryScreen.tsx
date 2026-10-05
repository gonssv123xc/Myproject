import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ImageBackground,
  Modal,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Calendar, Clock, Star } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { CustomHeader } from "../../components/CustomHeader";
import { CustomCard } from "../../components/CustomCard";
import { CustomButton } from "../../components/CustomButton";
import { confirmLogout } from "../../utils/logout";
import { getBookingHistory, cancelBooking, submitReview, Booking } from "../../services/bookingService";
import { getCurrentProfile } from "../../services/authService";
import { getShopInfo } from "../../services/shopService";
import { notifyBookingCancelled, DEFAULT_SHOP_CHAT_ID } from "../../services/telegramService";
import { useFocusEffect } from "@react-navigation/native";

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [history, setHistory] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewData, setReviewData] = useState({ bookingId: "", barberId: "", rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    const profile = await getCurrentProfile();
    if (profile) {
      const data = await getBookingHistory(profile.id);
      setHistory(data);
    }
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [])
  );

  const handleCancel = (id: string) => {
    const bookingToCancel = history.find((b) => b.id === id);
    Alert.alert("ยืนยันการยกเลิก", "คุณต้องการยกเลิกการจองนี้ใช่หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ยืนยันยกเลิก",
        style: "destructive",
        onPress: async () => {
          const { error } = await cancelBooking(id);
          if (error) {
            Alert.alert("เกิดข้อผิดพลาด", error.message);
          } else {
            Alert.alert("ยกเลิกการจองเรียบร้อย");
            loadHistory();

            // Notify Telegram
            if (bookingToCancel) {
              const profile = await getCurrentProfile();
              const shop = await getShopInfo();
              const notiData = {
                shopName: shop?.name || "ร้านตัดผม",
                customerName: profile ? `${profile.firstName} ${profile.lastName}`.trim() : "ลูกค้า",
                date: bookingToCancel.date ? bookingToCancel.date.split("T")[0] : "",
                startTime: bookingToCancel.startTime,
                cancelledBy: "customer" as const,
              };
              notifyBookingCancelled(shop?.telegramChatId || DEFAULT_SHOP_CHAT_ID, notiData);
              if (profile?.telegramChatId) {
                notifyBookingCancelled(profile.telegramChatId, notiData);
              }
            }
          }
        },
      },
    ]);
  };

  const handleReviewSubmit = async () => {
    if (!reviewData.rating) {
      Alert.alert("แจ้งเตือน", "กรุณาให้คะแนนความพึงพอใจ");
      return;
    }
    setSubmittingReview(true);
    const res = await submitReview(reviewData.bookingId, reviewData.barberId, reviewData.rating, reviewData.comment);
    setSubmittingReview(false);
    if (res.success) {
      Alert.alert("ขอบคุณสำหรับรีวิว!", "รีวิวของคุณถูกบันทึกแล้ว");
      setReviewModalVisible(false);
      loadHistory();
    } else {
      Alert.alert("เกิดข้อผิดพลาด", res.error || "ไม่สามารถบันทึกรีวิวได้");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return { label: "ยืนยันแล้ว", color: colors.success, bg: colors.successBg };
      case "COMPLETED":
        return { label: "เสร็จสิ้น", color: colors.textMuted, bg: colors.cardBorder };
      case "CANCELLED":
        return { label: "ยกเลิก", color: colors.danger, bg: colors.dangerBg };
      case "NO_SHOW":
        return { label: "ไม่ได้เข้ารับบริการ", color: colors.danger, bg: colors.dangerBg };
      default:
        return { label: status, color: colors.textMuted, bg: colors.cardBorder };
    }
  };

  return (
    <ImageBackground
      source={require("../../../assets/13.jpg")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <CustomHeader roleLabel="ประวัติการจอง" onLogout={() => confirmLogout(navigation, "Login")} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>ประวัติการจอง</Text>

        {loading ? (
          <Text style={{ textAlign: "center", marginTop: 20, color: colors.textMuted }}>กำลังโหลดข้อมูล...</Text>
        ) : history.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20, color: colors.textMuted }}>ยังไม่มีประวัติการจอง</Text>
        ) : (
          history.map((item) => {
          const badge = getStatusBadge(item.status);
          return (
            <CustomCard key={item.id}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.serviceTitle}>{item.serviceName}</Text>
                  <Text style={styles.barberName}>{item.barberName}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaBadge}>
                  <Calendar size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>{new Date(item.date).toLocaleDateString("th-TH")}</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Clock size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>{item.startTime} น.</Text>
                </View>
                <Text style={styles.priceText}>฿{item.totalPrice}</Text>
              </View>

              {item.status === "CONFIRMED" && (
                <CustomButton
                  title="ยกเลิกการจอง"
                  variant="danger"
                  onPress={() => handleCancel(item.id)}
                  style={{ marginTop: 10, height: 38 }}
                  textStyle={{ fontSize: 13 }}
                />
              )}
              {item.status === "COMPLETED" && !item.hasReview && (
                <CustomButton
                  title="รีวิวบริการ"
                  variant="primary"
                  onPress={() => {
                    setReviewData({ bookingId: item.id, barberId: item.barberId, rating: 5, comment: "" });
                    setReviewModalVisible(true);
                  }}
                  style={{ marginTop: 10, height: 38 }}
                  textStyle={{ fontSize: 13 }}
                />
              )}
              {item.status === "COMPLETED" && item.hasReview && (
                <Text style={{ marginTop: 12, fontSize: 13, color: colors.success, textAlign: 'center', fontWeight: 'bold' }}>⭐ คุณได้รีวิวบริการนี้แล้ว</Text>
              )}
            </CustomCard>
          );
        }))}
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={reviewModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>รีวิวบริการของคุณ</Text>
            <Text style={styles.modalSubtitle}>ให้คะแนนความพึงพอใจกับช่างและร้าน</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setReviewData({...reviewData, rating: star})}>
                  <Star 
                    size={40} 
                    color={star <= reviewData.rating ? "#FBBF24" : "#475569"} 
                    fill={star <= reviewData.rating ? "#FBBF24" : "transparent"} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="ความประทับใจ หรือข้อเสนอแนะเพิ่มเติม (ถ้ามี)"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={reviewData.comment}
              onChangeText={(txt) => setReviewData({...reviewData, comment: txt})}
            />

            <View style={styles.modalButtons}>
              <CustomButton
                title="ยกเลิก"
                variant="outline"
                onPress={() => setReviewModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <CustomButton
                title={submittingReview ? "กำลังบันทึก..." : "ส่งรีวิว"}
                variant="primary"
                onPress={handleReviewSubmit}
                disabled={submittingReview}
                style={{ flex: 1, marginLeft: 8 }}
              />
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
    position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(10,15,30,0.72)",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  barberName: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  priceText: {
    marginLeft: "auto",
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  commentInput: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#FFFFFF",
    padding: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
  },
});
