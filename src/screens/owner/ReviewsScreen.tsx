import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Modal,
  TouchableOpacity,
} from "react-native";
import { Star, X } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { CustomHeader } from "../../components/CustomHeader";
import { CustomCard } from "../../components/CustomCard";
import { confirmLogout } from "../../utils/logout";
import { getReviews } from "../../services/ownerService";
import { useFocusEffect } from "@react-navigation/native";

export const ReviewsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [reviews, setReviews] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedReview, setSelectedReview] = React.useState<any | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const loadReviews = async () => {
        setLoading(true);
        const data = await getReviews();
        setReviews(data);
        setLoading(false);
      };
      loadReviews();
    }, [])
  );

  const avg = reviews.length > 0 
    ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <ImageBackground
      source={require("../../../assets/13.jpg")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <CustomHeader roleLabel="รีวิวจากลูกค้า" onLogout={() => confirmLogout(navigation, "StaffLogin")} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topRow}>
          <Text style={styles.title}>รีวิวจากลูกค้า</Text>
          <View style={styles.avgBadge}>
            <Star size={16} color={colors.primary} fill={colors.primary} />
            <Text style={styles.avgScore}>{avg}</Text>
            <Text style={styles.avgCount}>({reviews.length})</Text>
          </View>
        </View>

        {loading ? (
          <Text style={{ textAlign: "center", marginTop: 20, color: colors.textMuted }}>กำลังโหลดข้อมูล...</Text>
        ) : reviews.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20, color: colors.textMuted }}>ยังไม่มีรีวิว</Text>
        ) : (
          reviews.map((r) => (
            <TouchableOpacity key={r.id} activeOpacity={0.8} onPress={() => setSelectedReview(r)}>
              <CustomCard>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.customerName}>{r.customer}</Text>
                    <Text style={styles.barberInfo}>
                      {r.barber} • {r.date}
                    </Text>
                  </View>
                  <View style={styles.starsRow}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        color={colors.primary}
                        fill={i < r.rating ? colors.primary : "transparent"}
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.commentText} numberOfLines={2}>{r.comment}</Text>
              </CustomCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Review Detail Modal */}
      <Modal
        visible={!!selectedReview}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedReview(null)}
      >
        <View style={styles.modalOverlay}>
          {selectedReview && (
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>รายละเอียดรีวิว</Text>
                <TouchableOpacity onPress={() => setSelectedReview(null)} style={styles.closeBtn}>
                  <X size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <View style={styles.modalStarsRow}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={32}
                      color={colors.primary}
                      fill={i < selectedReview.rating ? colors.primary : "transparent"}
                    />
                  ))}
                </View>
                <Text style={styles.modalScoreText}>{selectedReview.rating} จาก 5 คะแนน</Text>
                
                <View style={styles.modalInfoBox}>
                  <Text style={styles.modalInfoLabel}>ลูกค้า:</Text>
                  <Text style={styles.modalInfoValue}>{selectedReview.customer}</Text>
                </View>
                
                <View style={styles.modalInfoBox}>
                  <Text style={styles.modalInfoLabel}>ช่างผู้ให้บริการ:</Text>
                  <Text style={styles.modalInfoValue}>{selectedReview.barber}</Text>
                </View>

                <View style={styles.modalInfoBox}>
                  <Text style={styles.modalInfoLabel}>วันที่รีวิว:</Text>
                  <Text style={styles.modalInfoValue}>{selectedReview.date}</Text>
                </View>

                <View style={styles.modalCommentBox}>
                  <Text style={styles.modalInfoLabel}>ความคิดเห็น:</Text>
                  <Text style={styles.modalCommentValue}>
                    {selectedReview.comment ? `"${selectedReview.comment}"` : "ไม่มีข้อความความคิดเห็น"}
                  </Text>
                </View>
              </View>
            </View>
          )}
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
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(10, 15, 30, 0.82)",
  },
  scrollContent: {
    padding: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
  },
  avgBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  avgScore: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.text,
  },
  avgCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.text,
  },
  barberInfo: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  commentText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 15, 30, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#1E293B",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 24,
  },
  modalStarsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    marginBottom: 8,
  },
  modalScoreText: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 15,
    marginBottom: 24,
  },
  modalInfoBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  modalInfoLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  modalInfoValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFF",
  },
  modalCommentBox: {
    marginTop: 16,
    paddingTop: 12,
  },
  modalCommentValue: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    marginTop: 8,
    fontStyle: "italic",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
});
