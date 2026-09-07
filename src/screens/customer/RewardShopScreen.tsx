import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronLeft,
  Gift,
  Scissors,
  Percent,
  AlertTriangle,
  CheckCircle,
  ShoppingBag,
  X,
} from "lucide-react-native";
import { colors } from "../../theme/colors";
import { getAvailableRewards, redeemReward, Reward } from "../../services/rewardService";
import { getCurrentProfile, UserProfile } from "../../services/authService";

type ModalState =
  | { type: "none" }
  | { type: "insufficient"; reward: Reward; currentPoints: number }
  | { type: "confirm"; reward: Reward }
  | { type: "success"; rewardName: string }
  | { type: "error"; message: string };

export const RewardShopScreen = () => {
  const navigation = useNavigation<any>();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [rewardsData, profileData] = await Promise.all([
      getAvailableRewards(),
      getCurrentProfile(),
    ]);
    setRewards(rewardsData);
    setProfile(profileData);
    setLoading(false);
  };

  const handleRedeem = (reward: Reward) => {
    if (!profile) return;
    const currentPoints = profile.points ?? 0;

    if (currentPoints < reward.pointsCost) {
      setModal({ type: "insufficient", reward, currentPoints });
      return;
    }

    setModal({ type: "confirm", reward });
  };

  const executeRedeem = async (reward: Reward) => {
    if (!profile) return;
    setModal({ type: "none" });
    setRedeeming(reward.id);
    const res = await redeemReward(profile.id, reward.id, reward.pointsCost);
    setRedeeming(null);

    if (res.success) {
      await loadData();
      setModal({ type: "success", rewardName: reward.name });
    } else {
      setModal({ type: "error", message: res.error || "ไม่สามารถแลกรางวัลได้" });
    }
  };

  const closeModal = () => setModal({ type: "none" });

  const renderIcon = (type: string) => {
    if (type === "FREE_SERVICE") return <Scissors size={24} color="#F59E0B" />;
    return <Percent size={24} color="#F59E0B" />;
  };

  return (
    <ImageBackground
      source={require("../../../assets/13.jpg")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      {/* ─── Custom Modal ─── */}
      <Modal
        visible={modal.type !== "none"}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            {/* Insufficient Points */}
            {modal.type === "insufficient" && (
              <>
                <View style={[styles.modalIconRing, styles.modalIconRingDanger]}>
                  <AlertTriangle size={32} color="#EF4444" />
                </View>
                <Text style={styles.modalTitle}>แต้มไม่พอ!</Text>
                <Text style={styles.modalSubtitle}>
                  คุณมีแต้มไม่เพียงพอสำหรับของรางวัลนี้
                </Text>

                {/* Points breakdown */}
                <View style={styles.pointsBreakdown}>
                  <View style={styles.pointsRow}>
                    <Text style={styles.pointsRowLabel}>แต้มที่มีอยู่</Text>
                    <Text style={styles.pointsRowValue}>
                      {modal.currentPoints} แต้ม
                    </Text>
                  </View>
                  <View style={styles.pointsRow}>
                    <Text style={styles.pointsRowLabel}>แต้มที่ต้องการ</Text>
                    <Text style={[styles.pointsRowValue, { color: "#FBBF24" }]}>
                      {modal.reward.pointsCost} แต้ม
                    </Text>
                  </View>
                  <View style={styles.pointsDivider} />
                  <View style={styles.pointsRow}>
                    <Text style={[styles.pointsRowLabel, { fontWeight: "bold" }]}>
                      ขาดอีก
                    </Text>
                    <Text style={[styles.pointsRowValue, { color: "#EF4444", fontWeight: "bold" }]}>
                      {modal.reward.pointsCost - modal.currentPoints} แต้ม
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.modalBtnPrimary} onPress={closeModal}>
                  <Text style={styles.modalBtnPrimaryText}>ตกลง</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Confirm Redeem */}
            {modal.type === "confirm" && (
              <>
                <View style={[styles.modalIconRing, styles.modalIconRingGold]}>
                  <ShoppingBag size={32} color="#FBBF24" />
                </View>
                <Text style={styles.modalTitle}>ยืนยันการแลกรางวัล</Text>
                <Text style={styles.modalSubtitle}>
                  คุณต้องการแลก
                </Text>
                <Text style={styles.modalRewardName}>"{modal.reward.name}"</Text>

                <View style={styles.pointsBreakdown}>
                  <View style={styles.pointsRow}>
                    <Text style={styles.pointsRowLabel}>แต้มที่ใช้</Text>
                    <Text style={[styles.pointsRowValue, { color: "#FBBF24" }]}>
                      -{modal.reward.pointsCost} แต้ม
                    </Text>
                  </View>
                  <View style={styles.pointsRow}>
                    <Text style={styles.pointsRowLabel}>แต้มคงเหลือ</Text>
                    <Text style={styles.pointsRowValue}>
                      {(profile?.points ?? 0) - modal.reward.pointsCost} แต้ม
                    </Text>
                  </View>
                </View>

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.modalBtnSecondary} onPress={closeModal}>
                    <Text style={styles.modalBtnSecondaryText}>ยกเลิก</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalBtnPrimary}
                    onPress={() => executeRedeem(modal.reward)}
                  >
                    <Text style={styles.modalBtnPrimaryText}>ยืนยัน</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Success */}
            {modal.type === "success" && (
              <>
                <View style={[styles.modalIconRing, styles.modalIconRingSuccess]}>
                  <CheckCircle size={32} color="#22C55E" />
                </View>
                <Text style={styles.modalTitle}>แลกรางวัลสำเร็จ! 🎉</Text>
                <Text style={styles.modalSubtitle}>
                  คูปอง "{modal.type === "success" ? modal.rewardName : ""}" ถูกเพิ่มแล้ว{"\n"}
                  ใช้ได้ตอนจองคิว ในขั้นตอนสุดท้าย
                </Text>
                <TouchableOpacity style={styles.modalBtnPrimary} onPress={closeModal}>
                  <Text style={styles.modalBtnPrimaryText}>เยี่ยมเลย!</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Error */}
            {modal.type === "error" && (
              <>
                <View style={[styles.modalIconRing, styles.modalIconRingDanger]}>
                  <X size={32} color="#EF4444" />
                </View>
                <Text style={styles.modalTitle}>เกิดข้อผิดพลาด</Text>
                <Text style={styles.modalSubtitle}>{modal.message}</Text>
                <TouchableOpacity style={styles.modalBtnPrimary} onPress={closeModal}>
                  <Text style={styles.modalBtnPrimaryText}>ตกลง</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ร้านค้าแลกรางวัล</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Points Banner */}
      <View style={styles.pointsBanner}>
        <Gift size={28} color="#FBBF24" />
        <View style={styles.pointsBannerText}>
          <Text style={styles.pointsBannerTitle}>แต้มสะสมปัจจุบัน</Text>
          <Text style={styles.pointsBannerValue}>{profile?.points ?? 0} แต้ม</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          <Text style={styles.sectionTitle}>ของรางวัลทั้งหมด</Text>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : rewards.length === 0 ? (
            <Text style={styles.emptyText}>ยังไม่มีของรางวัลในขณะนี้</Text>
          ) : (
            rewards.map((reward) => {
              const canAfford = (profile?.points ?? 0) >= reward.pointsCost;
              return (
                <View
                  key={reward.id}
                  style={[styles.rewardCard, !canAfford && styles.rewardCardInsufficient]}
                >
                  <View style={styles.rewardIconWrapper}>
                    {renderIcon(reward.discountType)}
                  </View>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardName}>{reward.name}</Text>
                    {reward.description ? (
                      <Text style={styles.rewardDesc}>{reward.description}</Text>
                    ) : null}
                    <Text style={[styles.rewardCost, !canAfford && { color: "#EF4444" }]}>
                      {reward.pointsCost} แต้ม
                      {!canAfford && (
                        <Text style={styles.rewardCostShort}>
                          {" "}(ขาดอีก {reward.pointsCost - (profile?.points ?? 0)} แต้ม)
                        </Text>
                      )}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.redeemBtn,
                      !canAfford ? styles.redeemBtnInsufficient : null,
                      redeeming === reward.id ? styles.redeemBtnLoading : null,
                    ]}
                    onPress={() => handleRedeem(reward)}
                    disabled={redeeming === reward.id}
                  >
                    {redeeming === reward.id ? (
                      <ActivityIndicator size="small" color="#0F172A" />
                    ) : (
                      <Text style={[styles.redeemBtnText, !canAfford && { color: "#FCA5A5" }]}>
                        แลก
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
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
    backgroundColor: "rgba(15, 23, 42, 0.7)",
  },

  // ─── Custom Modal ───
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#1E293B",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalIconRingGold: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  modalIconRingDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  modalIconRingSuccess: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(34, 197, 94, 0.4)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  modalRewardName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FBBF24",
    textAlign: "center",
    marginBottom: 20,
    marginTop: -12,
  },
  pointsBreakdown: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  pointsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pointsRowLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  pointsRowValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
  },
  pointsDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 4,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalBtnPrimaryText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0F172A",
  },
  modalBtnSecondary: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  modalBtnSecondaryText: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.textMuted,
  },

  // ─── Header ───
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },

  // ─── Points Banner ───
  pointsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(245, 158, 11, 0.3)",
  },
  pointsBannerText: {
    marginLeft: 12,
    alignItems: "center",
  },
  pointsBannerTitle: {
    fontSize: 14,
    color: "#FDE68A",
  },
  pointsBannerValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FBBF24",
  },

  // ─── Scroll ───
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 20,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },

  // ─── Reward Cards ───
  rewardCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  rewardCardInsufficient: {
    borderColor: "rgba(239, 68, 68, 0.2)",
    backgroundColor: "rgba(30, 25, 40, 0.8)",
  },
  rewardIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  rewardDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  rewardCost: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FBBF24",
    marginTop: 8,
  },
  rewardCostShort: {
    fontSize: 12,
    fontWeight: "normal",
    color: "#EF4444",
  },

  // ─── Redeem Button ───
  redeemBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 12,
    minWidth: 52,
    alignItems: "center",
  },
  redeemBtnInsufficient: {
    backgroundColor: "rgba(239, 68, 68, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  redeemBtnLoading: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  redeemBtnText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0F172A",
  },
});
