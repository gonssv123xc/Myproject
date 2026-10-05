import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ShopInfo {
  id: string;
  name: string;
  subtitle?: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  phone?: string;
  address?: string;
  openHours?: string;
  promptpayNumber?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  lineUrl?: string;
  tiktokUrl?: string;
  telegramChatId?: string;
  updatedAt?: string;
}

export const DEFAULT_SHOP_INFO: ShopInfo = {
  id: "default_shop",
  name: "ร้านตัดผม",
  subtitle: "ระบบจองคิวออนไลน์",
  logoUrl: null,
  coverUrl: null,
  phone: "090-360-3093",
  address: "ถนน จิระ ตำบล ในเมือง อ.เมืองบุรีรัมย์ บุรีรัมย์ 31000",
  openHours: "09:00 – 19:00",
  promptpayNumber: "0999999999",
  facebookUrl: "https://www.facebook.com/profile.php?id=100063824452415",
  instagramUrl: "https://instagram.com",
  lineUrl: "https://line.me",
  tiktokUrl: "https://tiktok.com",
  telegramChatId: "-5464640980",
};

/**
 * Returns appropriate image source (remote URI or distinct local asset) for a shop
 */
export const getShopLogoSource = (shop?: Partial<ShopInfo> | null, defaultIndex?: number): any => {
  if (shop?.logoUrl) {
    return { uri: shop.logoUrl };
  }
  const id = (shop?.id || "").toLowerCase();
  const name = (shop?.name || "").toLowerCase();

  if (id.includes("gentleman") || name.includes("gentleman")) {
    return require("../../assets/gentleman_logo.jpg");
  }
  if (id.includes("vintage") || name.includes("vintage")) {
    return require("../../assets/vintage_logo.jpg");
  }
  if (id.includes("default") || id.includes("sawasdee") || name.includes("ร้านตัดผม") || defaultIndex === 0) {
    return require("../../assets/sawasdee_logo.jpg");
  }
  return require("../../assets/app_logo.jpg");
};

const SELECTED_SHOP_KEY = "@selected_shop_id";

export const setSelectedShopId = async (shopId: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(SELECTED_SHOP_KEY, shopId);
  } catch (err) {
    console.error("setSelectedShopId error:", err);
  }
};

export const getSelectedShopId = async (): Promise<string> => {
  try {
    const id = await AsyncStorage.getItem(SELECTED_SHOP_KEY);
    return id || "default_shop";
  } catch {
    return "default_shop";
  }
};

/**
 * Fetch all available shops
 */
export const getAllShops = async (): Promise<ShopInfo[]> => {
  try {
    const { data, error } = await supabase
      .from("Shop")
      .select("*")
      .order("createdAt", { ascending: true });

    if (error) {
      console.warn("Error fetching all shops:", error.message);
      return [DEFAULT_SHOP_INFO];
    }

    if (!data || data.length === 0) {
      return [DEFAULT_SHOP_INFO];
    }

    return data as ShopInfo[];
  } catch (err) {
    console.error("getAllShops error:", err);
    return [DEFAULT_SHOP_INFO];
  }
};

/**
 * Fetch shop information by id. Fallbacks to default values if not found.
 */
export const getShopById = async (shopId: string): Promise<ShopInfo> => {
  try {
    const { data, error } = await supabase
      .from("Shop")
      .select("*")
      .eq("id", shopId)
      .maybeSingle();

    if (error || !data) {
      return getShopInfo();
    }

    return data as ShopInfo;
  } catch {
    return DEFAULT_SHOP_INFO;
  }
};

/**
 * Fetch current selected shop information. Fallbacks to default values if not yet configured.
 */
export const getShopInfo = async (shopId?: string): Promise<ShopInfo> => {
  try {
    const targetId = shopId || (await getSelectedShopId());

    const { data, error } = await supabase
      .from("Shop")
      .select("*")
      .eq("id", targetId)
      .maybeSingle();

    if (data) {
      return data as ShopInfo;
    }

    // If targetId was not found, grab first available shop
    const { data: firstShop } = await supabase
      .from("Shop")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (firstShop) {
      return firstShop as ShopInfo;
    }

    return DEFAULT_SHOP_INFO;
  } catch (err) {
    console.error("getShopInfo exception:", err);
    return DEFAULT_SHOP_INFO;
  }
};

/**
 * Update shop details (name, logo, cover image, phone, address, etc.)
 */
export const updateShopInfo = async (
  shopId: string = "default_shop",
  updates: Partial<ShopInfo>
): Promise<{ success: boolean; data?: ShopInfo; error?: string }> => {
  try {
    const payload = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("Shop")
      .update(payload)
      .eq("id", shopId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error updating shop info:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as ShopInfo };
  } catch (err: any) {
    console.error("updateShopInfo exception:", err);
    return { success: false, error: err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }
};

/**
 * Upload shop image (logo or cover banner) to Supabase Storage
 */
export const uploadShopImage = async (
  imageUri: string,
  type: "logo" | "cover"
): Promise<string | null> => {
  try {
    const ext = imageUri.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `shops/${type}_${Date.now()}.${ext}`;

    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filename, decode(base64), {
        contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload shop image:", uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filename);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("uploadShopImage exception:", err);
    return null;
  }
};

/**
 * Subscribe to real-time changes to the Shop table
 */
export const subscribeToShopUpdates = (
  onUpdate: (shop: ShopInfo) => void
) => {
  const channelName = `shop_realtime_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "Shop" },
      (payload) => {
        if (payload.new) {
          onUpdate(payload.new as ShopInfo);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Create a new shop in the Shop table
 */
export const createShop = async (
  shopData: Omit<ShopInfo, "id" | "updatedAt"> & { id?: string }
): Promise<{ success: boolean; shop?: ShopInfo; error?: string }> => {
  try {
    const newId = shopData.id || `shop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const record = {
      id: newId,
      name: shopData.name.trim(),
      subtitle: shopData.subtitle?.trim() || "ระบบจองคิวออนไลน์",
      logoUrl: shopData.logoUrl || null,
      coverUrl: shopData.coverUrl || null,
      phone: shopData.phone?.trim() || "",
      address: shopData.address?.trim() || "",
      openHours: shopData.openHours?.trim() || "09:00 – 19:00",
      promptpayNumber: shopData.promptpayNumber?.trim() || "",
      facebookUrl: shopData.facebookUrl?.trim() || "",
      instagramUrl: shopData.instagramUrl?.trim() || "",
      lineUrl: shopData.lineUrl?.trim() || "",
      tiktokUrl: shopData.tiktokUrl?.trim() || "",
      createdAt: now,
      updatedAt: now,
    };

    const { data, error } = await supabase
      .from("Shop")
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error("createShop error:", error.message);
      return { success: false, error: error.message };
    }

    // Set as the current selected shop for the creator
    await setSelectedShopId(newId);

    return { success: true, shop: data as ShopInfo };
  } catch (err: any) {
    console.error("createShop exception:", err);
    return { success: false, error: err.message || "ไม่สามารถสร้างข้อมูลร้านได้" };
  }
};

