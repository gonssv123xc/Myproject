import { supabase } from "./supabase";

export interface PromoCode {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxUsage: number | null;
  currentUsage: number;
  expiresAt: string | null;
  isActive: boolean;
}

/**
 * Validate a promo code
 */
export const validatePromoCode = async (code: string): Promise<{ success: boolean; data?: PromoCode; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from("PromoCode")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .single();

    if (error || !data) {
      return { success: false, error: "โค้ดส่วนลดไม่ถูกต้องหรือไม่มีในระบบ" };
    }

    const promo = data as PromoCode;

    if (!promo.isActive) {
      return { success: false, error: "โค้ดส่วนลดนี้ไม่สามารถใช้งานได้แล้ว" };
    }

    if (promo.maxUsage !== null && promo.currentUsage >= promo.maxUsage) {
      return { success: false, error: "โค้ดส่วนลดนี้ถูกใช้งานครบตามจำนวนที่กำหนดแล้ว" };
    }

    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return { success: false, error: "โค้ดส่วนลดนี้หมดอายุแล้ว" };
    }

    return { success: true, data: promo };
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดในการตรวจสอบโค้ดส่วนลด" };
  }
};
