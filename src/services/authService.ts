import { supabase } from "./supabase";
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  password?: string;
  role: "CUSTOMER" | "BARBER" | "OWNER";
  avatar?: string;
  points?: number;
  createdAt?: string;
  updatedAt?: string;
}

const formatAuthError = (message: string): string => {
  const msgLower = message.toLowerCase();
  if (msgLower.includes("rate limit") || msgLower.includes("over_email_send_rate_limit")) {
    return "ระบบจำกัดการส่งอีเมลยืนยันเกินสิทธิ์ (กรุณาปิด 'Confirm email' ใน Supabase Dashboard -> Authentication -> Providers -> Email)";
  }
  if (msgLower.includes("already registered") || msgLower.includes("user_already_exists")) {
    return "อีเมลนี้ถูกลงทะเบียนเข้าใช้งานแล้ว";
  }
  if (msgLower.includes("invalid login credentials") || msgLower.includes("invalid_credentials")) {
    return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  }
  if (msgLower.includes("email not confirmed")) {
    return "อีเมลยังไม่ได้ยืนยัน (กรุณาปิด 'Confirm email' ใน Supabase Dashboard)";
  }
  return message;
};

/**
 * Register a new customer user with Supabase Auth and save profile info
 */
export const registerCustomer = async (data: {
  name: string;
  phone: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const emailClean = data.email.trim().toLowerCase();

    // 1. Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailClean,
      password: data.password,
      options: {
        data: {
          firstName: data.name.trim().split(" ")[0],
          lastName: data.name.trim().split(" ").slice(1).join(" ") || " ",
          phone: data.phone.trim(),
          role: "CUSTOMER",
        },
      },
    });

    if (authError) {
      return { success: false, error: formatAuthError(authError.message) };
    }

    if (!authData.user) {
      return { success: false, error: "ไม่สามารถสร้างบัญชีผู้ใช้ได้" };
    }

    // 2. Save user profile to User table
    const firstName = data.name.trim().split(" ")[0];
    const lastName = data.name.trim().split(" ").slice(1).join(" ") || " ";

    const profile = {
      id: authData.user.id,
      firstName: firstName,
      lastName: lastName,
      phone: data.phone.trim(),
      email: emailClean,
      password: data.password, // User table requires password
      role: "CUSTOMER",
      updatedAt: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from("User")
      .upsert(profile, { onConflict: "id" });

    if (profileError) {
      console.warn("Profile table insert warning:", profileError.message);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatAuthError(err.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก") };
  }
};

/**
 * Login user with email & password and retrieve profile
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> => {
  try {
    const emailClean = email.trim().toLowerCase();

    // 1. Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: emailClean,
      password,
    });

    if (authError) {
      return { success: false, error: formatAuthError(authError.message) };
    }

    if (!authData.user) {
      return { success: false, error: "ไม่พบข้อมูลผู้ใช้งาน" };
    }

    // 2. Fetch user profile from database
    const { data: profileData, error: profileError } = await supabase
      .from("User")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profileData) {
      // Fallback to metadata if profile record doesn't exist in table yet
      const metadata = authData.user.user_metadata || {};
      const fallbackProfile: UserProfile = {
        id: authData.user.id,
        firstName: metadata.firstName || "ผู้ใช้งาน",
        lastName: metadata.lastName || "",
        phone: metadata.phone || "",
        email: authData.user.email || emailClean,
        role: metadata.role || "CUSTOMER",
      };
      return { success: true, profile: fallbackProfile };
    }

    return { success: true, profile: profileData as UserProfile };
  } catch (err: any) {
    return { success: false, error: formatAuthError(err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ") };
  }
};

/**
 * Login / Register user with OAuth (Google, Facebook)
 */
export const signInWithOAuth = async (
  provider: 'google' | 'facebook'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const redirectUrl = makeRedirectUri({
      path: '/auth/callback',
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true, // Let expo handle the redirect on native
      },
    });

    if (error) {
      return { success: false, error: formatAuthError(error.message) };
    }

    if (data?.url) {
      if (Platform.OS === 'web') {
        window.location.href = data.url;
        return { success: true };
      }

      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      if (res.type === 'success' && res.url) {
        // Parse the URL hash for implicit flow or let supabase automatically handle it
        // The url usually looks like: exp://.../auth/callback#access_token=...&refresh_token=...
        const urlParams = new URL(res.url.replace('#', '?'));
        const access_token = urlParams.searchParams.get('access_token');
        const refresh_token = urlParams.searchParams.get('refresh_token');

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) {
            return { success: false, error: "เข้าสู่ระบบด้วย Social ไม่สำเร็จ: " + sessionError.message };
          }
        }
        
        return { success: true };
      } else if (res.type === 'cancel' || res.type === 'dismiss') {
        return { success: false, error: "ยกเลิกการเข้าสู่ระบบ" };
      }
    }
    return { success: false, error: "ไม่สามารถเปิดหน้าต่างล็อกอินได้" };
  } catch (err: any) {
    return { success: false, error: formatAuthError(err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Social") };
  }
};

/**
 * Get current logged in user's profile
 */
export const getCurrentProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) return null;

    const user = sessionData.session.user;
    const { data: profile } = await supabase
      .from("User")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) return profile as UserProfile;

    const metadata = user.user_metadata || {};
    return {
      id: user.id,
      firstName: metadata.firstName || "ผู้ใช้งาน",
      lastName: metadata.lastName || "",
      phone: metadata.phone || "",
      email: user.email || "",
      role: metadata.role || "CUSTOMER",
    };
  } catch {
    return null;
  }
};

/**
 * Update user profile details
 */
export const updateUserProfile = async (
  userId: string,
  data: { firstName: string; lastName: string; phone: string }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("User")
      .update({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;
    
    // Also update Auth metadata for fallback
    await supabase.auth.updateUser({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update profile" };
  }
};

/**
 * Upload an avatar image to Supabase storage and update the User profile
 */
export const uploadAvatar = async (
  userId: string,
  uri: string,
  mimeType: string = "image/jpeg"
): Promise<{ success: boolean; avatarUrl?: string; error?: string }> => {
  try {
    // Determine extension
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

    // For React Native / Expo, we need to convert the local URI to a blob or arrayBuffer
    // The easiest way is using fetch
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload to 'avatars' bucket
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, blob, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // Update User table with new avatar URL
    const { error: dbError } = await supabase
      .from("User")
      .update({ avatar: publicUrl })
      .eq("id", userId);

    if (dbError) throw dbError;

    return { success: true, avatarUrl: publicUrl };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to upload avatar" };
  }
};
