import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as XLSX from 'xlsx';
import { ReportBooking, ReportSummary } from '../services/reportService';

export const exportToExcel = async (bookings: ReportBooking[], summary: ReportSummary, startDate: string, endDate: string) => {
  try {
    const dataToExport = bookings.map(b => ({
      'วันที่': b.date,
      'เวลา': b.startTime,
      'ชื่อลูกค้า': b.customerName,
      'ช่างตัดผม': b.barberName,
      'บริการ': b.serviceName,
      'สถานะ': b.status,
      'ราคา (บาท)': b.totalPrice
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");

    // Write to base64
    const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

    // Save to device
    const directory = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    if (!directory) throw new Error("No directory available");
    const uri = directory + `Report_${startDate}_${endDate}.xlsx`;
    await FileSystem.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64
    });

    // Share
    await Sharing.shareAsync(uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Export Report as Excel',
      UTI: 'com.microsoft.excel.xlsx'
    });
  } catch (error) {
    console.error("Excel Export Error:", error);
    throw error;
  }
};

export const exportToPDF = async (bookings: ReportBooking[], summary: ReportSummary, startDate: string, endDate: string) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            .summary { margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; }
            .summary-item { font-size: 16px; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; color: #333; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>รายงานสรุปการจอง</h1>
          <p style="text-align: center;">วันที่: ${startDate} ถึง ${endDate}</p>
          
          <div class="summary">
            <div class="summary-item"><strong>รายรับรวม (เฉพาะที่เสร็จสิ้น):</strong> ${summary.totalRevenue} บาท</div>
            <div class="summary-item"><strong>การจองทั้งหมด:</strong> ${summary.totalBookings} รายการ</div>
            <div class="summary-item"><strong>สำเร็จ:</strong> ${summary.completedBookings} รายการ</div>
            <div class="summary-item"><strong>ยกเลิก/ไม่มา:</strong> ${summary.cancelledBookings} รายการ</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>เวลา</th>
                <th>ลูกค้า</th>
                <th>ช่างตัดผม</th>
                <th>บริการ</th>
                <th>สถานะ</th>
                <th>ราคา</th>
              </tr>
            </thead>
            <tbody>
              ${bookings.map(b => `
                <tr>
                  <td>${b.date}</td>
                  <td>${b.startTime}</td>
                  <td>${b.customerName}</td>
                  <td>${b.barberName}</td>
                  <td>${b.serviceName}</td>
                  <td>${b.status}</td>
                  <td>${b.totalPrice} ฿</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html: htmlContent });

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Export Report as PDF',
      UTI: 'com.adobe.pdf'
    });
  } catch (error) {
    console.error("PDF Export Error:", error);
    throw error;
  }
};
