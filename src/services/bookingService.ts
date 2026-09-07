import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

export interface Barber {
  id: string;
  name: string;
  specialty: string;
  status: string;
  avatar: string | null;
  phone: string | null;
  rating: number;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
}

export interface Booking {
  id: string;
  barberId: string;
  barberName: string;
  serviceName: string;
  date: string;
  startTime: string;
  status: string;
  totalPrice: number;
  hasReview?: boolean;
}

export interface BarberSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOff: boolean;
}

/**
 * Fetch all active services
 */
export const getServices = async (): Promise<Service[]> => {
  const { data, error } = await supabase
    .from("Service")
    .select("*")
    .eq("isActive", true)
    .order("createdAt", { ascending: true });

  if (error) {
    console.error("Error fetching services:", error);
    return [];
  }

  return data.map((s: any) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    duration: `${s.duration} นาที`,
  }));
};

/**
 * Fetch all active barbers
 */
export const getBarbers = async (): Promise<Barber[]> => {
  const { data, error } = await supabase
    .from("Barber")
    .select(`
      id,
      status,
      specialties,
      avatar,
      phone,
      rating,
      User!userId (firstName, lastName)
    `)
    .eq("isActive", true);

  if (error) {
    console.error("Error fetching barbers:", error);
    return [];
  }

  return data.map((b: any) => ({
    id: b.id,
    name: b.User ? `${b.User.firstName} ${b.User.lastName}` : "Unknown",
    specialty: b.specialties || "ไม่ระบุ",
    status: b.status ? b.status.toLowerCase() : "available",
    avatar: b.avatar || null,
    phone: b.phone || null,
    rating: b.rating || 0,
  }));
};

/**
 * Fetch upcoming bookings for a specific customer
 */
export const getUpcomingBookings = async (customerId: string): Promise<Booking[]> => {
  const { data, error } = await supabase
    .from("Booking")
    .select(`
      id,
      date,
      startTime,
      status,
      totalPrice,
      createdAt,
      Barber:barberId ( User!userId (firstName, lastName) ),
      Service:serviceId ( name )
    `)
    .eq("customerId", customerId)
    .in("status", ["PENDING", "PENDING_PAYMENT", "CONFIRMED", "IN_PROGRESS"])
    .order("date", { ascending: true })
    .order("startTime", { ascending: true });

  if (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }

  const validBookings = data.filter((b: any) => {
    if (b.status === "PENDING_PAYMENT") {
      const isExpired = new Date().getTime() - new Date(b.createdAt).getTime() > 15 * 60 * 1000;
      return !isExpired;
    }
    return true;
  });

  return validBookings.map((b: any) => {
    let barberName = "Unknown Barber";
    if (b.Barber && b.Barber.User) {
      barberName = `${b.Barber.User.firstName} ${b.Barber.User.lastName}`;
    }
    
    let serviceName = "Unknown Service";
    if (b.Service && Array.isArray(b.Service) && b.Service.length > 0) {
      serviceName = b.Service[0].name;
    } else if (b.Service && b.Service.name) {
      serviceName = b.Service.name;
    }

    return {
      id: b.id,
      barberId: b.barberId || "",
      barberName,
      serviceName,
      date: b.date,
      startTime: b.startTime,
      status: b.status,
      totalPrice: b.totalPrice,
    };
  });
};

// Generate a UUID (React Native compatible)
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Create a new booking
 */
export const createBooking = async (bookingData: {
  customerId: string;
  barberId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
  totalPrice: number;
  couponId?: string;
  promoCodeId?: string;
  referenceImageUri?: string;
}): Promise<{ success: boolean; error?: string; bookingId?: string }> => {
  
  const bookingId = generateUUID();
  let uploadedReferenceUrl = null;

  if (bookingData.referenceImageUri) {
    try {
      const filename = `ref_${bookingId}_${Date.now()}.jpg`;
      
      const base64 = await FileSystem.readAsStringAsync(bookingData.referenceImageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("slips")
        .upload(filename, decode(base64), {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from("slips")
          .getPublicUrl(filename);
        uploadedReferenceUrl = publicUrlData.publicUrl;
      }
    } catch (err) {
      console.error("Error uploading reference image:", err);
    }
  }

  const { error } = await supabase.from("Booking").insert({
    id: bookingId,
    customerId: bookingData.customerId,
    barberId: bookingData.barberId,
    serviceId: bookingData.serviceId,
    date: bookingData.date,
    startTime: bookingData.startTime,
    endTime: bookingData.endTime,
    notes: bookingData.notes,
    totalPrice: bookingData.totalPrice,
    depositAmount: Math.min(50, bookingData.totalPrice),
    referenceImage: uploadedReferenceUrl,
    couponId: bookingData.couponId || null,
    promoCodeId: bookingData.promoCodeId || null,
    status: "PENDING_PAYMENT",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (error) {
    console.error("Error creating booking:", error.message);
    return { success: false, error: error.message };
  }

  // Mark coupon as used if applied
  if (bookingData.couponId) {
    await supabase
      .from("UserCoupon")
      .update({ isUsed: true, usedAt: new Date().toISOString() })
      .eq("id", bookingData.couponId);
  }

  // Increment promo code usage if applied
  if (bookingData.promoCodeId) {
    const { data: promoData } = await supabase
      .from("PromoCode")
      .select("currentUsage")
      .eq("id", bookingData.promoCodeId)
      .single();
      
    if (promoData) {
      await supabase
        .from("PromoCode")
        .update({ currentUsage: promoData.currentUsage + 1 })
        .eq("id", bookingData.promoCodeId);
    }
  }

  return { success: true, bookingId };
};

/**
 * Upload payment slip and confirm booking
 */
export const confirmPayment = async (
  bookingId: string,
  slipUri: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    let finalSlipUrl = null;

    if (slipUri !== "mock_slip_url") {
      const filename = `slip_${bookingId}_${Date.now()}.jpg`;
      
      const base64 = await FileSystem.readAsStringAsync(slipUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("slips")
        .upload(filename, decode(base64), {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return { success: false, error: uploadError.message };
      }

      const { data: publicUrlData } = supabase.storage
        .from("slips")
        .getPublicUrl(filename);
      
      finalSlipUrl = publicUrlData.publicUrl;
    }
    
    const { error: updateError } = await supabase
      .from("Booking")
      .update({
        slipImageUrl: finalSlipUrl,
        status: "CONFIRMED",
        updatedAt: new Date().toISOString()
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Update booking error:", updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Confirm payment error:", err);
    return { success: false, error: err.message };
  }
};

/**
 * Fetch booking history for a specific customer
 */
export const getBookingHistory = async (customerId: string): Promise<Booking[]> => {
  const { data, error } = await supabase
    .from("Booking")
    .select(`
      id,
      date,
      startTime,
      status,
      totalPrice,
      barberId,
      Barber:barberId ( User!userId (firstName, lastName) ),
      Service:serviceId ( name ),
      Review ( id )
    `)
    .eq("customerId", customerId)
    .in("status", ["COMPLETED", "CANCELLED", "NO_SHOW"])
    .order("date", { ascending: false })
    .order("startTime", { ascending: false });

  if (error) {
    console.error("Error fetching booking history:", error);
    return [];
  }

  return data.map((b: any) => {
    let barberName = "Unknown Barber";
    if (b.Barber && b.Barber.User) {
      barberName = `${b.Barber.User.firstName} ${b.Barber.User.lastName}`;
    }
    
    let serviceName = "Unknown Service";
    if (b.Service && Array.isArray(b.Service) && b.Service.length > 0) {
      serviceName = b.Service[0].name;
    } else if (b.Service && b.Service.name) {
      serviceName = b.Service.name;
    }

    return {
      id: b.id,
      barberId: b.barberId,
      barberName,
      serviceName,
      date: b.date,
      startTime: b.startTime,
      status: b.status,
      totalPrice: b.totalPrice,
      hasReview: Array.isArray(b.Review) ? b.Review.length > 0 : !!b.Review,
    };
  });
};

/**
 * Submit a review for a booking
 */
export const submitReview = async (bookingId: string, barberId: string, rating: number, comment: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const id = generateUUID();
  const { error } = await supabase.from("Review").insert({
    id,
    bookingId,
    userId: user.id,
    barberId,
    rating,
    comment,
    createdAt: new Date().toISOString(),
  });

  if (error) {
    console.error("Submit review error:", error);
    return { success: false, error: error.message };
  }

  // Update barber average rating
  const { data: reviews } = await supabase.from("Review").select("rating").eq("barberId", barberId);
  if (reviews && reviews.length > 0) {
    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = sum / reviews.length;
    await supabase.from("Barber").update({ rating: avg, updatedAt: new Date().toISOString() }).eq("id", barberId);
  }

  // Notify Owner
  const { data: owners } = await supabase.from("User").select("id").eq("role", "OWNER");
  if (owners && owners.length > 0) {
    const notifications = owners.map(owner => ({
      id: generateUUID(),
      userId: owner.id,
      title: "มีรีวิวใหม่จากลูกค้า",
      message: `ลูกค้าให้คะแนนช่าง ${rating} ดาว ${comment ? `พร้อมความคิดเห็น: "${comment}"` : ""}`,
      type: "REVIEW",
      createdAt: new Date().toISOString(),
    }));
    await supabase.from("Notification").insert(notifications);
  }

  return { success: true };
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (bookingId: string) => {
  const { error } = await supabase
    .from("Booking")
    .update({ status: "CANCELLED", updatedAt: new Date().toISOString() })
    .eq("id", bookingId);
  return { error };
};

/**
 * Fetch already-booked time slots for a barber on a specific date
 * Used to prevent double-booking the same slot
 */
export const getBookedSlots = async (
  barberId: string,
  date: string
): Promise<string[]> => {
  const { data, error } = await supabase
    .from("Booking")
    .select("startTime, status, createdAt")
    .eq("barberId", barberId)
    .eq("date", date)
    .in("status", ["PENDING", "PENDING_PAYMENT", "CONFIRMED", "IN_PROGRESS"]);

  if (error) {
    console.error("Error fetching booked slots:", error);
    return [];
  }

  return data.filter((b: any) => {
    if (b.status === "PENDING_PAYMENT") {
      const isExpired = new Date().getTime() - new Date(b.createdAt).getTime() > 15 * 60 * 1000;
      return !isExpired;
    }
    return true;
  }).map((b: any) => b.startTime);
};

/**
 * Fetch the schedule for a specific barber
 */
export const getBarberSchedule = async (barberId: string): Promise<BarberSchedule[]> => {
  const { data, error } = await supabase
    .from("BarberSchedule")
    .select("dayOfWeek, startTime, endTime, isOff")
    .eq("barberId", barberId);

  if (error) {
    console.error("Error fetching barber schedule:", error);
    return [];
  }

  return data as BarberSchedule[];
};
