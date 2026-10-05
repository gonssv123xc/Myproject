/**
 * Telegram Notification Service
 * รองรับการส่งแจ้งเตือนทั้ง:
 * 1. กลุ่ม Telegram ของร้านตัดผมแต่ละร้าน (หรือ Default Group)
 * 2. Telegram ส่วนตัวของลูกค้า
 */

const BOT_TOKEN = process.env.EXPO_PUBLIC_TELEGRAM_BOT_TOKEN || "8085150979:AAEFWMsuNE0Se7JMbHfENM2-bSrdU-8Ky94";
const BOT_USERNAME = process.env.EXPO_PUBLIC_TELEGRAM_BOT_USERNAME || "barber_booking_alert_bot";
export const DEFAULT_SHOP_CHAT_ID = process.env.EXPO_PUBLIC_DEFAULT_TELEGRAM_CHAT_ID || "-5464640980";

export interface BookingNotificationData {
  bookingId?: string;
  shopName: string;
  customerName: string;
  customerPhone?: string;
  barberName: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime?: string;
  totalPrice: number;
  depositAmount?: number;
  notes?: string;
  status?: string;
}

/**
 * ส่งข้อความไปยัง Telegram API โดยตรง
 */
export const sendTelegramMessage = async (
  chatId: string | number,
  htmlText: string
): Promise<{ success: boolean; error?: string }> => {
  if (!chatId || !BOT_TOKEN) {
    console.warn("Telegram: Missing chatId or BOT_TOKEN");
    return { success: false, error: "Missing chatId or BOT_TOKEN" };
  }

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.warn("Telegram API Error:", data.description);
      return { success: false, error: data.description };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Telegram send error:", err);
    return { success: false, error: err.message || "Network error" };
  }
};

/**
 * 1. ส่งแจ้งเตือนไปยังกลุ่ม Telegram ของร้านค้า / ช่าง
 */
export const notifyShopNewBooking = async (
  targetChatId: string | number | undefined,
  data: BookingNotificationData
): Promise<boolean> => {
  const chatId = targetChatId || DEFAULT_SHOP_CHAT_ID;
  if (!chatId) return false;

  const dateFormatted = data.date.includes("T") ? data.date.split("T")[0] : data.date;
  const timeFormatted = data.endTime ? `${data.startTime} - ${data.endTime} น.` : `${data.startTime} น.`;

  const message = `
💈 <b>แจ้งเตือนคิวใหม่! [${data.shopName}]</b>
━━━━━━━━━━━━━━━━━
👤 <b>ลูกค้า:</b> ${data.customerName}
📞 <b>เบอร์โทร:</b> ${data.customerPhone || "ไม่ได้ระบุ"}
✂️ <b>บริการ:</b> ${data.serviceName}
👨‍💼 <b>ช่าง:</b> ${data.barberName}
📅 <b>วันที่:</b> ${dateFormatted}
⏰ <b>เวลา:</b> ${timeFormatted}
💰 <b>ยอดชำระ:</b> ${data.totalPrice.toLocaleString()} บาท
💵 <b>มัดจำ:</b> ${data.depositAmount ? `${data.depositAmount} บาท` : "ชำระเต็มจำนวน"}
${data.notes ? `📝 <b>หมายเหตุ:</b> ${data.notes}\n` : ""}📌 <b>สถานะ:</b> รอตรวจสอบ / ยืนยัน
━━━━━━━━━━━━━━━━━
<i>ระบบจองคิวออนไลน์อัตโนมัติ</i>
`.trim();

  const res = await sendTelegramMessage(chatId, message);
  return res.success;
};

/**
 * 2. ส่งใบยืนยันการจองไปยัง Telegram ส่วนตัวของลูกค้า
 */
export const notifyCustomerBookingSuccess = async (
  customerChatId: string | number,
  data: BookingNotificationData
): Promise<boolean> => {
  if (!customerChatId) return false;

  const dateFormatted = data.date.includes("T") ? data.date.split("T")[0] : data.date;
  const timeFormatted = data.endTime ? `${data.startTime} - ${data.endTime} น.` : `${data.startTime} น.`;

  const message = `
🎉 <b>ยืนยันการจองคิวสำเร็จ!</b>
ขอบคุณที่ใช้บริการ <b>${data.shopName}</b>

📋 <b>รายละเอียดคิวของคุณ:</b>
━━━━━━━━━━━━━━━━━
✂️ <b>บริการ:</b> ${data.serviceName}
👨‍💼 <b>ช่างผู้ให้บริการ:</b> ${data.barberName}
📅 <b>วันที่:</b> ${dateFormatted}
⏰ <b>เวลา:</b> ${timeFormatted}
💰 <b>ยอดรวม:</b> ${data.totalPrice.toLocaleString()} บาท
${data.bookingId ? `🔖 <b>รหัสคิว:</b> <code>${data.bookingId.slice(0, 8)}</code>\n` : ""}━━━━━━━━━━━━━━━━━
📍 กรุณามาถึงร้านก่อนเวลานัดหมาย 5-10 นาที
หากต้องการเลื่อนหรือยกเลิก กรุณาแจ้งล่วงหน้าผ่านแอปพลิเคชัน
`.trim();

  const res = await sendTelegramMessage(customerChatId, message);
  return res.success;
};

/**
 * แจ้งเตือนเมื่อคิวถูกยกเลิก (ส่งให้ทั้งร้านหรือลูกค้า)
 */
export const notifyBookingCancelled = async (
  chatId: string | number,
  data: {
    shopName: string;
    customerName: string;
    date: string;
    startTime: string;
    cancelledBy: "customer" | "shop";
  }
): Promise<boolean> => {
  if (!chatId) return false;

  const who = data.cancelledBy === "customer" ? "ลูกค้ากดยกเลิกการจอง" : "ร้านค้าได้ยกเลิกคิว";
  const message = `
⚠️ <b>แจ้งเตือน: ยกเลิกการจองคิว [${data.shopName}]</b>
━━━━━━━━━━━━━━━━━
👤 <b>ลูกค้า:</b> ${data.customerName}
📅 <b>วันเวลา:</b> ${data.date} เวลา ${data.startTime} น.
📌 <b>รายละเอียด:</b> ${who}
━━━━━━━━━━━━━━━━━
`.trim();

  const res = await sendTelegramMessage(chatId, message);
  return res.success;
};

/**
 * คืนค่า Link สำหรับให้ลูกค้ากดเปิด Telegram Bot เพื่อเชื่อมต่อ
 * เมื่อกด ระบบจะพาไปเปิดแชทกับบอตพร้อมคำสั่ง start
 */
export const getTelegramConnectLink = (userId?: string): string => {
  if (userId) {
    return `https://t.me/${BOT_USERNAME}?start=${userId}`;
  }
  return `https://t.me/${BOT_USERNAME}`;
};
