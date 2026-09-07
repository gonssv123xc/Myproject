import { supabase } from "./supabase";

export interface BarberQueueItem {
  id: string;
  customerName: string;
  serviceName: string;
  date: string;
  startTime: string;
  status: string;
  price: number;
  depositAmount: number;
  couponName?: string;
  customerAvatar?: string;
}

export interface BarberScheduleDay {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOff: boolean;
}

export const getBarberQueue = async (barberId: string): Promise<BarberQueueItem[]> => {
  const { data, error } = await supabase
    .from("Booking")
    .select(`
      id,
      date,
      startTime,
      status,
      totalPrice,
      depositAmount,
      User!customerId (firstName, lastName, avatar),
      Service!serviceId (name),
      UserCoupon!couponId (
        Reward (name)
      )
    `)
    .eq("barberId", barberId)
    .in("status", ["PENDING", "PENDING_PAYMENT", "CONFIRMED", "IN_PROGRESS"])
    .order("date", { ascending: true })
    .order("startTime", { ascending: true });

  if (error) {
    console.error("Error fetching barber queue:", error.message);
    return [];
  }

  return data.map((b: any) => ({
    id: b.id,
    customerName: b.User ? `${b.User.firstName} ${b.User.lastName}` : "ลูกค้าทั่วไป",
    customerAvatar: b.User?.avatar || null,
    serviceName: (b.Service && b.Service.name) ? b.Service.name : "บริการ",
    date: b.date,
    startTime: b.startTime,
    status: b.status,
    price: b.totalPrice,
    depositAmount: b.depositAmount || 0,
    couponName: b.UserCoupon?.Reward?.name,
  }));
};

export const updateBookingStatus = async (bookingId: string, status: string) => {
  // First get booking to know customerId
  const { data: booking, error: fetchError } = await supabase
    .from("Booking")
    .select("customerId, status")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { error: fetchError };
  }

  const { error } = await supabase
    .from("Booking")
    .update({ status, updatedAt: new Date().toISOString() })
    .eq("id", bookingId);

  if (error) return { error };

  // Points Logic
  if (booking.status !== status) {
    if (status === "COMPLETED") {
      await addPointsToUser(booking.customerId, 1);
    } else if (status === "NO_SHOW") {
      await addPointsToUser(booking.customerId, 0.5);
    }
  }

  return { error: null };
};

const addPointsToUser = async (userId: string, pointsToAdd: number) => {
  const { data: user } = await supabase
    .from("User")
    .select("points")
    .eq("id", userId)
    .single();
    
  if (user) {
    await supabase
      .from("User")
      .update({ points: user.points + pointsToAdd })
      .eq("id", userId);
  }
};

/**
 * Update barber's own availability status in the Barber table
 * Maps UI key ("available"|"busy"|"break") → DB enum (AVAILABLE|BUSY|BREAK)
 */
export const updateBarberStatus = async (
  barberId: string,
  uiStatus: "available" | "busy" | "break"
): Promise<{ success: boolean; error?: string }> => {
  const statusMap: Record<string, string> = {
    available: "AVAILABLE",
    busy: "BUSY",
    break: "BREAK",
  };
  const dbStatus = statusMap[uiStatus];

  const { error } = await supabase
    .from("Barber")
    .update({ status: dbStatus, updatedAt: new Date().toISOString() })
    .eq("id", barberId);

  if (error) {
    console.error("Error updating barber status:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
};

export const getBarberSchedule = async (barberId: string): Promise<BarberScheduleDay[]> => {
  const { data, error } = await supabase
    .from("BarberSchedule")
    .select("*")
    .eq("barberId", barberId)
    .order("dayOfWeek", { ascending: true });

  if (error) {
    console.error("Error fetching schedule:", error.message);
    return [];
  }
  return data;
};

const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const updateBarberSchedule = async (barberId: string, schedule: BarberScheduleDay[]) => {
  for (const day of schedule) {
    if (day.id) {
      await supabase.from("BarberSchedule").update({
        startTime: day.startTime,
        endTime: day.endTime,
        isOff: day.isOff,
        updatedAt: new Date().toISOString(),
      }).eq("id", day.id);
    } else {
      await supabase.from("BarberSchedule").insert({
        id: generateUUID(),
        barberId,
        dayOfWeek: day.dayOfWeek,
        startTime: day.startTime,
        endTime: day.endTime,
        isOff: day.isOff,
        updatedAt: new Date().toISOString(),
      });
    }
  }
  return { success: true };
};

export interface UnsubmittedBookingItem {
  id: string;
  customerName: string;
  serviceName: string;
  date: string;
  startTime: string;
  price: number;
}

export const getCompletedUnsubmittedBookings = async (barberId: string): Promise<UnsubmittedBookingItem[]> => {
  const { data, error } = await supabase
    .from("Booking")
    .select(`
      id,
      date,
      startTime,
      totalPrice,
      User!customerId (firstName, lastName),
      Service!serviceId (name)
    `)
    .eq("barberId", barberId)
    .eq("status", "COMPLETED")
    .eq("isSubmittedToOwner", false)
    .order("date", { ascending: true })
    .order("startTime", { ascending: true });

  if (error) {
    console.error("Error fetching unsubmitted bookings:", error.message);
    return [];
  }

  return data.map((b: any) => ({
    id: b.id,
    customerName: b.User ? `${b.User.firstName} ${b.User.lastName}` : "ลูกค้าทั่วไป",
    serviceName: (b.Service && b.Service.name) ? b.Service.name : "บริการ",
    date: b.date,
    startTime: b.startTime,
    price: b.totalPrice,
  }));
};

export const submitWorkToOwner = async (bookingIds: string[]): Promise<{ success: boolean; error?: string }> => {
  if (bookingIds.length === 0) return { success: true };
  
  const { error } = await supabase
    .from("Booking")
    .update({ 
      isSubmittedToOwner: true, 
      updatedAt: new Date().toISOString() 
    })
    .in("id", bookingIds);

  if (error) {
    console.error("Error submitting work:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
};
