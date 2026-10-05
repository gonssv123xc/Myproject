import { supabase } from "./supabase";
import { createClient } from "@supabase/supabase-js";
import { decode } from "base64-arraybuffer";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Dedicated client for admin operations without overwriting the logged-in owner's session
const authAdminClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Generate a UUID (React Native compatible fallback)
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export interface AddBarberInput {
  name: string;
  email: string;
  password?: string;
  specialty?: string;
  phone?: string;
  avatar?: string;
}

/**
 * Add a new barber:
 * 1. Create Supabase Auth user without overriding current owner session
 * 2. If user already exists, update role to BARBER or reactivate if deleted
 * 3. Upload avatar if base64 image data provided
 * 4. Create/link Barber row
 */
export const addBarber = async (input: AddBarberInput): Promise<{ success: boolean; error?: string }> => {
  try {
    const DEFAULT_PASSWORD = input.password?.trim() || "password123";
    const emailClean = input.email.trim().toLowerCase();
    const nameTrimmed = input.name.trim();
    const nameParts = nameTrimmed.split(/\s+/);
    const firstName = nameParts[0] || "ช่าง";
    const lastName = nameParts.slice(1).join(" ") || " ";

    if (!emailClean || !emailClean.includes("@")) {
      return { success: false, error: "กรุณาระบุอีเมลให้ถูกต้อง" };
    }

    let userId: string | null = null;

    // 1. Create Auth user via isolated client (avoids logging out the owner)
    const { data: authData, error: authError } = await authAdminClient.auth.signUp({
      email: emailClean,
      password: DEFAULT_PASSWORD,
      options: { data: { firstName, lastName, role: "BARBER" } },
    });

    if (authError) {
      const errMsg = authError.message.toLowerCase();
      // If user already registered in auth, check if existing record can be converted to barber
      if (
        errMsg.includes("already registered") ||
        errMsg.includes("user_already_exists") ||
        (authError as any).status === 422
      ) {
        const { data: existingUser } = await supabase
          .from("User")
          .select("id, role, firstName, lastName")
          .eq("email", emailClean)
          .maybeSingle();

        if (existingUser) {
          // Check if already in Barber table
          const { data: existingBarber } = await supabase
            .from("Barber")
            .select("id, isActive, avatar")
            .eq("userId", existingUser.id)
            .maybeSingle();

          if (existingBarber) {
            if (existingBarber.isActive) {
              return { success: false, error: "อีเมลนี้ลงทะเบียนเป็นช่างในระบบอยู่แล้ว" };
            } else {
              // Reactivate soft-deleted barber
              let avatarUrl = existingBarber.avatar;
              if (input.avatar && input.avatar.startsWith("data:image")) {
                const uploaded = await uploadBarberAvatar(existingBarber.id, input.avatar);
                if (uploaded) avatarUrl = uploaded;
              }

              await supabase.from("Barber").update({
                specialties: input.specialty || "",
                phone: input.phone || null,
                avatar: avatarUrl,
                isActive: true,
                updatedAt: new Date().toISOString(),
              }).eq("id", existingBarber.id);

              await supabase.from("User").update({
                role: "BARBER",
                firstName,
                lastName,
                updatedAt: new Date().toISOString(),
              }).eq("id", existingUser.id);

              return { success: true };
            }
          }

          // User exists in User table (e.g. was customer), convert to barber
          userId = existingUser.id;
        } else {
          return { success: false, error: "อีเมลนี้มีอยู่ในระบบแล้ว กรุณาใช้อีเมลอื่น" };
        }
      } else if (errMsg.includes("rate limit") || errMsg.includes("over_email_send_rate_limit")) {
        return { success: false, error: "ระบบส่งอีเมลยืนยันเกินสิทธิ์ชั่วคราว กรุณารอสักครู่แล้วลองใหม่อีกครั้ง" };
      } else {
        return { success: false, error: "สร้างบัญชีช่างไม่สำเร็จ: " + authError.message };
      }
    } else {
      userId = authData?.user?.id || null;
    }

    if (!userId) {
      return { success: false, error: "ไม่สามารถสร้างบัญชีผู้ใช้ได้" };
    }

    // 2. Create or update User row
    const { error: userError } = await supabase.from("User").upsert({
      id: userId,
      email: emailClean,
      password: DEFAULT_PASSWORD,
      firstName,
      lastName,
      role: "BARBER",
      updatedAt: new Date().toISOString(),
    }, { onConflict: "id" });

    if (userError) {
      console.error("User row error:", userError.message);
      return { success: false, error: "บันทึกข้อมูลผู้ใช้ไม่สำเร็จ: " + userError.message };
    }

    // 3. Create Barber row and handle avatar upload if needed
    const barberId = generateUUID();
    let finalAvatarUrl = input.avatar || null;
    if (finalAvatarUrl && finalAvatarUrl.startsWith("data:image")) {
      const uploaded = await uploadBarberAvatar(barberId, finalAvatarUrl);
      if (uploaded) finalAvatarUrl = uploaded;
    }

    const { error: barberError } = await supabase.from("Barber").insert({
      id: barberId,
      userId,
      specialties: input.specialty || "",
      phone: input.phone || null,
      avatar: finalAvatarUrl,
      isActive: true,
      updatedAt: new Date().toISOString(),
    });

    if (barberError) {
      console.error("Barber row error:", barberError.message);
      return { success: false, error: "บันทึกข้อมูลช่างไม่สำเร็จ: " + barberError.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("addBarber unexpected error:", err);
    return { success: false, error: err.message || "เกิดข้อผิดพลาดในการเพิ่มช่าง" };
  }
};

/**
 * Soft-delete a barber by setting isActive = false on both Barber and User rows
 */
export const deleteBarber = async (barberId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get userId from Barber row first
    const { data: barberData, error: fetchError } = await supabase
      .from("Barber")
      .select("userId")
      .eq("id", barberId)
      .single();

    if (fetchError || !barberData) {
      return { success: false, error: "ไม่พบข้อมูลช่าง" };
    }

    // Soft-delete Barber
    const { error: barberError } = await supabase
      .from("Barber")
      .update({ isActive: false, updatedAt: new Date().toISOString() })
      .eq("id", barberId);

    if (barberError) {
      return { success: false, error: barberError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "ไม่สามารถลบช่างได้" };
  }
};

export interface DashboardStats {
  totalRevenue: number;
  revenueGrowth: number; // percentage
  totalCustomers: number;
  customersGrowth: number; // percentage
  bookingsToday: number;
  bookingsGrowth: number; // percentage
  revenueThisMonth: number;
  monthlyGrowth: number; // percentage
  weeklyRevenue: { day: string; amount: number }[];
  barberStats: BarberStat[];
}

export interface BarberStat {
  id?: string;
  name: string;
  revenue: number;
  percentage: number;
}

// (generateUUID is defined at top of file)

/**
 * Manage Services (Owner)
 */
export const addService = async (serviceData: { name: string; price: number; duration: number; description?: string }) => {
  const { data, error } = await supabase.from("Service").insert({
    id: generateUUID(),
    name: serviceData.name,
    price: serviceData.price,
    duration: serviceData.duration,
    description: serviceData.description || "",
    isActive: true,
    updatedAt: new Date().toISOString()
  }).select();

  return { data, error };
};

export const updateService = async (id: string, serviceData: { name: string; price: number; duration: number }) => {
  const { data, error } = await supabase.from("Service").update({
    name: serviceData.name,
    price: serviceData.price,
    duration: serviceData.duration,
    updatedAt: new Date().toISOString()
  }).eq("id", id).select();

  return { data, error };
};

export const deleteService = async (id: string) => {
  // Soft delete by setting isActive to false
  const { error } = await supabase.from("Service").update({
    isActive: false,
    updatedAt: new Date().toISOString()
  }).eq("id", id);

  return { error };
};

/**
 * Fetch Dashboard Statistics
 * This queries real bookings and calculates stats
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // 1. Get all customers count
  const { count: totalCustomersCount, error: userError } = await supabase
    .from("User")
    .select("*", { count: "exact", head: true })
    .eq("role", "CUSTOMER");

  // 2. Get all successful bookings for revenue
  const { data: allBookings, error: bookingError } = await supabase
    .from("Booking")
    .select("totalPrice, date, status, barberId, Barber:barberId ( User!userId (firstName, lastName) )")
    .in("status", ["CONFIRMED", "IN_PROGRESS", "COMPLETED"]);

  if (userError || bookingError) {
    console.error("Dashboard fetch error:", userError || bookingError);
  }

  let totalRevenue = 0;
  let revenueThisMonth = 0;
  let bookingsToday = 0;
  const barberRevenueMap: Record<string, {id: string, name: string, revenue: number}> = {};

  // Setup Weekly Revenue Map (Last 7 days)
  const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  const weeklyRevenueMap: Record<string, { day: string; amount: number }> = {};
  const last7Days: string[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    last7Days.push(dateStr);
    weeklyRevenueMap[dateStr] = { day: dayNames[d.getDay()], amount: 0 };
  }
  const weekStartDateStr = last7Days[0];

  if (allBookings) {
    allBookings.forEach((b: any) => {
      totalRevenue += b.totalPrice;
      
      const bookingDate = new Date(b.date).toISOString();
      const bookingDateStr = bookingDate.split('T')[0];

      if (bookingDate >= startOfMonth) {
        revenueThisMonth += b.totalPrice;
      }
      if (bookingDate >= startOfDay) {
        bookingsToday += 1;
      }
      if (bookingDateStr >= weekStartDateStr && weeklyRevenueMap[bookingDateStr]) {
        weeklyRevenueMap[bookingDateStr].amount += b.totalPrice;
      }

      // Barber revenue mapping
      const barberId = b.barberId || null;
      const barberName = (b.Barber && b.Barber.User) 
        ? `${b.Barber.User.firstName}` 
        : "Unknown";
      
      const key = barberId || barberName;
      if (!barberRevenueMap[key]) {
        barberRevenueMap[key] = { id: barberId, name: barberName, revenue: 0 };
      }
      barberRevenueMap[key].revenue += b.totalPrice;
    });
  }

  // Calculate Barber percentages
  const barberStats: BarberStat[] = Object.values(barberRevenueMap).map((b: any) => ({
    id: b.id,
    name: b.name,
    revenue: b.revenue,
    percentage: totalRevenue > 0 ? Math.round((b.revenue / totalRevenue) * 100) : 0
  })).sort((a, b) => b.revenue - a.revenue);

  const weeklyRevenue = last7Days.map(dateStr => weeklyRevenueMap[dateStr]);

  return {
    totalRevenue,
    revenueGrowth: 12, // Dummy growth for now until historical comparison is implemented
    totalCustomers: totalCustomersCount || 0,
    customersGrowth: 18, 
    bookingsToday,
    bookingsGrowth: 3, 
    revenueThisMonth,
    monthlyGrowth: 8,
    weeklyRevenue,
    barberStats
  };
};

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  experience: string;
  phone?: string;
  avatar?: string;
  status: string;
  rating: number;
  linkedCustomersCount: number;
}

export const getStaff = async (): Promise<StaffMember[]> => {
  const { data, error } = await supabase
    .from("Barber")
    .select(`
      id,
      specialties,
      phone,
      avatar,
      isActive,
      User!userId (firstName, lastName, role, email),
      BarberCustomerLink (count)
    `)
    .eq("isActive", true);

  if (error) {
    console.error("Error fetching staff:", error);
    return [];
  }

  return (data || []).map((b: any) => ({
    id: b.id,
    name: b.User ? `${b.User.firstName} ${b.User.lastName}`.trim() : "Unknown",
    email: b.User?.email || "",
    role: b.User && b.User.role === "BARBER" ? "ช่างตัดผม" : "พนักงาน",
    experience: b.specialties || "ไม่ระบุ",
    phone: b.phone || "",
    avatar: b.avatar || "",
    status: b.isActive ? "active" : "inactive",
    rating: 5.0, // Mock rating for now as we don't have reviews connected
    linkedCustomersCount: b.BarberCustomerLink?.[0]?.count || 0,
  }));
};

export const updateBarber = async (barberId: string, input: { name: string, specialty: string, phone?: string, avatar?: string }): Promise<{ success: boolean; error?: string }> => {
  // First get the userId for this barber
  const { data: barberData, error: fetchError } = await supabase
    .from("Barber")
    .select("userId")
    .eq("id", barberId)
    .single();

  if (fetchError || !barberData) {
    return { success: false, error: "ไม่พบข้อมูลช่าง" };
  }

  const firstName = input.name.trim().split(" ")[0];
  const lastName = input.name.trim().split(" ").slice(1).join(" ") || " ";

  // Update User table
  const { error: userError } = await supabase
    .from("User")
    .update({ firstName, lastName, updatedAt: new Date().toISOString() })
    .eq("id", barberData.userId);

  if (userError) {
    return { success: false, error: "บันทึกชื่อช่างไม่สำเร็จ" };
  }

  // Update Barber table
  const updateData: any = { 
    specialties: input.specialty, 
    updatedAt: new Date().toISOString() 
  };
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.avatar !== undefined) updateData.avatar = input.avatar;

  const { error: barberError } = await supabase
    .from("Barber")
    .update(updateData)
    .eq("id", barberId);

  if (barberError) {
    return { success: false, error: "บันทึกข้อมูลช่างไม่สำเร็จ" };
  }

  return { success: true };
};

export const searchCustomers = async (query: string) => {
  if (!query || query.length < 2) return [];
  const { data, error } = await supabase
    .from("User")
    .select("id, firstName, lastName, avatar")
    .eq("role", "CUSTOMER")
    .or(`firstName.ilike.%${query}%,lastName.ilike.%${query}%`)
    .limit(5);

  if (error) return [];
  return data.map(d => ({
    id: d.id,
    name: `${d.firstName} ${d.lastName}`.trim(),
    avatar: d.avatar,
  }));
};

export const getLinkedCustomers = async (barberId: string) => {
  const { data, error } = await supabase
    .from("BarberCustomerLink")
    .select("User (id, firstName, lastName, avatar)")
    .eq("barberId", barberId);

  if (error) return [];
  return data.map((d: any) => ({
    id: d.User.id,
    name: `${d.User.firstName} ${d.User.lastName}`.trim(),
    avatar: d.User.avatar,
  }));
};

export const linkCustomerToBarber = async (barberId: string, customerId: string) => {
  const { error } = await supabase
    .from("BarberCustomerLink")
    .insert({ barberId, customerId });
  
  if (error) {
    console.error("Link error:", error);
    return false;
  }
  return true;
};

export const unlinkCustomerFromBarber = async (barberId: string, customerId: string) => {
  const { error } = await supabase
    .from("BarberCustomerLink")
    .delete()
    .match({ barberId, customerId });
  
  if (error) {
    console.error("Unlink error:", error);
    return false;
  }
  return true;
};

// ... upload logic will be done using expo-image-picker in the component and standard fetch, 
// or base64 upload to supabase storage if needed. We'll add uploadBarberAvatar below.

export const uploadBarberAvatar = async (barberId: string, base64: string, ext: string = "jpg"): Promise<string | null> => {
  try {
    const fileName = `${barberId}-${Date.now()}.${ext}`;
    const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
    const arrayBuffer = decode(cleanBase64);

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(`barbers/${fileName}`, arrayBuffer, {
        contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        upsert: true
      });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(`barbers/${fileName}`);
      
    return publicUrl;
  } catch (err) {
    console.error("uploadBarberAvatar error:", err);
    return null;
  }
};

export const getReviews = async () => {
  const { data, error } = await supabase
    .from("Review")
    .select(`
      id,
      rating,
      comment,
      createdAt,
      User!userId (firstName, lastName),
      Barber!barberId ( User!userId (firstName) )
    `)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }

  return data.map((r: any) => ({
    id: r.id,
    customer: r.User ? `${r.User.firstName} ${r.User.lastName}` : "ลูกค้า",
    barber: r.Barber && r.Barber.User ? r.Barber.User.firstName : "ช่าง",
    rating: r.rating,
    comment: r.comment,
    date: new Date(r.createdAt).toLocaleDateString("th-TH"),
    avatar: `https://ui-avatars.com/api/?name=${r.User ? r.User.firstName : "C"}&background=random`,
  }));
};

export interface SubmittedWorkItem {
  id: string;
  barberName: string;
  customerName: string;
  serviceName: string;
  price: number;
  date: string;
  submittedAt: string;
}

export const getSubmittedWorks = async (limit: number = 10): Promise<SubmittedWorkItem[]> => {
  const { data, error } = await supabase
    .from("Booking")
    .select(`
      id,
      totalPrice,
      date,
      updatedAt,
      User!customerId (firstName, lastName),
      Service!serviceId (name),
      Barber!barberId ( User!userId (firstName) )
    `)
    .eq("status", "COMPLETED")
    .eq("isSubmittedToOwner", true)
    .order("updatedAt", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching submitted works:", error);
    return [];
  }

  return data.map((b: any) => ({
    id: b.id,
    barberName: b.Barber && b.Barber.User ? b.Barber.User.firstName : "ช่าง",
    customerName: b.User ? `${b.User.firstName} ${b.User.lastName}` : "ลูกค้าทั่วไป",
    serviceName: b.Service ? b.Service.name : "บริการ",
    price: b.totalPrice,
    date: b.date,
    submittedAt: b.updatedAt,
  }));
};

/**
 * Detailed Bookings for Dashboard Modals
 */
export const getDetailedBookings = async (period: "today" | "month") => {
  const now = new Date();
  let startDate = "";
  if (period === "today") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }

  const { data, error } = await supabase
    .from("Booking")
    .select(`
      id,
      totalPrice,
      date,
      startTime,
      status,
      User!customerId (firstName, lastName),
      Service!serviceId (name),
      Barber!barberId ( User!userId (firstName) )
    `)
    .in("status", ["CONFIRMED", "IN_PROGRESS", "COMPLETED"])
    .gte("date", startDate)
    .order("date", { ascending: false })
    .order("startTime", { ascending: false });

  if (error) {
    console.error("Error fetching detailed bookings:", error);
    return [];
  }

  return data.map((b: any) => ({
    id: b.id,
    customerName: b.User ? `${b.User.firstName} ${b.User.lastName}` : "ไม่ทราบชื่อ",
    barberName: b.Barber && b.Barber.User ? b.Barber.User.firstName : "ช่าง",
    serviceName: b.Service ? b.Service.name : "บริการ",
    price: b.totalPrice,
    date: b.date,
    time: b.startTime,
    status: b.status,
  }));
};

/**
 * Detailed Customers List for Dashboard Modal
 */
export const getAllCustomersDetailed = async () => {
  const { data, error } = await supabase
    .from("User")
    .select("id, firstName, lastName, phone, createdAt")
    .eq("role", "CUSTOMER")
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching customers:", error);
    return [];
  }

  return data.map((d: any) => ({
    id: d.id,
    name: `${d.firstName} ${d.lastName}`.trim(),
    phone: d.phone || "ไม่ระบุเบอร์",
    joinedAt: new Date(d.createdAt).toLocaleDateString("th-TH"),
  }));
};

/**
 * Detailed Bookings for a Specific Barber (Dashboard Modal)
 */
export const getBarberDetailedBookings = async (barberId: string) => {
  const { data, error } = await supabase
    .from("Booking")
    .select(`
      id,
      totalPrice,
      date,
      startTime,
      status,
      User!customerId (firstName, lastName),
      Service!serviceId (name)
    `)
    .eq("barberId", barberId)
    .in("status", ["CONFIRMED", "IN_PROGRESS", "COMPLETED"])
    .order("date", { ascending: false })
    .order("startTime", { ascending: false })
    .limit(30); // limit to recent 30 bookings for performance

  if (error) {
    console.error("Error fetching barber bookings:", error);
    return [];
  }

  return data.map((b: any) => ({
    id: b.id,
    customerName: b.User ? `${b.User.firstName} ${b.User.lastName}` : "ไม่ทราบชื่อ",
    barberName: "", // not needed as we know the barber
    serviceName: b.Service ? b.Service.name : "บริการ",
    price: b.totalPrice,
    date: b.date,
    time: b.startTime,
    status: b.status,
  }));
};


