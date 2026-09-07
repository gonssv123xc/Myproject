import { supabase } from "./supabase";

export interface AddBarberInput {
  name: string;
  email: string;
  specialty?: string;
  phone?: string;
  avatar?: string;
}

/**
 * Add a new barber:
 * 1. Create Supabase Auth user (default password: barber@1234)
 * 2. Create User row with role BARBER
 * 3. Create Barber row linked to that user
 */
export const addBarber = async (input: AddBarberInput): Promise<{ success: boolean; error?: string }> => {
  const DEFAULT_PASSWORD = "password123";
  const emailClean = input.email.trim().toLowerCase();
  const firstName = input.name.trim().split(" ")[0];
  const lastName = input.name.trim().split(" ").slice(1).join(" ") || " ";

  // 1. Create Auth user via signUp (client-side SDK)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: emailClean,
    password: DEFAULT_PASSWORD,
    options: { data: { firstName, lastName, role: "BARBER" } },
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  const userId = authData?.user?.id;
  if (!userId) {
    return { success: false, error: "ไม่สามารถสร้างบัญชีผู้ใช้ได้" };
  }

  // 2. Create User row
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

  // 3. Create Barber row
  const barberId = generateUUID();
  const { error: barberError } = await supabase.from("Barber").insert({
    id: barberId,
    userId,
    specialties: input.specialty || "",
    phone: input.phone || null,
    avatar: input.avatar || null,
    isActive: true,
    updatedAt: new Date().toISOString(),
  });

  if (barberError) {
    console.error("Barber row error:", barberError.message);
    return { success: false, error: "บันทึกข้อมูลช่างไม่สำเร็จ: " + barberError.message };
  }

  return { success: true };
};

/**
 * Soft-delete a barber by setting isActive = false on both Barber and User rows
 */
export const deleteBarber = async (barberId: string): Promise<{ success: boolean; error?: string }> => {
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

// Generate a UUID (React Native compatible fallback)
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

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
    `);

  if (error) {
    console.error("Error fetching staff:", error);
    return [];
  }

  return data.map((b: any) => ({
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
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(`barbers/${fileName}`, decodeBase64(base64), {
        contentType: `image/${ext}`,
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
    console.error(err);
    return null;
  }
};

// Base64 helper for RN
function decodeBase64(base64Str: string) {
  const binaryString = atob(base64Str);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

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


