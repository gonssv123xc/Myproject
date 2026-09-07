import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  useWindowDimensions,
  Modal,
  Animated,
  Linking,
  Platform,
} from "react-native";
import {
  Scissors, Calendar, Clock, ChevronRight, Tag, Zap, Gift,
  Star, MapPin, Phone, Clock3, ExternalLink, X, Sparkles, Info,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { CustomerTabParamList } from "../../types/navigation";
import { colors } from "../../theme/colors";
import { CustomHeader } from "../../components/CustomHeader";
import { CustomCard } from "../../components/CustomCard";
import { confirmLogout } from "../../utils/logout";
import { getUpcomingBookings, Booking } from "../../services/bookingService";
import { getCurrentProfile } from "../../services/authService";
import { useFocusEffect } from "@react-navigation/native";

// ─── Types ─────────────────────────────────────────────
type Promotion = {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  desc: string;
  detail: string;
  gradientColors: readonly [string, string];
  accentColor: string;
  icon: any;
};

// ─── Data ───────────────────────────────────────────────
const PROMOTIONS: Promotion[] = [
  {
    id: "1",
    badge: "🔥 ดีลพิเศษ",
    title: "ตัดผม + สระผม",
    subtitle: "เฉพาะเดือนนี้เท่านั้น!",
    desc: "ประหยัดสูงสุด 30% เมื่อจองแพ็กเกจคู่",
    detail: "จองแพ็กเกจตัดผมพร้อมสระผม รับส่วนลดทันที 30% เพียงแจ้งโปรโมชั่นนี้ตอนจอง มีระยะเวลาจำกัดถึงสิ้นเดือนนี้เท่านั้น ไม่ควรพลาด!",
    gradientColors: ["#7C3AED", "#4338CA"] as const,
    accentColor: "#C4B5FD",
    icon: Zap,
  },
  {
    id: "2",
    badge: "🎁 สมาชิกใหม่",
    title: "ส่วนลด 50 บาท",
    subtitle: "สำหรับการจองครั้งแรก",
    desc: "ใช้โค้ด NEWCUT50 ตอนยืนยันการจอง",
    detail: "ลูกค้าใหม่รับส่วนลดทันที 50 บาท สำหรับการจองครั้งแรก กรอกโค้ด NEWCUT50 ในช่องโค้ดส่วนลดขั้นตอนที่ 3 ของการจองคิว ใช้ได้ 1 ครั้งต่อบัญชี",
    gradientColors: ["#BE185D", "#9D174D"] as const,
    accentColor: "#FBCFE8",
    icon: Gift,
  },
  {
    id: "3",
    badge: "⭐ แพ็กเกจพรีเมียม",
    title: "ตัด + แต่งเครา",
    subtitle: "แพ็กเกจยอดนิยมประจำเดือน",
    desc: "บริการพรีเมียมจากช่างมืออาชีพ เริ่ม 199 บาท",
    detail: "แพ็กเกจตัดผม + แต่งเครา โดยช่างผมมืออาชีพ ราคาเริ่มต้นเพียง 199 บาท รวมการล้างหน้าและนวดศีรษะ ใช้เวลาประมาณ 60-90 นาที จองล่วงหน้าเพื่อรับประกันคิว",
    gradientColors: ["#B45309", "#92400E"] as const,
    accentColor: "#FDE68A",
    icon: Star,
  },
  {
    id: "4",
    badge: "📱 จองล่วงหน้า",
    title: "จองออนไลน์ลด 20%",
    subtitle: "สะดวกกว่า ไม่ต้องรอคิว",
    desc: "จองคิวผ่านระบบวันนี้ ลดทันที 20% ทุกบริการ",
    detail: "โปรโมชั่นพิเศษสำหรับลูกค้าที่จองคิวผ่านระบบออนไลน์ ลดทันที 20% ทุกบริการ ไม่ต้องใช้โค้ด ระบบจะคำนวณส่วนลดอัตโนมัติเมื่อชำระเงินที่ร้าน ช่วยให้คุณไม่ต้องเสียเวลารอคิว!",
    gradientColors: ["#065F46", "#064E3B"] as const,
    accentColor: "#6EE7B7",
    icon: Tag,
  },
];

const HOURS = [
  { day: "จ. – ศ.", open: 9, close: 19, label: "09:00 – 19:00" },
  { day: "เสาร์",   open: 9, close: 20, label: "09:00 – 20:00" },
  { day: "อาทิตย์", open: 10, close: 18, label: "10:00 – 18:00" },
];

// ─── Brand SVG Icons ────────────────────────────────────
const FacebookIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
  </Svg>
);

const InstagramIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" fill="#E1306C" />
  </Svg>
);

const LINEIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" fill="#06C755" />
  </Svg>
);

const TikTokIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" fill="#FFFFFF" />
  </Svg>
);

// ─── Promo Detail Modal ──────────────────────────────────
const PromoModal: React.FC<{
  promo: Promotion | null;
  onClose: () => void;
  onBook: () => void;
}> = ({ promo, onClose, onBook }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    if (promo) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(80);
    }
  }, [promo]);

  if (!promo) return null;
  const IconComp = promo.icon;

  return (
    <Modal transparent animationType="none" visible={!!promo} onRequestClose={onClose}>
      <Animated.View style={[ms.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[ms.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient
            colors={promo.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={ms.header}
          >
            <View style={[ms.decBall, { top: -40, right: -40, width: 160, height: 160 }]} />
            <View style={[ms.decBall, { bottom: -30, left: -30, width: 100, height: 100 }]} />
            <TouchableOpacity style={ms.closeBtn} onPress={onClose}>
              <X size={18} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
            <View style={[ms.iconCircle, { backgroundColor: `${promo.accentColor}30` }]}>
              <IconComp size={32} color={promo.accentColor} />
            </View>
            <Text style={ms.headerBadge}>{promo.badge}</Text>
            <Text style={ms.headerTitle}>{promo.title}</Text>
            <Text style={[ms.headerSub, { color: promo.accentColor }]}>{promo.subtitle}</Text>
          </LinearGradient>
          <View style={ms.body}>
            <View style={ms.detailBox}>
              <Info size={16} color={colors.primary} style={{ marginTop: 1 }} />
              <Text style={ms.detailText}>{promo.detail}</Text>
            </View>
            <TouchableOpacity style={ms.bookBtn} onPress={onBook} activeOpacity={0.85}>
              <LinearGradient
                colors={["#FBBF24", "#F59E0B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={ms.bookBtnGrad}
              >
                <Scissors size={18} color="#0F172A" />
                <Text style={ms.bookBtnText}>จองคิวตอนนี้</Text>
                <ChevronRight size={18} color="#0F172A" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ─── Promotion Carousel ──────────────────────────────────
const PromotionCarousel: React.FC<{
  width: number;
  onPromoPress: (p: Promotion) => void;
}> = ({ width, onPromoPress }) => {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const cardWidth = Math.min(width - 64, 500);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((idx: number) => {
    const safe = Math.min(Math.max(idx, 0), PROMOTIONS.length - 1);
    scrollRef.current?.scrollTo({ x: safe * (cardWidth + 14), animated: true });
    setActiveIndex(safe);
  }, [cardWidth]);

  const startAutoScroll = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % PROMOTIONS.length;
        scrollRef.current?.scrollTo({ x: next * (cardWidth + 14), animated: true });
        return next;
      });
    }, 3500);
  }, [cardWidth]);

  useEffect(() => {
    startAutoScroll();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startAutoScroll]);

  return (
    <View>
      <View style={cs.sectionRow}>
        <View style={cs.sectionIconWrap}>
          <Sparkles size={13} color={colors.primary} />
        </View>
        <Text style={cs.sectionHeading}>โปรโมชั่น {"&"} แคมเปญ</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        decelerationRate="fast"
        snapToInterval={cardWidth + 14}
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => {
          if (timerRef.current) clearInterval(timerRef.current);
        }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (cardWidth + 14));
          setActiveIndex(Math.min(Math.max(idx, 0), PROMOTIONS.length - 1));
          startAutoScroll();
        }}
        scrollEventThrottle={16}
        contentContainerStyle={{ gap: 14, paddingRight: 24 }}
      >
        {PROMOTIONS.map((promo) => {
          const IconComp = promo.icon;
          return (
            <TouchableOpacity
              key={promo.id}
              activeOpacity={0.88}
              style={[cs.promoCard, { width: cardWidth }]}
              onPress={() => onPromoPress(promo)}
            >
              <LinearGradient
                colors={promo.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={cs.promoGrad}
              >
                <View style={[cs.decBall, { top: -50, right: -50, width: 160, height: 160, opacity: 0.1 }]} />
                <View style={[cs.decBall, { bottom: -30, left: 60, width: 100, height: 100, opacity: 0.07 }]} />
                <View style={cs.promoTopRow}>
                  <View style={[cs.promoIconWrap, { backgroundColor: `${promo.accentColor}28` }]}>
                    <IconComp size={20} color={promo.accentColor} />
                  </View>
                  <View style={[cs.promoBadge, { borderColor: `${promo.accentColor}60`, backgroundColor: `${promo.accentColor}20` }]}>
                    <Text style={[cs.promoBadgeText, { color: promo.accentColor }]}>{promo.badge}</Text>
                  </View>
                </View>
                <Text style={cs.promoTitle}>{promo.title}</Text>
                <Text style={[cs.promoSub, { color: promo.accentColor }]}>{promo.subtitle}</Text>
                <Text style={cs.promoDesc}>{promo.desc}</Text>
                <View style={[cs.promoCTA, { borderTopColor: `${promo.accentColor}30` }]}>
                  <Text style={[cs.promoCTAText, { color: promo.accentColor }]}>กดดูรายละเอียด</Text>
                  <ChevronRight size={13} color={promo.accentColor} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={cs.dotsRow}>
        {PROMOTIONS.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => goTo(i)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <View style={[cs.dot, i === activeIndex && cs.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── Shop Status Helper ──────────────────────────────────
const computeShopStatus = () => {
  const now = new Date();
  const day = now.getDay();
  const h = now.getHours() + now.getMinutes() / 60;
  const isOpen =
    (day >= 1 && day <= 5 && h >= 9 && h < 19) ||
    (day === 6 && h >= 9 && h < 20) ||
    (day === 0 && h >= 10 && h < 18);
  const todayHours = HOURS[day === 0 ? 2 : day === 6 ? 1 : 0];
  return { isOpen, todayHours };
};

// ─── Shop Info Footer ────────────────────────────────────
const ShopInfoFooter: React.FC = () => {
  const [shopStatus, setShopStatus] = useState(computeShopStatus);

  useEffect(() => {
    const t = setInterval(() => setShopStatus(computeShopStatus()), 60_000);
    return () => clearInterval(t);
  }, []);

  const { isOpen, todayHours } = shopStatus;

  const openMaps = () => {
    const query = encodeURIComponent("ร้านตัดผมบ้านจาร ถนนจิระ บุรีรัมย์");
    const lat = 15.0;
    const lng = 102.9167;
    const url = Platform.OS === "ios"
      ? `maps://?q=${query}&ll=${lat},${lng}`
      : `geo:${lat},${lng}?q=${query}`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://maps.google.com/maps?q=${query}`)
    );
  };

  const socialLinks = [
    { label: "Facebook",  Icon: FacebookIcon,  color: "#60A5FA", bg: "rgba(24,119,242,0.22)", border: "rgba(96,165,250,0.5)",   url: "https://www.facebook.com/profile.php?id=100063824452415" },
    { label: "Instagram", Icon: InstagramIcon, color: "#F472B6", bg: "rgba(225,48,108,0.22)", border: "rgba(244,114,182,0.5)", url: "https://instagram.com" },
    { label: "LINE",      Icon: LINEIcon,      color: "#4ADE80", bg: "rgba(6,199,85,0.22)",   border: "rgba(74,222,128,0.5)",  url: "https://line.me" },
    { label: "TikTok",   Icon: TikTokIcon,    color: "#E2E8F0", bg: "rgba(255,255,255,0.12)",border: "rgba(255,255,255,0.28)", url: "https://tiktok.com" },
  ];

  return (
    <View style={fs.container}>
      {/* Header */}
      <View style={fs.headerRow}>
        <Image
          source={require("../../../assets/sawasdee_logo.jpg")}
          style={fs.logo}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <Text style={fs.shopName}>ร้านตัดผมบ้านจาร</Text>
          <View style={fs.statusPill}>
            <View style={[fs.statusDot, { backgroundColor: isOpen ? "#4ADE80" : "#F87171" }]} />
            <Text style={[fs.statusText, { color: isOpen ? "#4ADE80" : "#F87171" }]}>
              {isOpen ? "เปิดให้บริการอยู่" : "ปิดให้บริการแล้ว"}
            </Text>
            <Text style={fs.statusSep}>·</Text>
            <Text style={fs.todayHoursText}>{todayHours.label}</Text>
          </View>
        </View>
      </View>

      <View style={fs.divider} />

      {/* Hours */}
      <View style={fs.section}>
        <View style={fs.sectionHead}>
          <Clock3 size={13} color={colors.primary} />
          <Text style={fs.sectionTitle}>เวลาเปิด-ปิดร้าน</Text>
        </View>
        <View style={fs.hoursGrid}>
          {HOURS.map((h) => {
            const now = new Date();
            const day = now.getDay();
            const isToday =
              (h.day === "จ. – ศ." && day >= 1 && day <= 5) ||
              (h.day === "เสาร์" && day === 6) ||
              (h.day === "อาทิตย์" && day === 0);
            return (
              <View key={h.day} style={[fs.hoursRow, isToday && fs.hoursRowToday]}>
                <Text style={[fs.hoursDay, isToday && fs.hoursDayActive]}>{h.day}</Text>
                <Text style={[fs.hoursTime, isToday && { color: colors.primary }]}>{h.label}</Text>
                {isToday && (
                  <View style={fs.todayBadge}>
                    <Text style={fs.todayBadgeText}>วันนี้</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <View style={fs.divider} />

      {/* Location & Phone */}
      <View style={fs.section}>
        <View style={fs.sectionHead}>
          <MapPin size={13} color={colors.primary} />
          <Text style={fs.sectionTitle}>ที่ตั้งและติดต่อ</Text>
        </View>
        <TouchableOpacity style={fs.infoCard} onPress={openMaps} activeOpacity={0.75}>
          <View style={fs.infoIconBox}>
            <MapPin size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={fs.infoMain}>ถนน จิระ ตำบล ในเมือง</Text>
            <Text style={fs.infoSub}>อ.เมืองบุรีรัมย์ บุรีรัมย์ 31000</Text>
          </View>
          <View style={fs.extBadge}>
            <ExternalLink size={12} color={colors.primary} />
            <Text style={fs.extText}>Maps</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={fs.infoCard}
          onPress={() => Linking.openURL("tel:0903603093")}
          activeOpacity={0.75}
        >
          <View style={fs.infoIconBox}>
            <Phone size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={fs.infoMain}>090-360-3093</Text>
            <Text style={fs.infoSub}>โทรจองคิวหรือสอบถาม</Text>
          </View>
          <View style={fs.extBadge}>
            <Phone size={12} color={colors.primary} />
            <Text style={fs.extText}>โทร</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={fs.divider} />

      {/* Social */}
      <View style={fs.section}>
        <View style={fs.sectionHead}>
          <Sparkles size={13} color={colors.primary} />
          <Text style={fs.sectionTitle}>ติดตามเราได้ที่</Text>
        </View>
        <View style={fs.socialGrid}>
          {socialLinks.map((s) => {
            const IconComp = s.Icon;
            return (
              <TouchableOpacity
                key={s.label}
                style={[fs.socialBtn, { backgroundColor: s.bg, borderColor: s.border }]}
                onPress={() => Linking.openURL(s.url)}
                activeOpacity={0.75}
              >
                <IconComp size={18} />
                <Text style={[fs.socialLabel, { color: s.color }]}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Text style={fs.footNote}>© 2025 บ้านจาร Barbershop · All rights reserved</Text>
    </View>
  );
};

// ═══════════════════════════════════════════════════════
//  Main Screen
// ═══════════════════════════════════════════════════════
type Props = {
  navigation: BottomTabNavigationProp<CustomerTabParamList, "CustomerHome">;
};

export const CustomerHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [customerName, setCustomerName] = useState<string>("ลูกค้า");
  const [loading, setLoading] = useState(true);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchData = async () => {
        setLoading(true);
        const profile = await getCurrentProfile();
        if (profile && isActive) {
          setCustomerName(profile.firstName || "ลูกค้า");
          const data = await getUpcomingBookings(profile.id);
          if (isActive) setUpcomingBookings(data);
        }
        if (isActive) setLoading(false);
      };
      fetchData();
      return () => { isActive = false; };
    }, [])
  );

  return (
    <ImageBackground
      source={require("../../../assets/13.jpg")}
      style={sc.container}
      resizeMode="cover"
    >
      <View style={sc.overlay} />
      <CustomHeader roleLabel={customerName} onLogout={() => confirmLogout(navigation, "Login")} />

      <ScrollView contentContainerStyle={sc.scroll} showsVerticalScrollIndicator={false}>
        {/* Promotions */}
        <View style={sc.carouselWrap}>
          <PromotionCarousel width={width} onPromoPress={setSelectedPromo} />
        </View>

        <View style={[sc.contentWrap, isDesktop && sc.contentDesktop]}>
          {/* Left / Top */}
          <View style={isDesktop ? sc.leftCol : sc.fullCol}>
            <View style={sc.welcomeBox}>
              <Text style={sc.welcomeTitle}>
                สวัสดีครับ{" "}
                <Text style={sc.welcomeName}>{customerName}!</Text>
                {"  "}👋
              </Text>
              <Text style={sc.welcomeSub}>พร้อมจองคิวตัดผมหรือยัง?</Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate("Booking")} activeOpacity={0.87}>
              <LinearGradient
                colors={["#FBBF24", "#F59E0B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={sc.bookBanner}
              >
                <View style={sc.bookDecCircle} />
                <View style={sc.bookLeft}>
                  <View style={sc.bookIconWrap}>
                    <Scissors size={28} color="#FFF" />
                  </View>
                  <View>
                    <Text style={sc.bookTitle}>จองคิวตัดผม</Text>
                    <Text style={sc.bookSub}>เลือกบริการ ช่าง วัน เวลา</Text>
                  </View>
                </View>
                <View style={sc.bookArrow}>
                  <ChevronRight size={20} color="#F59E0B" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Right / Bottom */}
          <View style={isDesktop ? sc.rightCol : sc.fullCol}>
            <View style={sc.queueHeader}>
              <Text style={sc.queueTitle}>คิวที่กำลังจะมาถึง</Text>
              <TouchableOpacity onPress={() => navigation.navigate("History")} style={sc.seeAll}>
                <Text style={sc.seeAllText}>ดูประวัติ</Text>
                <ChevronRight size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={sc.emptyBox}>
                <Text style={sc.emptyText}>กำลังโหลดข้อมูล…</Text>
              </View>
            ) : upcomingBookings.length === 0 ? (
              <View style={sc.emptyBox}>
                <Calendar size={44} color="#475569" strokeWidth={1.5} style={{ marginBottom: 12 }} />
                <Text style={sc.emptyText}>ยังไม่มีคิวที่รอรับบริการ</Text>
                <Text style={sc.emptySub}>กดปุ่ม "จองคิวตัดผม" เพื่อเริ่มจองได้เลยครับ</Text>
              </View>
            ) : (
              upcomingBookings.map((item) => (
                <CustomCard key={item.id}>
                  <View style={sc.cardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={sc.svcName}>{item.serviceName}</Text>
                      <Text style={sc.barberName}>ช่าง: {item.barberName}</Text>
                      <View style={sc.metaRow}>
                        <View style={sc.metaChip}>
                          <Calendar size={12} color={colors.textMuted} />
                          <Text style={sc.metaText}>
                            {new Date(item.date).toLocaleDateString("th-TH")}
                          </Text>
                        </View>
                        <View style={sc.metaChip}>
                          <Clock size={12} color={colors.textMuted} />
                          <Text style={sc.metaText}>{item.startTime} น.</Text>
                        </View>
                      </View>
                    </View>
                    <View
                      style={[
                        sc.statusBadge,
                        item.status === "PENDING" && {
                          backgroundColor: colors.warningBg,
                          borderColor: colors.warning,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          sc.statusText,
                          item.status === "PENDING" && { color: colors.warning },
                        ]}
                      >
                        {item.status === "PENDING"
                          ? "รอยืนยัน"
                          : item.status === "CONFIRMED"
                          ? "ยืนยันแล้ว"
                          : "กำลังดำเนินการ"}
                      </Text>
                    </View>
                  </View>
                </CustomCard>
              ))
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={sc.footerWrap}>
          <ShopInfoFooter />
        </View>
      </ScrollView>

      <PromoModal
        promo={selectedPromo}
        onClose={() => setSelectedPromo(null)}
        onBook={() => {
          setSelectedPromo(null);
          navigation.navigate("Booking");
        }}
      />
    </ImageBackground>
  );
};

// ═══════════════════════════════════════════════════════
//  StyleSheets
// ═══════════════════════════════════════════════════════

const sc = StyleSheet.create({
  container: { flex: 1, width: "100%", height: "100%" },
  overlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(10,15,30,0.72)" },
  scroll: { paddingTop: 20, paddingBottom: 40, flexGrow: 1 },
  carouselWrap: { paddingHorizontal: 24, marginBottom: 28 },
  contentWrap: { width: "100%", maxWidth: 800, alignSelf: "center", paddingHorizontal: 24 },
  contentDesktop: { flexDirection: "row", gap: 40, alignItems: "flex-start" },
  leftCol: { width: 420 },
  rightCol: { flex: 1 },
  fullCol: { width: "100%" },
  welcomeBox: { marginBottom: 20 },
  welcomeTitle: { fontSize: 26, fontWeight: "700", color: "#CBD5E1" },
  welcomeName: { fontWeight: "900", color: colors.primary },
  welcomeSub: { fontSize: 15, color: "#64748B", marginTop: 6 },
  bookBanner: {
    borderRadius: 22, padding: 22,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 36, overflow: "hidden",
    shadowColor: "#FBBF24", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  bookDecCircle: {
    position: "absolute", top: -40, right: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  bookLeft: { flexDirection: "row", alignItems: "center", gap: 16 },
  bookIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center", justifyContent: "center",
  },
  bookTitle: { fontSize: 20, fontWeight: "900", color: "#FFF", letterSpacing: 0.3 },
  bookSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 3 },
  bookArrow: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#FFF", alignItems: "center", justifyContent: "center",
  },
  queueHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  queueTitle: { fontSize: 17, fontWeight: "800", color: "#F1F5F9", letterSpacing: 0.3 },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 3 },
  seeAllText: { fontSize: 12, color: colors.primary, fontWeight: "700" },
  emptyBox: {
    alignItems: "center", justifyContent: "center",
    paddingVertical: 48, paddingHorizontal: 24,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
  },
  emptyText: { fontSize: 15, color: "#94A3B8", fontWeight: "700" },
  emptySub: { fontSize: 13, color: "#475569", marginTop: 8, textAlign: "center" },
  cardRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  svcName: { fontSize: 15, fontWeight: "700", color: colors.text },
  barberName: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  metaRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, color: colors.textMuted },
  statusBadge: {
    backgroundColor: colors.successBg, borderColor: colors.success,
    borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  statusText: { fontSize: 11, color: colors.success, fontWeight: "700" },
  footerWrap: { paddingHorizontal: 24, paddingBottom: 24, marginTop: 16 },
});

const cs = StyleSheet.create({
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14 },
  sectionIconWrap: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: "rgba(251,191,36,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  sectionHeading: { fontSize: 13, fontWeight: "800", color: colors.primary, letterSpacing: 1, textTransform: "uppercase" },
  promoCard: {
    borderRadius: 22, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  promoGrad: { padding: 22, minHeight: 170, overflow: "hidden", position: "relative" },
  decBall: { position: "absolute", borderRadius: 999, backgroundColor: "#FFFFFF" },
  promoTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  promoIconWrap: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  promoBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 4 },
  promoBadgeText: { fontSize: 11, fontWeight: "800" },
  promoTitle: { fontSize: 24, fontWeight: "900", color: "#FFFFFF", letterSpacing: 0.2 },
  promoSub: { fontSize: 13, fontWeight: "700", marginTop: 2, marginBottom: 8 },
  promoDesc: { fontSize: 13, color: "rgba(255,255,255,0.78)", lineHeight: 20 },
  promoCTA: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 14, paddingTop: 12, borderTopWidth: 1 },
  promoCTAText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },
  dotsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)" },
  dotActive: { width: 22, backgroundColor: colors.primary },
});

const ms = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  header: { padding: 28, paddingTop: 32, position: "relative", overflow: "hidden" },
  decBall: { position: "absolute", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.1)" },
  closeBtn: {
    position: "absolute", top: 16, right: 16,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  iconCircle: { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  headerBadge: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "700", marginBottom: 6 },
  headerTitle: { fontSize: 28, fontWeight: "900", color: "#FFFFFF", marginBottom: 4 },
  headerSub: { fontSize: 14, fontWeight: "700" },
  body: { padding: 24, gap: 20 },
  detailBox: {
    flexDirection: "row", gap: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  detailText: { flex: 1, fontSize: 14, color: "#CBD5E1", lineHeight: 22 },
  bookBtn: { borderRadius: 16, overflow: "hidden" },
  bookBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  bookBtnText: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
});

const fs = StyleSheet.create({
  container: {
    backgroundColor: "rgba(8,12,26,0.92)",
    borderRadius: 28, borderWidth: 1.5,
    borderColor: "rgba(251,191,36,0.2)",
    padding: 24, overflow: "hidden",
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 4 },
  logo: { width: 60, height: 60, borderRadius: 18, borderWidth: 2, borderColor: "rgba(251,191,36,0.45)" },
  shopName: { fontSize: 18, fontWeight: "900", color: "#FFFFFF", letterSpacing: 0.4 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 5, flexWrap: "wrap" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "800" },
  statusSep: { color: "#334155", fontSize: 12 },
  todayHoursText: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 20 },
  section: { gap: 12 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 4 },
  sectionTitle: { fontSize: 11, fontWeight: "800", color: colors.primary, letterSpacing: 1, textTransform: "uppercase" },
  hoursGrid: { gap: 8 },
  hoursRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)",
  },
  hoursRowToday: { backgroundColor: "rgba(251,191,36,0.1)", borderWidth: 1, borderColor: "rgba(251,191,36,0.2)" },
  hoursDay: { fontSize: 13, color: "#64748B", fontWeight: "500", width: 90 },
  hoursDayActive: { color: colors.primary, fontWeight: "700" },
  hoursTime: { flex: 1, fontSize: 14, color: "#E2E8F0", fontWeight: "700" },
  todayBadge: { backgroundColor: "rgba(251,191,36,0.2)", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  todayBadgeText: { fontSize: 10, color: colors.primary, fontWeight: "800" },
  infoCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  infoIconBox: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: "rgba(251,191,36,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  infoMain: { fontSize: 14, color: "#FFFFFF", fontWeight: "700" },
  infoSub: { fontSize: 11, color: "#64748B", marginTop: 2 },
  extBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(251,191,36,0.12)",
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  extText: { fontSize: 11, color: colors.primary, fontWeight: "700" },
  socialGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  socialBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
    flex: 1, minWidth: 110,
  },
  socialLabel: { fontSize: 13, fontWeight: "800" },
  footNote: { fontSize: 11, color: "#334155", textAlign: "center", marginTop: 20 },
});
