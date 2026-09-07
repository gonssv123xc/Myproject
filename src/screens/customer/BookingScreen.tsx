import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Linking,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Check,
  ArrowLeft,
  Scissors,
  User,
  Calendar as CalIcon,
  Clock,
  Tag,
  FileText,
  Star,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Upload,
  CheckCircle,
  AlertTriangle,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { CustomerTabParamList } from "../../types/navigation";
import { colors } from "../../theme/colors";
import { confirmLogout } from "../../utils/logout";
import {
  getServices,
  getBarbers,
  createBooking,
  getBookedSlots,
  confirmPayment,
  Service,
  Barber,
  getBarberSchedule,
} from "../../services/bookingService";
import { getCurrentProfile } from "../../services/authService";
import { getMyCoupons, UserCoupon } from "../../services/rewardService";
import { validatePromoCode } from "../../services/promoService";

const PROMPTPAY_ID = process.env.EXPO_PUBLIC_PROMPTPAY_NUMBER || "0000000000";
const DEPOSIT_AMOUNT = 50;

type Props = {
  navigation: BottomTabNavigationProp<CustomerTabParamList, "Booking">;
};

const DEFAULT_TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00",
];

const DAY_NAMES = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const MONTH_NAMES = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

// Generate next 14 days
const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const steps = [
  { num: 1, label: "บริการ & ช่าง", icon: Scissors },
  { num: 2, label: "ยืนยัน", icon: Check },
];

export const BookingScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState(1);

  // Step 1
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  
  // Barber Modal State
  const [previewBarber, setPreviewBarber] = useState<Barber | null>(null);
  const [modalDate, setModalDate] = useState<Date>(new Date());
  const [modalTime, setModalTime] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [previewSlots, setPreviewSlots] = useState<string[]>([]);
  const [loadingPreviewSlots, setLoadingPreviewSlots] = useState(false);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // Step 2
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>(DEFAULT_TIME_SLOTS);
  const [isBarberOff, setIsBarberOff] = useState(false);

  // Step 3
  const [note, setNote] = useState("");
  const [referenceImageUri, setReferenceImageUri] = useState<string | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<UserCoupon | null>(null);
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ id: string, code: string, discountValue: number, type: "FIXED_AMOUNT" | "PERCENTAGE" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Discount / Coupon Modal State
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // Data
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const dates = generateDates();

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setDataLoading(true);
        const [svc, brb, profile] = await Promise.all([
          getServices(),
          getBarbers(),
          getCurrentProfile(),
        ]);
        setServices(svc);
        setBarbers(brb);
        if (profile) {
          setCustomerId(profile.id);
          const userCoupons = await getMyCoupons(profile.id);
          setCoupons(userCoupons);
        }
        setDataLoading(false);
      };
      fetchData();
    }, [])
  );

  // Timer logic for Payment Modal
  React.useEffect(() => {
    if (!showPaymentModal || paymentSuccess) return;

    if (timeLeft <= 0) {
      setShowPaymentModal(false);
      if (Platform.OS === "web") {
        window.alert("หมดเวลาชำระเงินมัดจำ คิวของคุณถูกยกเลิกแล้ว");
      } else {
        Alert.alert("หมดเวลา", "เวลาในการชำระเงินหมดแล้ว คิวของคุณจะถูกยกเลิก");
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showPaymentModal, timeLeft, paymentSuccess]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSlipImage(result.assets[0].uri);
    }
  };

  const pickReferenceImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setReferenceImageUri(result.assets[0].uri);
    }
  };

  const handleUploadSlip = async () => {
    if (!createdBookingId) return;
    
    setIsUploadingSlip(true);
    const result = await confirmPayment(createdBookingId, slipImage || "mock_slip_url");
    setIsUploadingSlip(false);

    if (result.success) {
      setPaymentSuccess(true);
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentSuccess(false);
        setStep(1); // Reset step
        setSelectedServices([]);
        setSelectedBarber(null);
        setSelectedTime("");
        setNote("");
        setReferenceImageUri(null);
        setSlipImage(null);
        setTimeLeft(15 * 60);
        navigation.navigate("CustomerHome");
      }, 2000);
    } else {
      if (Platform.OS === "web") {
        window.alert("อัปโหลดสลิปไม่สำเร็จ: " + result.error);
      } else {
        Alert.alert("ข้อผิดพลาด", "อัปโหลดสลิปไม่สำเร็จ: " + result.error);
      }
    }
  };

  React.useEffect(() => {
    if (!selectedBarber) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      const dateStr = selectedDate.toISOString().split("T")[0];
      
      const [slots, scheduleData] = await Promise.all([
        getBookedSlots(selectedBarber, dateStr),
        getBarberSchedule(selectedBarber)
      ]);
      
      const dayOfWeek = selectedDate.getDay();
      const todaySchedule = scheduleData.find(s => s.dayOfWeek === dayOfWeek);
      
      if (todaySchedule) {
        setIsBarberOff(todaySchedule.isOff);
        if (!todaySchedule.isOff) {
          const generatedSlots = [];
          const [startH, startM] = todaySchedule.startTime.split(':').map(Number);
          const [endH, endM] = todaySchedule.endTime.split(':').map(Number);
          let curr = new Date(0, 0, 0, startH, startM);
          const end = new Date(0, 0, 0, endH, endM);
          
          while (curr <= end) {
            generatedSlots.push(`${curr.getHours().toString().padStart(2, '0')}:${curr.getMinutes().toString().padStart(2, '0')}`);
            curr.setMinutes(curr.getMinutes() + 30);
          }
          setAvailableTimeSlots(generatedSlots);
        }
      } else {
        setIsBarberOff(false);
        setAvailableTimeSlots(DEFAULT_TIME_SLOTS);
      }
      
      setBookedSlots(slots);
      if (selectedTime && slots.includes(selectedTime)) setSelectedTime("");
      setLoadingSlots(false);
    };
    fetchSlots();
  }, [selectedBarber, selectedDate]);


  const [previewAvailableSlots, setPreviewAvailableSlots] = useState<string[]>(DEFAULT_TIME_SLOTS);
  const [isPreviewBarberOff, setIsPreviewBarberOff] = useState(false);

  React.useEffect(() => {
    if (!previewBarber) {
      setPreviewSlots([]);
      return;
    }
    const fetchPreviewSlots = async () => {
      setLoadingPreviewSlots(true);
      const dateStr = modalDate.toISOString().split("T")[0];
      const [slots, scheduleData] = await Promise.all([
        getBookedSlots(previewBarber.id, dateStr),
        getBarberSchedule(previewBarber.id)
      ]);
      
      const dayOfWeek = modalDate.getDay();
      const todaySchedule = scheduleData.find(s => s.dayOfWeek === dayOfWeek);
      
      if (todaySchedule) {
        setIsPreviewBarberOff(todaySchedule.isOff);
        if (!todaySchedule.isOff) {
          const generatedSlots = [];
          const [startH, startM] = todaySchedule.startTime.split(':').map(Number);
          const [endH, endM] = todaySchedule.endTime.split(':').map(Number);
          let curr = new Date(0, 0, 0, startH, startM);
          const end = new Date(0, 0, 0, endH, endM);
          
          while (curr <= end) {
            generatedSlots.push(`${curr.getHours().toString().padStart(2, '0')}:${curr.getMinutes().toString().padStart(2, '0')}`);
            curr.setMinutes(curr.getMinutes() + 30);
          }
          setPreviewAvailableSlots(generatedSlots);
        }
      } else {
        setIsPreviewBarberOff(false);
        setPreviewAvailableSlots(DEFAULT_TIME_SLOTS);
      }
      
      setPreviewSlots(slots);
      setLoadingPreviewSlots(false);
    };
    fetchPreviewSlots();
  }, [previewBarber, modalDate]);

  const getSelectedServiceObjs = useCallback(
    () => services.filter((s) => selectedServices.includes(s.id)),
    [services, selectedServices]
  );

  const getBarberObj = useCallback(
    () => barbers.find((b) => b.id === selectedBarber),
    [barbers, selectedBarber]
  );

  const getTotalBasePrice = useCallback(() => {
    return getSelectedServiceObjs().reduce((sum, s) => sum + s.price, 0);
  }, [getSelectedServiceObjs]);

  const getTotalDurationMinutes = useCallback(() => {
    return getSelectedServiceObjs().reduce((sum, s) => {
      const mins = parseInt(String(s.duration));
      return sum + (isNaN(mins) ? 60 : mins);
    }, 0);
  }, [getSelectedServiceObjs]);

  const calculateFinalPrice = useCallback(() => {
    let price = getTotalBasePrice();
    
    if (selectedCoupon?.Reward) {
      const { discountType, discountValue } = selectedCoupon.Reward;
      if (discountType === "FREE_SERVICE") price = 0;
      else if (discountType === "FIXED_AMOUNT" && discountValue)
        price = Math.max(0, price - discountValue);
      else if (discountType === "PERCENTAGE" && discountValue)
        price = Math.max(0, price - (price * discountValue) / 100);
    } else if (appliedDiscount) {
      if (appliedDiscount.type === "FIXED_AMOUNT") {
        price = Math.max(0, price - appliedDiscount.discountValue);
      } else if (appliedDiscount.type === "PERCENTAGE") {
        price = Math.max(0, price - (price * appliedDiscount.discountValue) / 100);
      }
    }
    return price;
  }, [getTotalBasePrice, selectedCoupon, appliedDiscount]);

  const handleApplyDiscountCode = async () => {
    if (!discountCodeInput.trim()) return;
    
    setIsValidatingCode(true);
    const code = discountCodeInput.trim().toUpperCase();
    
    const result = await validatePromoCode(code);
    
    setIsValidatingCode(false);
    
    if (result.success && result.data) {
      setAppliedDiscount({
        id: result.data.id,
        code: result.data.code,
        discountValue: result.data.discountValue,
        type: result.data.discountType
      });
      setSelectedCoupon(null);
      
      const msg = result.data.discountType === "PERCENTAGE" 
        ? `ลด ${result.data.discountValue}%` 
        : `ลด ${result.data.discountValue} บาท`;
        
      Alert.alert("สำเร็จ", `ใช้โค้ดส่วนลด ${result.data.code} ${msg}`);
    } else {
      Alert.alert("ข้อผิดพลาด", result.error || "โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุแล้ว");
    }
  };

  const handleConfirm = async () => {
    if (!customerId || selectedServices.length === 0 || !selectedBarber || !selectedTime) {
      if (Platform.OS === "web") window.alert("ข้อมูลการจองไม่ครบถ้วน");
      else Alert.alert("เกิดข้อผิดพลาด", "ข้อมูลการจองไม่ครบถ้วน");
      return;
    }
    setIsSubmitting(true);

    const finalPrice = calculateFinalPrice();
    const totalMins = getTotalDurationMinutes();
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const endDate = new Date();
    endDate.setHours(hours, minutes + totalMins);
    const endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(
      endDate.getMinutes()
    ).padStart(2, "0")}`;

    const serviceNames = getSelectedServiceObjs().map(s => s.name).join(", ");
    const combinedNote = selectedServices.length > 1
      ? `[บริการ: ${serviceNames}]${note ? " " + note : ""}`
      : note;

    const result = await createBooking({
      customerId,
      barberId: selectedBarber,
      serviceId: selectedServices[0],
      date: selectedDate.toISOString(),
      startTime: selectedTime,
      endTime,
      notes: combinedNote,
      totalPrice: finalPrice,
      couponId: selectedCoupon ? selectedCoupon.id : undefined,
      promoCodeId: appliedDiscount && !selectedCoupon ? appliedDiscount.id : undefined,
      referenceImageUri: referenceImageUri || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      setCreatedBookingId(result.bookingId || null);
      setShowPaymentModal(true);
      setTimeLeft(15 * 60);
    } else {
      if (Platform.OS === "web")
        window.alert(result.error || "โปรดลองอีกครั้ง");
      else Alert.alert("จองคิวไม่สำเร็จ", result.error || "โปรดลองอีกครั้ง");
    }
  };

  const canProceedStep1 = selectedServices.length > 0 && !!selectedBarber;
  const canProceedStep2 = !!selectedTime;

  const formatDateLabel = (d: Date) => {
    const today = new Date();
    const diff = Math.round(
      (d.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) /
        (1000 * 60 * 60 * 24)
    );
    const orig = dates.find(
      (x) => x.toDateString() === new Date(d).toDateString()
    );
    if (!orig) return "";
    if (diff === 0) return "วันนี้";
    if (diff === 1) return "พรุ่งนี้";
    return `${DAY_NAMES[orig.getDay()]}`;
  };

  return (
    <ImageBackground
      source={require("../../../assets/13.jpg")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View style={styles.header}>
        {step > 1 ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStep(step - 1)}
          >
            <ChevronLeft size={22} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={styles.headerTitle}>จองคิวตัดผม</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ padding: 16, backgroundColor: "rgba(15, 23, 42, 0.4)", alignItems: 'center', borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }}>
        <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>
          {step === 1 ? "ขั้นตอนที่ 1: เลือกบริการ & ช่าง" : "ขั้นตอนที่ 2: ยืนยันการจอง"}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {dataLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 60 }}
          />
        ) : (
          <>
            {step === 1 && (
              <View style={styles.stepBody}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>เลือกบริการ</Text>
                  {selectedServices.length > 0 && (
                    <View style={styles.selectedCountBadge}>
                      <Text style={styles.selectedCountText}>
                        เลือก {selectedServices.length} รายการ
                      </Text>
                    </View>
                  )}
                </View>
                {services.map((s) => {
                  const isSelected = selectedServices.includes(s.id);
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.card, isSelected && styles.cardSelected]}
                      onPress={() => toggleService(s.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.serviceIconWrap, isSelected && styles.serviceIconWrapSelected]}>
                        <Scissors
                          size={20}
                          color={isSelected ? "#0F172A" : colors.primary}
                        />
                      </View>
                      <View style={styles.serviceInfo}>
                        <Text
                          style={[
                            styles.serviceTitle,
                            isSelected && styles.textOnGold,
                          ]}
                        >
                          {s.name}
                        </Text>
                        <Text
                          style={[
                            styles.serviceDuration,
                            isSelected && styles.textOnGoldMuted,
                          ]}
                        >
                          <Clock
                            size={12}
                            color={isSelected ? "#0F172A" : colors.textMuted}
                          />{" "}
                          {s.duration}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.servicePrice,
                          isSelected && styles.textOnGold,
                        ]}
                      >
                        ฿{s.price}
                      </Text>
                      <View style={[styles.multiCheckBox, isSelected && styles.multiCheckBoxSelected]}>
                        {isSelected && <Check size={14} color="#0F172A" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {selectedServices.length > 0 && (
                  <View style={styles.selectedTotalRow}>
                    <Text style={styles.selectedTotalLabel}>
                      รวม {selectedServices.length} บริการ
                    </Text>
                    <Text style={styles.selectedTotalPrice}>
                      ฿{getTotalBasePrice()}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={styles.sectionTitle}>
                    เลือกช่างตัดผม
                  </Text>
                  {selectedBarber && (
                    <TouchableOpacity onPress={() => setSelectedBarber(null)}>
                      <Text style={{ fontSize: 12, color: colors.danger, textDecorationLine: 'underline' }}>
                        ยกเลิกการเลือกช่าง
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
                  {barbers.map((b) => {
                    const isAvailable = b.status === "available";
                    const isSelected = selectedBarber === b.id;
                    return (
                      <TouchableOpacity
                        key={b.id}
                        style={[
                          styles.barberGridCard,
                          isSelected && styles.barberGridCardSelected,
                        ]}
                        onPress={() => isAvailable && setPreviewBarber(b)}
                        disabled={!isAvailable}
                        activeOpacity={0.8}
                      >
                        <View style={{ alignItems: "center" }}>
                          <ImageBackground
                            source={{ uri: b.avatar || `https://i.pravatar.cc/150?u=${b.id}` }}
                            style={styles.barberGridAvatar}
                            imageStyle={{ borderRadius: 32 }}
                          >
                            {isSelected && (
                              <View style={styles.barberGridAvatarSelected}>
                                <Check size={24} color="#0F172A" />
                              </View>
                            )}
                          </ImageBackground>
                        </View>
                        
                        <View style={styles.barberGridInfo}>
                          <Text style={[styles.barberGridName, isSelected && { color: "#0F172A" }]} numberOfLines={1}>
                            {b.name}
                          </Text>
                          <Text style={[styles.barberGridSpecialty, isSelected && styles.textOnGoldMuted]} numberOfLines={1}>
                            {b.specialty || "ชำนาญทรงวินเทจ"}
                          </Text>
                          
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Star size={12} color="#FBBF24" fill="#FBBF24" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 12, color: '#FBBF24', fontWeight: 'bold' }}>
                              {b.rating > 0 ? b.rating.toFixed(1) : "4.8"}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepBody}>
                <Text style={styles.sectionTitle}>สรุปการจอง</Text>

                <View style={styles.summaryCard}>
                  <SummaryRow
                    Icon={Scissors}
                    label={`บริการ (${selectedServices.length} รายการ)`}
                    value={getSelectedServiceObjs().map(s => s.name).join(", ") || "-"}
                    sub={`฿${getTotalBasePrice()}`}
                  />
                  <View style={styles.divider} />
                  <SummaryRow
                    Icon={User}
                    label="ช่างตัดผม"
                    value={getBarberObj()?.name || "-"}
                  />
                  <View style={styles.divider} />
                  <SummaryRow
                    Icon={CalIcon}
                    label="วันที่"
                    value={`${selectedDate.getDate()} ${
                      MONTH_NAMES[selectedDate.getMonth()]
                    } ${selectedDate.getFullYear() + 543}`}
                  />
                  <View style={styles.divider} />
                  <SummaryRow
                    Icon={Clock}
                    label="เวลา"
                    value={`${selectedTime} น.`}
                  />
                </View>

                <View style={{ marginTop: 24 }}>
                    <Text style={styles.sectionTitle}>เลือกเวลา</Text>
                    {loadingSlots ? (
                      <View style={styles.loadingBox}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.loadingText}>กำลังดึงข้อมูลคิวว่าง...</Text>
                      </View>
                    ) : isBarberOff ? (
                      <View style={styles.emptyBox}>
                        <CalIcon size={44} color="#475569" style={{ marginBottom: 12 }} />
                        <Text style={styles.emptyText}>ช่างหยุดให้บริการในวันนี้</Text>
                        <Text style={styles.emptySub}>กรุณาเลือกวันอื่นครับ</Text>
                      </View>
                    ) : (
                      <View style={styles.slotsGrid}>
                        {availableTimeSlots.map((time) => {
                          const isBooked = bookedSlots.includes(time);
                          const isSelected = selectedTime === time;
                          return (
                            <TouchableOpacity
                              key={time}
                              onPress={() => !isBooked && setSelectedTime(time)}
                              disabled={isBooked}
                              style={[
                                styles.slotBtn,
                                isBooked && styles.slotBtnBooked,
                                isSelected && styles.slotBtnSelected,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.slotBtnText,
                                  isBooked && styles.slotBtnTextBooked,
                                  isSelected && styles.slotBtnTextSelected,
                                ]}
                              >
                                {time}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>

                <Text style={styles.sectionTitle}>อธิบายทรงผม (ไม่บังคับ)</Text>
                <View style={styles.noteInputWrap}>
                  <FileText
                    size={16}
                    color={colors.textMuted}
                    style={{ marginTop: 2 }}
                  />
                  <TextInput
                    style={styles.noteInput}
                    value={note}
                    onChangeText={setNote}
                    placeholder="เช่น ตัด Fade ด้านข้างสั้น ข้างบนยาวหน่อย..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity style={styles.uploadRefBtn} onPress={pickReferenceImage}>
                  <Upload size={16} color={colors.primary} />
                  <Text style={styles.uploadRefBtnText}>
                    {referenceImageUri ? "เปลี่ยนรูปทรงผมตัวอย่าง" : "อัปโหลดรูปทรงผมตัวอย่าง (ไม่บังคับ)"}
                  </Text>
                </TouchableOpacity>

                {referenceImageUri && (
                  <View style={{ alignItems: "flex-start", marginTop: 8, marginBottom: 16, paddingHorizontal: 4 }}>
                    <ImageBackground source={{ uri: referenceImageUri }} style={{ width: 100, height: 100, borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: colors.border }} />
                  </View>
                )}

                <Text style={styles.sectionTitle}>ส่วนลดและคูปอง</Text>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: appliedDiscount || selectedCoupon ? colors.primary : "transparent"
                  }}
                  onPress={() => setShowDiscountModal(true)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Tag size={20} color={appliedDiscount || selectedCoupon ? colors.primary : colors.textMuted} />
                    <View>
                      <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}>
                        เลือกส่วนลด หรือ ใส่โค้ด
                      </Text>
                      {(appliedDiscount || selectedCoupon) && (
                        <Text style={{ color: colors.primary, fontSize: 13, marginTop: 4 }}>
                          {appliedDiscount ? `ใช้โค้ด: ${appliedDiscount.code}` : `ใช้คูปอง: ${selectedCoupon?.Reward?.name}`}
                        </Text>
                      )}
                    </View>
                  </View>
                  <ChevronRight size={20} color={colors.textMuted} />
                </TouchableOpacity>

                <View style={styles.priceSummary}>
                  {selectedCoupon && (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>ราคาปกติ</Text>
                      <Text style={styles.priceOriginal}>
                        ฿{getTotalBasePrice()}
                      </Text>
                    </View>
                  )}
                  {selectedCoupon && (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>
                        ส่วนลดคูปอง ({selectedCoupon.Reward?.name})
                      </Text>
                      <Text style={styles.priceDiscount}>
                        -฿
                        {getTotalBasePrice() - calculateFinalPrice()}
                      </Text>
                    </View>
                  )}
                  {appliedDiscount && !selectedCoupon && (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>
                        โค้ดส่วนลด ({appliedDiscount.code})
                      </Text>
                      <Text style={styles.priceDiscount}>
                        -฿
                        {getTotalBasePrice() - calculateFinalPrice()}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.priceRow, styles.priceFinalRow]}>
                    <Text style={styles.priceFinalLabel}>ราคาสุทธิ</Text>
                    <Text style={styles.priceFinal}>
                      ฿{calculateFinalPrice()}
                    </Text>
                  </View>
                  <View style={[styles.priceRow, { marginTop: 8 }]}>
                    <Text style={styles.priceLabel}>มัดจำเพื่อยืนยันคิว (หักจากราคาสุทธิ)</Text>
                    <Text style={[styles.priceFinal, { color: colors.danger, fontSize: 16 }]}>
                      ฿{DEPOSIT_AMOUNT}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      {!dataLoading && (
        <View style={styles.bottomBar}>
          {step < 2 ? (
            <TouchableOpacity
              style={[
                styles.nextBtn,
                (step === 1 && !canProceedStep1) && styles.nextBtnDisabled,
              ]}
              disabled={step === 1 && !canProceedStep1}
              onPress={() => setStep(step + 1)}
            >
              <Text style={styles.nextBtnText}>ถัดไป</Text>
              <ChevronRight size={20} color="#0F172A" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <>
                  <Check size={20} color="#0F172A" />
                  <Text style={styles.nextBtnText}>ยืนยันการจอง</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCancelConfirmModal(true)}
      >
        <View style={styles.paymentModalBackdrop}>
          <View style={styles.paymentModalContent}>
            {paymentSuccess ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(16, 185, 129, 0.15)", justifyContent: "center", alignItems: "center", marginBottom: 24 }}>
                  <CheckCircle size={56} color="#10B981" />
                </View>
                <Text style={{ color: "#FFFFFF", fontSize: 26, fontWeight: "bold", marginBottom: 12 }}>ชำระเงินสำเร็จ!</Text>
                <Text style={{ color: "#94A3B8", fontSize: 16, textAlign: "center", lineHeight: 24, paddingHorizontal: 20 }}>
                  ยืนยันคิวของคุณเรียบร้อยแล้ว{'\n'}ขอบคุณที่ใช้บริการครับ
                </Text>
                <View style={{ marginTop: 32, backgroundColor: "rgba(16, 185, 129, 0.1)", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 24 }}>
                  <Text style={{ color: "#10B981", fontSize: 14, fontWeight: "600" }}>กำลังพากลับหน้าหลัก...</Text>
                </View>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>ชำระเงินมัดจำ</Text>
                  <TouchableOpacity onPress={() => setShowCancelConfirmModal(true)}>
                    <Text style={{ color: colors.danger, fontSize: 16 }}>ยกเลิก</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: 16, padding: 16, alignItems: "center", marginBottom: 24 }}>
                  <Text style={{ color: "#F87171", fontSize: 14, marginBottom: 4 }}>กรุณาชำระเงินภายใน</Text>
                  <Text style={{ color: "#EF4444", fontSize: 32, fontWeight: "bold" }}>{formatTime(timeLeft)}</Text>
                </View>

                <View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24, alignItems: "center", marginBottom: 24 }}>
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: "#0F172A", marginBottom: 4 }}>สแกนเพื่อชำระเงิน</Text>
                  <Text style={{ fontSize: 16, color: "#64748B", marginBottom: 20 }}>ยอดชำระ: {Math.min(DEPOSIT_AMOUNT, calculateFinalPrice())} บาท</Text>
                  
                  <View style={{ padding: 16, backgroundColor: "#FFFFFF", borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4, marginBottom: 20 }}>
                    <Image source={require("../../../assets/payment_qr.jpg")} style={{ width: 220, height: 280 }} resizeMode="contain" />
                  </View>
                  <Text style={{ fontSize: 14, color: "#475569", fontWeight: "500" }}>พร้อมเพย์: {PROMPTPAY_ID}</Text>
                </View>

                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Upload size={20} color={colors.primary} />
                  <Text style={styles.uploadBtnText}>{slipImage ? "เปลี่ยนรูปสลิป" : "อัปโหลดสลิปโอนเงิน"}</Text>
                </TouchableOpacity>

                {slipImage && (
                  <View style={{ alignItems: "center", marginBottom: 16 }}>
                    <View style={{ width: 120, height: 160, borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: colors.border }}>
                      <ImageBackground source={{ uri: slipImage }} style={{ width: '100%', height: '100%' }} />
                      <TouchableOpacity 
                        style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => setSlipImage(null)}
                      >
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>X</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.confirmBtn, isUploadingSlip && { opacity: 0.5 }]}
                  onPress={handleUploadSlip}
                  disabled={isUploadingSlip}
                >
                  {isUploadingSlip ? (
                    <ActivityIndicator color="#0F172A" />
                  ) : (
                    <Text style={styles.nextBtnText}>ยืนยันการชำระเงิน</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCancelConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelConfirmModal(false)}
      >
        <View style={styles.cancelConfirmBackdrop}>
          <View style={styles.cancelConfirmContent}>
            <View style={styles.cancelIconWrap}>
              <AlertTriangle size={32} color={colors.danger} />
            </View>
            <Text style={styles.cancelConfirmTitle}>ยกเลิกการจอง?</Text>
            <Text style={styles.cancelConfirmDesc}>
              คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้? คิวของคุณจะถูกยกเลิกทันที
            </Text>
            <View style={styles.cancelConfirmActions}>
              <TouchableOpacity
                style={styles.cancelConfirmBtnNo}
                onPress={() => setShowCancelConfirmModal(false)}
              >
                <Text style={styles.cancelConfirmBtnNoText}>ไม่, กลับไปชำระเงิน</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelConfirmBtnYes}
                onPress={() => {
                  setShowCancelConfirmModal(false);
                  setShowPaymentModal(false);
                }}
              >
                <Text style={styles.cancelConfirmBtnYesText}>ใช่, ยกเลิกคิว</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!previewBarber}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setPreviewBarber(null);
          setModalTime("");
        }}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={() => {
            setPreviewBarber(null);
            setModalTime("");
          }}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {previewBarber && (
              <>
                <View style={styles.modalHeader}>
                  <ImageBackground
                    source={{ uri: previewBarber.avatar || `https://i.pravatar.cc/150?u=${previewBarber.id}` }}
                    style={styles.modalAvatar}
                  />
                  <View style={styles.modalHeaderInfo}>
                    <Text style={styles.modalName}>{previewBarber.name}</Text>
                    
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {(previewBarber.specialty || "เฟด/วินเทจ").split("/").map((tag, idx) => (
                        <View key={idx} style={styles.modalTag}>
                          <Text style={styles.modalTagText}>[{tag.trim()}]</Text>
                        </View>
                      ))}
                    </View>
                    
                    <View style={styles.modalMetaRow}>
                      <View style={styles.modalMetaChip}>
                        <Star size={12} color="#FBBF24" fill="#FBBF24" />
                        <Text style={styles.modalMetaText}>
                          {previewBarber.rating > 0 ? previewBarber.rating.toFixed(1) : "4.8"} (125 รีวิว)
                        </Text>
                      </View>
                      <View style={styles.modalMetaChip}>
                        <FileText size={12} color={colors.primary} />
                        <Text style={styles.modalMetaText}>{previewBarber.phone || "080-123-4567"}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.modalMetaChip}
                        onPress={() => Linking.openURL('https://instagram.com').catch(() => {
                           if (Platform.OS === 'web') window.alert("ลิงก์ไปยัง Instagram");
                           else Alert.alert("ลิงก์", "ลิงก์ไปยัง Instagram");
                        })}
                      >
                        <Instagram size={12} color="#E1306C" />
                        <Text style={[styles.modalMetaText, { color: colors.primary, textDecorationLine: 'underline' }]}>ดูผลงาน</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                
                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={[styles.modalSectionTitle, { marginBottom: 0 }]}>เลือกวันที่</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                      <Text style={{ fontSize: 13, color: colors.primary, fontWeight: 'bold' }}>เลือกจากปฏิทิน 📅</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {showDatePicker && (
                    <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <TouchableOpacity onPress={() => setModalDate(new Date(modalDate.getFullYear(), modalDate.getMonth() - 1, 1))}>
                          <ChevronLeft size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>
                          {MONTH_NAMES[modalDate.getMonth()]} {modalDate.getFullYear() + 543}
                        </Text>
                        <TouchableOpacity onPress={() => setModalDate(new Date(modalDate.getFullYear(), modalDate.getMonth() + 1, 1))}>
                          <ChevronRight size={24} color={colors.text} />
                        </TouchableOpacity>
                      </View>
                      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                        {DAY_NAMES.map(d => (
                          <Text key={d} style={{ flex: 1, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>{d}</Text>
                        ))}
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {Array.from({ length: new Date(modalDate.getFullYear(), modalDate.getMonth(), 1).getDay() }).map((_, i) => (
                          <View key={`empty-${i}`} style={{ width: '14.28%', height: 40 }} />
                        ))}
                        {Array.from({ length: new Date(modalDate.getFullYear(), modalDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                          const d = i + 1;
                          const dateObj = new Date(modalDate.getFullYear(), modalDate.getMonth(), d);
                          const today = new Date();
                          today.setHours(0,0,0,0);
                          const isPast = dateObj < today;
                          const isSelected = dateObj.toDateString() === modalDate.toDateString();
                          return (
                            <TouchableOpacity
                              key={d}
                              disabled={isPast}
                              onPress={() => {
                                setModalDate(dateObj);
                                setShowDatePicker(false);
                                setModalTime("");
                              }}
                              style={{
                                width: '14.28%',
                                height: 40,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <View style={[
                                { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
                                isSelected && { backgroundColor: colors.primary }
                              ]}>
                                <Text style={[
                                  { fontSize: 14, color: colors.text },
                                  isPast && { color: 'rgba(255,255,255,0.2)' },
                                  isSelected && { color: '#0F172A', fontWeight: 'bold' }
                                ]}>{d}</Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  <Text style={styles.modalSectionTitle}>เวลาว่าง ({modalDate.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })})</Text>
                  {loadingPreviewSlots ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 24, marginBottom: 40 }} />
                  ) : isPreviewBarberOff ? (
                    <View style={styles.emptyBox}>
                      <CalIcon size={44} color="#475569" style={{ marginBottom: 12 }} />
                      <Text style={styles.emptyText}>ช่างหยุดให้บริการในวันนี้</Text>
                    </View>
                  ) : (
                    <View style={styles.modalSlotsGrid}>
                      {previewAvailableSlots.map((time) => {
                        const isBooked = previewSlots.includes(time);
                        const isSelected = modalTime === time;
                        return (
                          <TouchableOpacity
                            key={time}
                            onPress={() => !isBooked && setModalTime(time)}
                            disabled={isBooked}
                            style={[
                              styles.modalSlot, 
                              isBooked && styles.modalSlotBooked,
                              isSelected && styles.modalSlotSelected
                            ]}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              styles.modalSlotText, 
                              isBooked && styles.modalSlotTextBooked,
                              isSelected && { color: "#0F172A", fontWeight: "bold" }
                            ]}>{time}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}




                </ScrollView>
                
                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={styles.modalCancelBtn} 
                    onPress={() => {
                      setPreviewBarber(null);
                      setModalTime("");
                    }}
                  >
                    <Text style={styles.modalCancelBtnText}>ปิด</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalSelectBtn}
                    onPress={() => {
                      setSelectedBarber(previewBarber.id);
                      setSelectedDate(modalDate);
                      if (modalTime) {
                        setSelectedTime(modalTime);
                        setStep(2); // Go to Confirm Step (now Step 2)
                      }
                      setPreviewBarber(null);
                      setModalTime("");
                    }}
                  >
                    <Text style={styles.modalSelectBtnText}>
                      {modalTime ? `ยืนยันเวลา ${modalTime} น.` : "เลือกช่างคนนี้ (รอระบุเวลา)"}
                    </Text>
                    {modalTime && <Check size={16} color="#0F172A" />}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      {/* Discount / Coupon Modal */}
      <Modal
        visible={showDiscountModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDiscountModal(false)}
      >
        <View style={styles.paymentModalBackdrop}>
          <View style={[styles.paymentModalContent, { maxHeight: "80%" }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>ส่วนลดและคูปอง</Text>
              <TouchableOpacity onPress={() => setShowDiscountModal(false)}>
                <Text style={{ color: colors.danger, fontSize: 16 }}>ปิด</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Discount Code */}
              <Text style={[styles.sectionTitle, { marginTop: 0 }]}>กรอกโค้ดส่วนลด</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                <View style={[styles.noteInputWrap, { flex: 1, marginBottom: 0, backgroundColor: "rgba(0,0,0,0.2)" }]}>
                  <Tag size={16} color={colors.textMuted} style={{ marginTop: 2 }} />
                  <TextInput
                    style={styles.noteInput}
                    value={discountCodeInput}
                    onChangeText={setDiscountCodeInput}
                    placeholder="กรอกโค้ดส่วนลด (ถ้ามี)"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                  />
                </View>
                <TouchableOpacity
                  style={{ backgroundColor: colors.primary, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12, opacity: isValidatingCode ? 0.7 : 1 }}
                  onPress={async () => {
                    await handleApplyDiscountCode();
                    if (discountCodeInput.trim()) {
                      setShowDiscountModal(false);
                    }
                  }}
                  disabled={isValidatingCode}
                >
                  {isValidatingCode ? (
                    <ActivityIndicator size="small" color="#0F172A" />
                  ) : (
                    <Text style={{ color: '#0F172A', fontWeight: 'bold' }}>ใช้โค้ด</Text>
                  )}
                </TouchableOpacity>
              </View>

              {appliedDiscount && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 12, borderRadius: 12, marginBottom: 24 }}>
                  <Text style={{ color: colors.success }}>✓ ใช้โค้ด {appliedDiscount.code} แล้ว</Text>
                  <TouchableOpacity onPress={() => setAppliedDiscount(null)}>
                    <Text style={{ color: colors.danger, fontSize: 12 }}>ยกเลิกโค้ด</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={[styles.divider, { marginVertical: 16 }]} />

              {/* Coupons */}
              <Text style={[styles.sectionTitle, { marginTop: 0 }]}>คูปองสะสมแต้มของคุณ</Text>
              {coupons.length === 0 ? (
                <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 16 }}>ไม่มีคูปองที่สามารถใช้ได้</Text>
              ) : (
                <View style={{ gap: 12, marginTop: 8, paddingBottom: 40 }}>
                  <TouchableOpacity
                    style={[
                      styles.card,
                      !selectedCoupon && { borderColor: colors.primary, borderWidth: 1 }
                    ]}
                    onPress={() => {
                      setSelectedCoupon(null);
                      setShowDiscountModal(false);
                    }}
                  >
                    <Text style={{ color: !selectedCoupon ? colors.primary : colors.text, fontSize: 16 }}>ไม่ใช้คูปอง</Text>
                    {!selectedCoupon && <Check size={20} color={colors.primary} />}
                  </TouchableOpacity>

                  {coupons.map((c) => {
                    const isSelected = selectedCoupon?.id === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.card,
                          isSelected && { borderColor: colors.primary, borderWidth: 1 }
                        ]}
                        onPress={() => {
                          setSelectedCoupon(c);
                          setAppliedDiscount(null); // ยกเลิกโค้ดถ้าเปลี่ยนมาใช้คูปอง
                          setShowDiscountModal(false);
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                          <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: "rgba(251, 191, 36, 0.2)", justifyContent: "center", alignItems: "center" }}>
                            <Tag size={24} color="#FBBF24" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: isSelected ? colors.primary : "#FBBF24", fontSize: 16, fontWeight: "bold" }}>
                              {c.Reward?.name}
                            </Text>
                            <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }} numberOfLines={1}>
                              {c.Reward?.discountType === "PERCENTAGE" ? `ลด ${c.Reward.discountValue}%` : c.Reward?.discountType === "FIXED_AMOUNT" ? `ลด ${c.Reward.discountValue} บาท` : "บริการฟรี"}
                            </Text>
                          </View>
                        </View>
                        {isSelected && <Check size={20} color={colors.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </ImageBackground>
  );
};

// Small helper component for summary rows
const SummaryRow = ({
  Icon,
  label,
  value,
  sub,
}: {
  Icon: any;
  label: string;
  value: string;
  sub?: string;
}) => (
  <View style={styles.summaryRow}>
    <View style={styles.summaryIconWrap}>
      <Icon size={18} color={colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
    {sub && <Text style={styles.summarySub}>{sub}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%", height: "100%" },
  overlay: {
    position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
  },

  // Review Stars
  reviewStarsRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  
  // Barber Grid Cards
  barberGridCard: {
    width: "47%",
    minWidth: 150,
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  barberGridCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  barberGridAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 12,
  },
  barberGridAvatarSelected: {
    position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(251, 191, 36, 0.8)",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  barberGridInfo: {
    alignItems: "center",
    width: "100%",
  },
  barberGridName: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
  },
  barberGridSpecialty: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: "center",
  },
  
  // Barber Detail Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%", // Ensure it doesn't overflow screen vertically
    backgroundColor: "#0F172A",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(251, 191, 36, 0.5)",
  },
  modalHeaderInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  modalName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
  },
  modalTag: {
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modalTagText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
  },
  modalSpecialty: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  modalMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
    flexWrap: "wrap",
  },
  modalMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modalMetaText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "bold",
  },
  modalBody: {
    padding: 24,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
  },
  modalDatePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  modalDatePillSelected: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    borderColor: "rgba(212, 175, 55, 0.4)",
  },
  modalDatePillDay: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.textMuted,
  },
  modalDatePillDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalDatePillTextSelected: {
    color: colors.primary,
  },
  modalSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modalSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSlotSelected: {
    backgroundColor: colors.primary,
  },
  modalSlotBooked: {
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  modalSlotText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "600",
  },
  modalSlotTextBooked: {
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    backgroundColor: "#0F172A",
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  modalCancelBtnText: {
    color: colors.text,
    fontWeight: "bold",
    fontSize: 14,
  },
  modalSelectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  modalSelectBtnText: {
    color: "#0F172A",
    fontWeight: "bold",
    fontSize: 14,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    ...(Platform.OS === "web" ? { backdropFilter: "blur(10px)" } : {}) as any,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  stepItem: { alignItems: "center", gap: 6 },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepDotDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepDotText: { fontSize: 13, fontWeight: "bold", color: colors.textMuted },
  stepDotTextActive: { color: "#0F172A" },
  stepLabel: { fontSize: 11, color: colors.textMuted, textAlign: "center" },
  stepLabelActive: { color: colors.primary, fontWeight: "bold" },
  stepLabelDone: { color: colors.primary },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 8,
    marginBottom: 16,
  },
  stepConnectorDone: { backgroundColor: colors.primary },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  stepBody: { gap: 12 },

  // Section title
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  // Service Cards
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.75)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    gap: 12,
  },
  cardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cardDisabled: { opacity: 0.4 },
  serviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceInfo: { flex: 1 },
  serviceTitle: { fontSize: 15, fontWeight: "bold", color: colors.text },
  serviceDuration: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  servicePrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
    marginRight: 4,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(15,23,42,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  textOnGold: { color: "#0F172A" },
  textOnGoldMuted: { color: "rgba(15,23,42,0.65)" },



  // Barber Cards (List)
  barberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.75)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    gap: 14,
  },
  barberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  barberAvatarSelected: {
    backgroundColor: "rgba(15,23,42,0.25)",
    borderColor: "rgba(15,23,42,0.3)",
  },
  barberInfo: { flex: 1 },
  barberName: { fontSize: 15, fontWeight: "bold", color: colors.text },
  barberSpecialty: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: colors.successBg,
  },
  statusBadgeBusy: { backgroundColor: colors.dangerBg },
  statusBadgeDark: { backgroundColor: "rgba(15,23,42,0.25)" },
  statusText: { fontSize: 12, fontWeight: "bold", color: colors.success },
  statusTextBusy: { color: colors.danger },
  statusTextDark: { color: "rgba(15,23,42,0.8)" },

  // Date Picker
  dateScroll: { marginHorizontal: -4 },
  dateScrollContent: { paddingHorizontal: 4, gap: 10 },
  datePill: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(30, 41, 59, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    minWidth: 58,
  },
  datePillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  datePillDay: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  datePillNum: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    marginVertical: 2,
  },
  datePillMonth: { fontSize: 11, color: colors.textMuted },
  datePillTextSelected: { color: "#0F172A" },

  // Time Grid
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  loadingText: { color: colors.textMuted, fontSize: 14 },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
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
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  slotBtn: {
    width: "30.5%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(30, 41, 59, 0.75)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  slotBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotBtnBooked: {
    backgroundColor: "rgba(15,23,42,0.4)",
    borderColor: "transparent",
  },
  slotBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  slotBtnTextSelected: {
    color: "#0F172A",
    fontWeight: "bold",
  },
  slotBtnTextBooked: {
    color: "rgba(255,255,255,0.2)",
    textDecorationLine: "line-through",
  },
  timeChip: {
    width: "30.5%",
    paddingVertical: 14,
    backgroundColor: "rgba(30, 41, 59, 0.75)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  timeChipBooked: {
    opacity: 0.35,
    backgroundColor: colors.dangerBg,
    borderColor: colors.danger,
  },
  timeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeChipText: { fontSize: 14, fontWeight: "600", color: colors.text },
  timeChipTextBooked: {
    textDecorationLine: "line-through",
    color: colors.danger,
  },
  timeChipTextSelected: { color: "#0F172A", fontWeight: "bold" },
  bookedBadge: { fontSize: 9, color: colors.danger, marginTop: 2 },

  // Summary Card
  summaryCard: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 4,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 8,
  },
  summaryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryLabel: { fontSize: 11, color: colors.textMuted },
  summaryValue: { fontSize: 15, fontWeight: "bold", color: colors.text },
  summarySub: { fontSize: 15, fontWeight: "bold", color: colors.primary },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: -4,
  },

  // Note Input
  noteInputWrap: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(30, 41, 59, 0.75)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  noteInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: "top",
  },
  uploadRefBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  uploadRefBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "bold",
  },
  cancelConfirmBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  cancelConfirmContent: {
    backgroundColor: "#1E293B",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  cancelIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  cancelConfirmTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  cancelConfirmDesc: {
    fontSize: 15,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  cancelConfirmActions: {
    flexDirection: "column",
    width: "100%",
    gap: 12,
  },
  cancelConfirmBtnNo: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelConfirmBtnNoText: {
    color: "#0F172A",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelConfirmBtnYes: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  cancelConfirmBtnYesText: {
    color: colors.danger,
    fontWeight: "bold",
    fontSize: 16,
  },

  serviceIconWrapSelected: {
    backgroundColor: "rgba(15,23,42,0.25)",
  },
  multiCheckBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  multiCheckBoxSelected: {
    backgroundColor: "rgba(15,23,42,0.3)",
    borderColor: "rgba(15,23,42,0.3)",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  selectedCountBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  selectedCountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.primary,
  },
  selectedTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  selectedTotalLabel: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  selectedTotalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },

  // Coupons
  couponChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(30, 41, 59, 0.75)",
  },
  couponChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  couponChipText: { fontSize: 13, color: colors.textMuted },
  couponChipTextActive: { color: "#0F172A", fontWeight: "bold" },

  // Price Summary
  priceSummary: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 8,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    maxHeight: "90%",
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  uploadBtnText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  priceLabel: { fontSize: 14, color: colors.textMuted },
  priceOriginal: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },
  priceDiscount: { fontSize: 14, color: colors.success, fontWeight: "600" },
  priceFinalRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 10,
    marginTop: 4,
  },
  priceFinalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  priceFinal: { fontSize: 26, fontWeight: "bold", color: colors.primary },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: Platform.OS === "web" ? 60 : 80, // Moved up to avoid overlapping with Tab Bar
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 12, // Reduced padding
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    ...(Platform.OS === "web" ? { backdropFilter: "blur(12px)" } : {}) as any,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    height: 56,
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  nextBtnText: { fontSize: 16, fontWeight: "bold", color: "#0F172A" },
});
