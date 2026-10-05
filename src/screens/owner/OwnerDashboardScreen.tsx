import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Image,
  TouchableOpacity,
  Modal,
  ActivityIndicator
} from "react-native";
import { DollarSign, Users, Calendar, TrendingUp, ChevronDown, ChevronUp, X, Edit3, Store } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";
import { CustomHeader } from "../../components/CustomHeader";
import { confirmLogout } from "../../utils/logout";
import { getDashboardStats, DashboardStats, getSubmittedWorks, SubmittedWorkItem, getDetailedBookings, getAllCustomersDetailed, getBarberDetailedBookings } from "../../services/ownerService";
import { getShopInfo, ShopInfo, subscribeToShopUpdates } from "../../services/shopService";
import { ShopSettingsModal } from "../../components/ShopSettingsModal";
import { useFocusEffect } from "@react-navigation/native";

export const OwnerDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = React.useState(true);
  const [dashboardData, setDashboardData] = React.useState<DashboardStats | null>(null);
  const [submittedWorks, setSubmittedWorks] = React.useState<SubmittedWorkItem[]>([]);
  const [expandedSubmissions, setExpandedSubmissions] = React.useState<Record<string, boolean>>({});

  // Modal states
  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalType, setModalType] = React.useState<"today" | "month" | "customers" | "barber" | null>(null);
  const [modalData, setModalData] = React.useState<any[]>([]);
  const [modalLoading, setModalLoading] = React.useState(false);
  const [selectedBarberName, setSelectedBarberName] = React.useState("");

  const toggleExpand = (id: string) => {
    setExpandedSubmissions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCardPress = async (type: "today" | "month" | "customers" | "barber", barberId?: string, barberName?: string) => {
    setModalType(type);
    setModalVisible(true);
    setModalLoading(true);
    
    if (type === "customers") {
      const data = await getAllCustomersDetailed();
      setModalData(data);
    } else if (type === "barber" && barberId) {
      setSelectedBarberName(barberName || "");
      const data = await getBarberDetailedBookings(barberId);
      setModalData(data);
    } else {
      const data = await getDetailedBookings(type as "today" | "month");
      setModalData(data);
    }
    
    setModalLoading(false);
  };

  const groupedWorks = React.useMemo(() => {
    const groups: Record<string, {
      id: string,
      barberName: string,
      submittedAt: string,
      totalPrice: number,
      items: SubmittedWorkItem[]
    }> = {};

    submittedWorks.forEach(work => {
      const key = `${work.barberName}_${work.submittedAt}`;
      if (!groups[key]) {
        groups[key] = {
          id: key,
          barberName: work.barberName,
          submittedAt: work.submittedAt,
          totalPrice: 0,
          items: [],
        };
      }
      groups[key].totalPrice += work.price;
      groups[key].items.push(work);
    });

    return Object.values(groups).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [submittedWorks]);

  // Shop Settings states
  const [shopSettingsVisible, setShopSettingsVisible] = React.useState(false);
  const [shopInfo, setShopInfo] = React.useState<ShopInfo | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const loadStats = async () => {
        setLoading(true);
        const [data, works, shop] = await Promise.all([
          getDashboardStats(),
          getSubmittedWorks(50),
          getShopInfo()
        ]);
        if (isActive) {
          setDashboardData(data);
          setSubmittedWorks(works);
          setShopInfo(shop);
          setLoading(false);
        }
      };
      
      loadStats();

      // Realtime sync for shop profile updates
      const unsubscribe = subscribeToShopUpdates((updated) => {
        if (isActive) setShopInfo(updated);
      });

      return () => { 
        isActive = false; 
        unsubscribe();
      };
    }, [])
  );

  const weeklyRevenue = dashboardData?.weeklyRevenue || [
    { day: "อา", amount: 0 },
    { day: "จ", amount: 0 },
    { day: "อ", amount: 0 },
    { day: "พ", amount: 0 },
    { day: "พฤ", amount: 0 },
    { day: "ศ", amount: 0 },
    { day: "ส", amount: 0 },
  ];
  const maxRev = Math.max(...weeklyRevenue.map((r) => r.amount), 100);

  const stats = [
    { label: "รายได้วันนี้", value: `฿${dashboardData?.totalRevenue.toLocaleString() || 0}`, icon: DollarSign, change: `+${dashboardData?.revenueGrowth || 0}%`, colors: ["#F59E0B", "#D97706"] as const, type: "today" },
    { label: "จองวันนี้", value: `${dashboardData?.bookingsToday || 0}`, icon: Calendar, change: `+${dashboardData?.bookingsGrowth || 0}`, colors: ["#10B981", "#059669"] as const, type: "today" },
    { label: "ลูกค้าทั้งหมด", value: `${dashboardData?.totalCustomers || 0}`, icon: Users, change: `+${dashboardData?.customersGrowth || 0}`, colors: ["#3B82F6", "#2563EB"] as const, type: "customers" },
    { label: "รายได้เดือนนี้", value: `฿${dashboardData?.revenueThisMonth.toLocaleString() || 0}`, icon: TrendingUp, change: `+${dashboardData?.monthlyGrowth || 0}%`, colors: ["#8B5CF6", "#6D28D9"] as const, type: "month" },
  ];

  return (
    <ImageBackground
      source={
        shopInfo?.coverUrl
          ? { uri: shopInfo.coverUrl }
          : require("../../../assets/13.jpg")
      }
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <CustomHeader roleLabel="เจ้าของร้าน" onLogout={() => confirmLogout(navigation, "StaffLogin")} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Shop Profile & Settings Card */}
        <LinearGradient
          colors={["rgba(30, 41, 59, 0.95)", "rgba(15, 23, 42, 0.95)"]}
          style={styles.shopCard}
        >
          <View style={styles.shopCardTop}>
            <View style={styles.shopLogoWrap}>
              {shopInfo?.logoUrl ? (
                <Image source={{ uri: shopInfo.logoUrl }} style={styles.shopLogo} resizeMode="cover" />
              ) : (
                <Image
                  source={require("../../../assets/sawasdee_logo.jpg")}
                  style={styles.shopLogo}
                  resizeMode="cover"
                />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.shopBadgeRow}>
                <View style={styles.shopLiveDot} />
                <Text style={styles.shopBadgeText}>ร้านค้าที่จัดการอยู่</Text>
              </View>
              <Text style={styles.shopName} numberOfLines={1}>
                {shopInfo?.name || "ร้านตัดผม"}
              </Text>
              <Text style={styles.shopSub} numberOfLines={1}>
                {shopInfo?.subtitle || "ระบบจองคิวออนไลน์"}
              </Text>
            </View>
          </View>

          <View style={styles.shopCardDivider} />

          <View style={styles.shopCardBottom}>
            <View style={styles.shopContactCol}>
              <Text style={styles.shopContactText} numberOfLines={1}>
                📞 {shopInfo?.phone || "090-360-3093"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editShopBtn}
              activeOpacity={0.85}
              onPress={() => setShopSettingsVisible(true)}
            >
              <LinearGradient
                colors={["#FBBF24", "#F59E0B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.editShopBtnGrad}
              >
                <Edit3 size={14} color="#0F172A" />
                <Text style={styles.editShopBtnText}>เปลี่ยนชื่อ / รูปภาพร้าน</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <Text style={styles.title}>แดชบอร์ดภาพรวม</Text>

        {/* Stats Grid */}
        {loading ? (
          <Text style={{ textAlign: "center", marginVertical: 20, color: colors.textMuted }}>กำลังโหลดข้อมูล...</Text>
        ) : (
          <View style={styles.statsGrid}>
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <TouchableOpacity 
                  key={s.label} 
                  style={styles.statCardContainer}
                  activeOpacity={0.7}
                  onPress={() => handleCardPress(s.type as any)}
                >
                  <LinearGradient
                    colors={["rgba(30, 41, 59, 0.9)", "rgba(15, 23, 42, 0.95)"]}
                    style={styles.statCard}
                  >
                    <View style={styles.statHeader}>
                      <View style={[styles.iconWrapper, { backgroundColor: `${s.colors[0]}33` }]}>
                        <Icon size={20} color={s.colors[0]} />
                      </View>
                      <View style={[styles.changeBadge, { backgroundColor: `${s.colors[0]}22` }]}>
                        <Text style={[styles.changeText, { color: s.colors[0] }]}>{s.change}</Text>
                      </View>
                    </View>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Weekly Revenue Bar Chart */}
        <View style={styles.glassCard}>
          <Text style={styles.cardSectionTitle}>รายได้รายสัปดาห์</Text>
          <View style={styles.chartContainer}>
            {weeklyRevenue.map((item, idx) => {
              const heightPct = (item.amount / maxRev) * 100;
              return (
                <View key={item.day + idx} style={styles.barColumn}>
                  <Text style={styles.barVal}>฿{item.amount >= 1000 ? (item.amount / 1000).toFixed(1) + 'k' : item.amount}</Text>
                  <View style={styles.barTrack}>
                    <LinearGradient
                      colors={["#FBBF24", "#F59E0B"]}
                      style={[
                        styles.barFill,
                        { height: `${heightPct}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.barDay}>{item.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Barber Performance Share */}
        <View style={styles.glassCard}>
          <Text style={styles.cardSectionTitle}>สัดส่วนงานช่าง</Text>
          {loading ? (
            <Text style={{ color: colors.textMuted }}>กำลังโหลดข้อมูล...</Text>
          ) : dashboardData?.barberStats && dashboardData?.barberStats?.length > 0 ? (
            <View>
              {dashboardData.barberStats.map((b, idx) => {
                const colorsList = ["#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"];
                const color = colorsList[idx % colorsList.length];
                return (
                  <TouchableOpacity 
                    key={b.name} 
                    style={styles.shareRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (b.id) {
                        handleCardPress("barber", b.id, b.name);
                      }
                    }}
                  >
                    <View style={[styles.avatarPlaceholder, { backgroundColor: `${color}33`, borderColor: color }]}>
                      <Text style={{ color, fontWeight: 'bold' }}>{b.name.substring(0, 1)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.shareBarberName}>{b.name}</Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>{b.percentage}% ของยอดทั้งหมด</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.shareValue}>฿{b.revenue.toLocaleString()}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Users size={32} color="#475569" style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.textMuted }}>ยังไม่มีข้อมูลรายได้ช่าง</Text>
            </View>
          )}
        </View>

        {/* Recently Submitted Works */}
        <View style={[styles.glassCard, { marginBottom: 30 }]}>
          <Text style={styles.cardSectionTitle}>รายการส่งยอดล่าสุด</Text>
          {loading ? (
            <Text style={{ color: colors.textMuted }}>กำลังโหลดข้อมูล...</Text>
          ) : groupedWorks && groupedWorks.length > 0 ? (
            <View>
              {groupedWorks.map((group, idx) => {
                const isExpanded = !!expandedSubmissions[group.id];
                return (
                  <View key={group.id} style={[styles.shareRow, { flexDirection: 'column', alignItems: 'stretch' }, idx === groupedWorks.length - 1 && !isExpanded && { borderBottomWidth: 0 }]}>
                    
                    <TouchableOpacity 
                      style={{ flexDirection: 'row', alignItems: 'center' }} 
                      onPress={() => toggleExpand(group.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.submitIconWrapper}>
                        <DollarSign size={18} color="#10B981" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 15, fontWeight: "bold", color: "#FFFFFF" }}>{group.barberName}</Text>
                        <Text style={{ fontSize: 12, color: "#94A3B8" }}>ส่งยอด {group.items.length} รายการ</Text>
                      </View>
                      <View style={{ alignItems: "flex-end", marginRight: 12 }}>
                        <Text style={{ fontSize: 15, fontWeight: "bold", color: "#10B981" }}>+฿{group.totalPrice.toLocaleString()}</Text>
                        <Text style={{ fontSize: 11, color: "#64748B" }}>{new Date(group.submittedAt).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} น.</Text>
                      </View>
                      {isExpanded ? <ChevronUp size={20} color="#94A3B8" /> : <ChevronDown size={20} color="#94A3B8" />}
                    </TouchableOpacity>
                    
                    {isExpanded && (
                      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255, 255, 255, 0.05)", paddingLeft: 48, paddingRight: 32 }}>
                        {group.items.map((item, i) => (
                          <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: i === group.items.length - 1 ? 0 : 8 }}>
                            <View>
                              <Text style={{ fontSize: 13, color: "#E2E8F0", fontWeight: '500' }}>{item.customerName}</Text>
                              <Text style={{ fontSize: 11, color: "#64748B" }}>{item.serviceName} • {new Date(item.date).toLocaleDateString('th-TH')}</Text>
                            </View>
                            <Text style={{ fontSize: 13, color: "#10B981", fontWeight: 'bold' }}>฿{item.price}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <TrendingUp size={32} color="#475569" style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.textMuted }}>ยังไม่มีการส่งยอดจากช่าง</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal for Details */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === "customers" ? "รายชื่อลูกค้าทั้งหมด" : modalType === "today" ? "รายการจองวันนี้" : modalType === "barber" ? `ผลงาน: ${selectedBarberName}` : "รายการจองเดือนนี้"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X color="#94A3B8" size={24} />
              </TouchableOpacity>
            </View>
            
            {modalLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator color="#10B981" size="large" />
                <Text style={{ color: "#94A3B8", marginTop: 12 }}>กำลังโหลดข้อมูล...</Text>
              </View>
            ) : modalData.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: "#94A3B8" }}>ไม่มีข้อมูล</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {modalType === "customers" ? (
                  // Customers Table
                  <View>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderText, { flex: 2 }]}>ชื่อลูกค้า</Text>
                      <Text style={[styles.tableHeaderText, { flex: 2 }]}>เบอร์โทร</Text>
                      <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>วันที่สมัคร</Text>
                    </View>
                    {modalData.map((cust, i) => (
                      <View key={cust.id} style={[styles.tableRow, i === modalData.length - 1 && { borderBottomWidth: 0 }]}>
                        <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold', color: "#FFF" }]}>{cust.name}</Text>
                        <Text style={[styles.tableCell, { flex: 2 }]}>{cust.phone}</Text>
                        <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>{cust.joinedAt}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  // Bookings Table
                  <View>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderText, { flex: 2 }]}>ลูกค้า / ช่าง</Text>
                      <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>วันที่</Text>
                      <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>ยอด</Text>
                    </View>
                    {modalData.map((b, i) => (
                      <View key={b.id} style={[styles.tableRow, i === modalData.length - 1 && { borderBottomWidth: 0 }]}>
                        <View style={{ flex: 2 }}>
                          <Text style={{ color: "#FFF", fontWeight: 'bold', fontSize: 13 }}>{b.customerName}</Text>
                          <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                            {modalType === "barber" ? b.serviceName : `${b.barberName} • ${b.serviceName}`}
                          </Text>
                        </View>
                        <View style={{ flex: 1.5, justifyContent: 'center' }}>
                          <Text style={{ color: "#E2E8F0", fontSize: 12 }}>{new Date(b.date).toLocaleDateString('th-TH')}</Text>
                          <Text style={{ color: "#94A3B8", fontSize: 11 }}>{b.time} น.</Text>
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-end' }}>
                          <Text style={{ color: "#10B981", fontWeight: 'bold', fontSize: 14 }}>฿{b.price}</Text>
                          <Text style={{ color: b.status === "COMPLETED" ? "#10B981" : "#FBBF24", fontSize: 10 }}>{b.status}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Shop Profile & Photos Settings Modal */}
      <ShopSettingsModal
        visible={shopSettingsVisible}
        onClose={() => setShopSettingsVisible(false)}
        onSaved={(updated) => setShopInfo(updated)}
      />
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statCardContainer: {
    width: "48%",
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  statCard: {
    padding: 16,
    height: 110,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  changeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  changeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  glassCard: {
    backgroundColor: "rgba(30, 41, 59, 0.75)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 150,
    paddingTop: 10,
  },
  barColumn: {
    alignItems: "center",
    flex: 1,
  },
  barVal: {
    fontSize: 10,
    color: "#94A3B8",
    marginBottom: 6,
    fontWeight: "600",
  },
  barTrack: {
    width: 12,
    height: 90,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 6,
  },
  barDay: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 8,
    fontWeight: "bold",
  },
  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  shareBarberName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  shareValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  submitIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#1E293B",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    padding: 16,
  },
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  tableCell: {
    fontSize: 13,
    color: "#E2E8F0",
  },
  // Shop Card Styles
  shopCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  shopCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  shopLogoWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: "hidden",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
  },
  shopLogo: {
    width: "100%",
    height: "100%",
  },
  shopBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  shopLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#10B981",
  },
  shopBadgeText: {
    fontSize: 11,
    color: "#10B981",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  shopName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  shopSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  shopCardDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginVertical: 12,
  },
  shopCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  shopContactCol: {
    flex: 1,
  },
  shopContactText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  editShopBtn: {
    borderRadius: 10,
    overflow: "hidden",
  },
  editShopBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  editShopBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
});
