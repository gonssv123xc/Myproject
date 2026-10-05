import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { FileText, Download, Calendar as CalendarIcon, CheckCircle, XCircle } from "lucide-react-native";
import { colors } from "../../theme/colors";
import { getReportData, ReportBooking, ReportSummary } from "../../services/reportService";
import { exportToExcel, exportToPDF } from "../../utils/exportUtils";

export const ReportScreen = () => {
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState(new Date());
  
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [bookings, setBookings] = useState<ReportBooking[]>([]);

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      // Set to midnight for start date
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      // Set to 23:59:59 for end date
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const res = await getReportData(start.toISOString(), end.toISOString());
      setSummary(res.summary);
      setBookings(res.bookings);
    } catch (err) {
      console.error(err);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถดึงข้อมูลรายงานได้");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!summary || bookings.length === 0) return;
    setExporting(true);
    try {
      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];
      await exportToExcel(bookings, summary, startStr, endStr);
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถสร้างไฟล์ Excel ได้");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!summary || bookings.length === 0) return;
    setExporting(true);
    try {
      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];
      await exportToPDF(bookings, summary, startStr, endStr);
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถสร้างไฟล์ PDF ได้");
    } finally {
      setExporting(false);
    }
  };

  const formatDateStr = (date: Date) => {
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderDatePicker = (
    date: Date,
    setDate: (d: Date) => void,
    showPicker: boolean,
    setShowPicker: (s: boolean) => void
  ) => {
    if (Platform.OS === 'web') {
      return React.createElement('input', {
        type: 'datetime-local',
        value: new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
        onChange: (e: any) => {
          if (e.target.value) {
            setDate(new Date(e.target.value));
          }
        },
        style: {
          padding: '12px 16px',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.1)',
          backgroundColor: '#1E293B',
          color: '#F8FAFC',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          width: '100%',
          outline: 'none',
          colorScheme: 'dark'
        }
      });
    }

    return (
      <>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowPicker(true)}
        >
          <CalendarIcon size={18} color={colors.primary} />
          <Text style={styles.dateButtonText}>{formatDateStr(date)}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={showPicker}
          mode="datetime"
          date={date}
          onConfirm={(d) => {
            setDate(d);
            setShowPicker(false);
          }}
          onCancel={() => setShowPicker(false)}
          confirmTextIOS="ตกลง"
          cancelTextIOS="ยกเลิก"
        />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>รายงาน (Report)</Text>
      </View>

      <View style={styles.dateFilterContainer}>
        <View style={{ flex: 1 }}>
          {renderDatePicker(startDate, setStartDate, showStartPicker, setShowStartPicker)}
        </View>
        <Text style={styles.dateDivider}>-</Text>
        <View style={{ flex: 1 }}>
          {renderDatePicker(endDate, setEndDate, showEndPicker, setShowEndPicker)}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Summary Cards */}
          {summary && (
            <View style={styles.summaryContainer}>
              <View style={[styles.summaryCard, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                <Text style={styles.summaryTitle}>รายรับรวม (บาท)</Text>
                <Text style={[styles.summaryValue, { color: '#34C759' }]}>
                  ฿{summary.totalRevenue.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={[styles.summarySmallCard, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
                  <Text style={styles.summaryTitle}>ทั้งหมด</Text>
                  <Text style={[styles.summaryValue, { color: '#007AFF' }]}>{summary.totalBookings}</Text>
                </View>
                <View style={[styles.summarySmallCard, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                  <Text style={styles.summaryTitle}>สำเร็จ</Text>
                  <Text style={[styles.summaryValue, { color: '#34C759' }]}>{summary.completedBookings}</Text>
                </View>
                <View style={[styles.summarySmallCard, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                  <Text style={styles.summaryTitle}>ยกเลิก</Text>
                  <Text style={[styles.summaryValue, { color: '#FF3B30' }]}>{summary.cancelledBookings}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Export Buttons */}
          <View style={styles.exportContainer}>
            <TouchableOpacity 
              style={[styles.exportButton, styles.exportExcelButton, exporting && { opacity: 0.7 }]}
              onPress={handleExportExcel}
              disabled={exporting || bookings.length === 0}
            >
              <Download size={20} color="#FFF" />
              <Text style={styles.exportButtonText}>Export Excel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.exportButton, styles.exportPDFButton, exporting && { opacity: 0.7 }]}
              onPress={handleExportPDF}
              disabled={exporting || bookings.length === 0}
            >
              <FileText size={20} color="#FFF" />
              <Text style={styles.exportButtonText}>Export PDF</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Bookings Preview */}
          <Text style={styles.sectionTitle}>รายการในช่วงเวลาที่เลือก</Text>
          {bookings.length > 0 ? (
            bookings.map((b) => (
              <View key={b.id} style={styles.bookingItem}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingDate}>{b.date} {b.startTime}</Text>
                  <View style={[
                    styles.statusBadge, 
                    b.status === 'COMPLETED' ? styles.statusSuccess : 
                    (b.status === 'CANCELLED' || b.status === 'NO_SHOW') ? styles.statusError : styles.statusPending
                  ]}>
                    <Text style={[
                      styles.statusText,
                      b.status === 'COMPLETED' ? styles.statusTextSuccess : 
                      (b.status === 'CANCELLED' || b.status === 'NO_SHOW') ? styles.statusTextError : styles.statusTextPending
                    ]}>{b.status}</Text>
                  </View>
                </View>
                <View style={styles.bookingDetails}>
                  <Text style={styles.bookingCustomer}>ลูกค้า: {b.customerName}</Text>
                  <Text style={styles.bookingBarber}>{b.barberName}</Text>
                  <Text style={styles.bookingService}>บริการ: {b.serviceName}</Text>
                </View>
                <View style={styles.bookingFooter}>
                  <Text style={styles.bookingPrice}>฿{b.totalPrice}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>ไม่มีรายการในช่วงวันที่เลือก</Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
  },
  dateFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24, // Pill shaped
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
    justifyContent: "center",
    gap: 8,
  },
  dateButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  dateDivider: {
    color: colors.textMuted,
    marginHorizontal: 12,
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "bold",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  summarySmallCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  exportContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 32,
  },
  exportButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 100, // Pill shaped
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  exportExcelButton: {
    backgroundColor: "#2E7D32", // Excel Green
  },
  exportPDFButton: {
    backgroundColor: "#D32F2F", // PDF Red
  },
  exportButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
  },
  bookingItem: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    paddingBottom: 12,
  },
  bookingDate: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusSuccess: { backgroundColor: 'rgba(52, 199, 89, 0.15)' },
  statusError: { backgroundColor: 'rgba(255, 59, 48, 0.15)' },
  statusPending: { backgroundColor: 'rgba(255, 149, 0, 0.15)' },
  statusText: { fontSize: 12, fontWeight: "bold" },
  statusTextSuccess: { color: '#34C759' },
  statusTextError: { color: '#FF3B30' },
  statusTextPending: { color: '#FF9500' },
  bookingDetails: {
    marginBottom: 12,
  },
  bookingCustomer: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  bookingBarber: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  bookingService: {
    fontSize: 14,
    color: colors.textMuted,
  },
  bookingFooter: {
    alignItems: "flex-end",
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
