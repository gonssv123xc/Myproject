import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types/navigation";
import { LinearGradient } from "expo-linear-gradient";
import {
  Store,
  MapPin,
  Clock,
  Phone,
  Search,
  ChevronRight,
  Sparkles,
  LogOut,
  Scissors,
} from "lucide-react-native";
import { colors } from "../../theme/colors";
import {
  ShopInfo,
  getAllShops,
  setSelectedShopId,
  subscribeToShopUpdates,
  getShopLogoSource,
} from "../../services/shopService";
import { getCurrentProfile } from "../../services/authService";
import { confirmLogout } from "../../utils/logout";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "SelectShop">;
};

export const SelectShopScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const [shops, setShops] = useState<ShopInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerName, setCustomerName] = useState<string>("ลูกค้า");

  const loadShops = useCallback(async () => {
    setLoading(true);
    const [shopList, profile] = await Promise.all([
      getAllShops(),
      getCurrentProfile(),
    ]);
    setShops(shopList);
    if (profile?.firstName) {
      setCustomerName(profile.firstName);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadShops();

    // Subscribe to realtime shop additions / updates
    const unsubscribe = subscribeToShopUpdates(() => {
      loadShops();
    });

    return () => {
      unsubscribe();
    };
  }, [loadShops]);

  const handleSelectShop = async (shop: ShopInfo) => {
    await setSelectedShopId(shop.id);
    navigation.navigate("CustomerMain");
  };

  const filteredShops = shops.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.address && s.address.toLowerCase().includes(q)) ||
      (s.subtitle && s.subtitle.toLowerCase().includes(q))
    );
  });

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={["#0F172A", "#0B0F19", "#05070D"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <Image
              source={require("../../../assets/app_logo.jpg")}
              style={styles.platformLogo}
              resizeMode="cover"
            />
            <View>
              <Text style={styles.platformTitle}>จองคิวร้านตัดผม</Text>
              <Text style={styles.welcomeSub}>ยินดีต้อนรับคุณ {customerName}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => confirmLogout(navigation, "Login")}
            activeOpacity={0.7}
          >
            <LogOut size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Counter Badge: แจ้งจำนวนร้านทั้งหมดตามที่ผู้ใช้ต้องการ */}
        <View style={styles.counterBanner}>
          <LinearGradient
            colors={["rgba(245, 158, 11, 0.2)", "rgba(245, 158, 11, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.counterGrad}
          >
            <View style={styles.counterDot} />
            <Text style={styles.counterText}>
              มีร้านตัดผมเปิดให้บริการในระบบขณะนี้{" "}
              <Text style={styles.counterNum}>{shops.length}</Text> ร้าน
            </Text>
          </LinearGradient>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrap}>
          <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาชื่อร้านตัดผม หรือ ย่านที่ตั้ง..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Main List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeaderRow}>
          <Store size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>เลือกร้านที่ต้องการรับบริการ</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>กำลังค้นหาร้านตัดผม...</Text>
          </View>
        ) : filteredShops.length === 0 ? (
          <View style={styles.emptyBox}>
            <Store size={48} color="#475569" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>ไม่พบร้านตัดผมที่ค้นหา</Text>
            <Text style={styles.emptySub}>ลองเปลี่ยนคำค้นหา หรือค้นหาใหม่อีกครั้ง</Text>
          </View>
        ) : (
          filteredShops.map((shop, index) => {
            return (
              <TouchableOpacity
                key={shop.id}
                style={styles.shopCardContainer}
                activeOpacity={0.88}
                onPress={() => handleSelectShop(shop)}
              >
                <LinearGradient
                  colors={["rgba(30, 41, 59, 0.8)", "rgba(15, 23, 42, 0.95)"]}
                  style={styles.shopCard}
                >
                  {/* Shop Top Row */}
                  <View style={styles.shopTopRow}>
                    <View style={styles.shopLogoBox}>
                      <Image
                        source={getShopLogoSource(shop, index)}
                        style={styles.shopLogo}
                        resizeMode="cover"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.shopBadgeRow}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>เปิดให้บริการ</Text>
                      </View>
                      <Text style={styles.shopName} numberOfLines={1}>
                        {shop.name}
                      </Text>
                      <Text style={styles.shopSubtitle} numberOfLines={1}>
                        {shop.subtitle || "ระบบจองคิวออนไลน์"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Shop Meta Info */}
                  <View style={styles.metaCol}>
                    <View style={styles.metaRow}>
                      <MapPin size={14} color={colors.primary} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {shop.address || "อำเภอเมือง บุรีรัมย์"}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Clock size={14} color="#94A3B8" />
                      <Text style={styles.metaText}>
                        เวลาทำการ: {shop.openHours || "09:00 – 19:00"}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Phone size={14} color="#94A3B8" />
                      <Text style={styles.metaText}>
                        เบอร์ติดต่อ: {shop.phone || "090-360-3093"}
                      </Text>
                    </View>
                  </View>

                  {/* Select Button */}
                  <View style={styles.actionRow}>
                    <LinearGradient
                      colors={["#FBBF24", "#F59E0B"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.selectBtn}
                    >
                      <Scissors size={15} color="#0F172A" />
                      <Text style={styles.selectBtnText}>เลือกร้านนี้ & จองคิว</Text>
                      <ChevronRight size={16} color="#0F172A" />
                    </LinearGradient>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080C1A",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  platformLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(245, 158, 11, 0.5)",
  },
  platformTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  welcomeSub: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
    fontWeight: "500",
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  counterBanner: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  counterGrad: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  counterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  counterText: {
    fontSize: 13,
    color: "#E2E8F0",
    fontWeight: "500",
  },
  counterNum: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 15,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loadingBox: {
    padding: 50,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  emptyBox: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30, 41, 59, 0.4)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
  },
  shopCardContainer: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  shopCard: {
    padding: 16,
  },
  shopTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  shopLogoBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 1.5,
    borderColor: "rgba(245, 158, 11, 0.4)",
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
  },
  shopName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  shopSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginVertical: 12,
  },
  metaCol: {
    gap: 6,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: "#CBD5E1",
    flex: 1,
  },
  actionRow: {
    borderRadius: 12,
    overflow: "hidden",
  },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  selectBtnText: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
});
