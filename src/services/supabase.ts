import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore จำกัด value ไม่เกิน 2048 bytes ต่อ key
// ใช้ chunking สำหรับ token ที่ยาวเกิน
const CHUNK_SIZE = 1800;

const chunkKey = (key: string, index: number) => `${key}_chunk_${index}`;

const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // ลองอ่าน chunk count ก่อน
      const countStr = await SecureStore.getItemAsync(`${key}_count`);
      if (countStr) {
        const count = parseInt(countStr, 10);
        let value = '';
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(chunkKey(key, i));
          if (chunk === null) return null;
          value += chunk;
        }
        return value;
      }
      // fallback: อ่านตรงๆ (กรณี value สั้น)
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (value.length <= CHUNK_SIZE) {
        await SecureStore.setItemAsync(key, value);
        // ลบ chunk เก่าถ้ามี
        await SecureStore.deleteItemAsync(`${key}_count`).catch(() => {});
      } else {
        // แบ่ง chunk
        const chunks = [];
        for (let i = 0; i < value.length; i += CHUNK_SIZE) {
          chunks.push(value.slice(i, i + CHUNK_SIZE));
        }
        for (let i = 0; i < chunks.length; i++) {
          await SecureStore.setItemAsync(chunkKey(key, i), chunks[i]);
        }
        await SecureStore.setItemAsync(`${key}_count`, String(chunks.length));
        // ลบ key หลักเดิมถ้ามี
        await SecureStore.deleteItemAsync(key).catch(() => {});
      }
    } catch (e) {
      console.warn('SecureStore setItem error:', e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key).catch(() => {});
      const countStr = await SecureStore.getItemAsync(`${key}_count`);
      if (countStr) {
        const count = parseInt(countStr, 10);
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(chunkKey(key, i)).catch(() => {});
        }
        await SecureStore.deleteItemAsync(`${key}_count`).catch(() => {});
      }
    } catch {
      // ignore
    }
  },
};

const inMemoryStorage: Record<string, string> = {};

const ExpoStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem(key)
        : inMemoryStorage[key] || null;
    }
    try {
      const val = await SecureStoreAdapter.getItem(key);
      return val ?? null;
    } catch {
      return inMemoryStorage[key] || null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      } else {
        inMemoryStorage[key] = value;
      }
      return;
    }
    try {
      await SecureStoreAdapter.setItem(key, value);
    } catch {
      inMemoryStorage[key] = value;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      } else {
        delete inMemoryStorage[key];
      }
      return;
    }
    try {
      await SecureStoreAdapter.removeItem(key);
    } catch {
      delete inMemoryStorage[key];
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase Warning: Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'barbershop-app',
    },
  },
});
