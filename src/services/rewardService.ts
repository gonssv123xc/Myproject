import { supabase } from "./supabase";

export interface Reward {
  id: string;
  name: string;
  description?: string;
  pointsCost: number;
  discountValue?: number;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SERVICE";
  imageUrl?: string;
}

export interface UserCoupon {
  id: string;
  rewardId: string;
  isUsed: boolean;
  usedAt?: string;
  createdAt: string;
  Reward?: Reward;
}

/**
 * Get all available rewards in the shop
 */
export const getAvailableRewards = async (): Promise<Reward[]> => {
  const { data, error } = await supabase
    .from("Reward")
    .select("*")
    .eq("isActive", true)
    .order("pointsCost", { ascending: true });

  if (error) {
    console.error("Error fetching rewards:", error);
    return [];
  }
  return data as Reward[];
};

/**
 * Redeem a reward using points
 */
export const redeemReward = async (
  userId: string,
  rewardId: string,
  pointsCost: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. Get current user points
    const { data: userData, error: userError } = await supabase
      .from("User")
      .select("points")
      .eq("id", userId)
      .single();

    if (userError || !userData) throw new Error("ไม่พบข้อมูลผู้ใช้งาน");

    if (userData.points < pointsCost) {
      return { success: false, error: "แต้มสะสมไม่เพียงพอ" };
    }

    // 2. Deduct points
    const { error: deductError } = await supabase
      .from("User")
      .update({ points: userData.points - pointsCost })
      .eq("id", userId);

    if (deductError) throw deductError;

    // 3. Create UserCoupon
    const { error: couponError } = await supabase
      .from("UserCoupon")
      .insert({
        userId,
        rewardId,
        isUsed: false,
      });

    if (couponError) {
      // Rollback points could be done here in a real scenario
      throw couponError;
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "เกิดข้อผิดพลาดในการแลกรางวัล" };
  }
};

/**
 * Get user's unused coupons
 */
export const getMyCoupons = async (userId: string): Promise<UserCoupon[]> => {
  const { data, error } = await supabase
    .from("UserCoupon")
    .select(`
      id, 
      rewardId, 
      isUsed, 
      createdAt,
      Reward (*)
    `)
    .eq("userId", userId)
    .eq("isUsed", false);

  if (error) {
    console.error("Error fetching coupons:", error);
    return [];
  }
  
  return data as unknown as UserCoupon[];
};
