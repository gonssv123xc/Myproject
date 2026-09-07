# Sawasdee Club (ระบบจองคิวร้านตัดผม สวัสดีคลับ)

แอปพลิเคชันระบบจองคิวและบริหารจัดการร้านตัดผม "สวัสดีคลับ" พัฒนาด้วย React Native (Expo) ร่วมกับ Supabase (Backend/Database)

## 📱 เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend:** React Native, Expo SDK 57, React Navigation
- **Backend & Database:** Supabase, Prisma ORM
- **Features & Libraries:**
  - `promptpay-qr` และ `react-native-qrcode-svg`: สำหรับสร้าง QR Code ชำระเงิน
  - `expo-print`: สำหรับพิมพ์และสร้างเอกสาร PDF
  - `xlsx`: สำหรับส่งออกข้อมูลเป็นไฟล์ Excel
  - `lucide-react-native` และ `@expo/vector-icons`: สำหรับไอคอนในแอปพลิเคชัน

## 🚀 การติดตั้งและใช้งานเบื้องต้น (Getting Started)

### ความต้องการของระบบ (Prerequisites)

- Node.js
- npm หรือ yarn
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### ขั้นตอนการติดตั้ง (Installation Steps)

1. **โคลนโปรเจ็กต์และเข้าสู่โฟลเดอร์**
   ```sh
   git clone <YOUR_GIT_URL>
   cd "project จบระบบจองคิวสวัสดีคลับ"
   ```

2. **ติดตั้ง Dependencies**
   ```sh
   npm install
   ```

3. **ตั้งค่า Environment Variables**
   สร้างไฟล์ `.env` ที่ root ของโปรเจ็กต์ (สามารถคัดลอกจาก `.env.example`)
   ```sh
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **รันเซิร์ฟเวอร์สำหรับการพัฒนา**
   ```sh
   npm start
   # หรือ
   npx expo start
   ```

## 📦 โครงสร้างโปรเจ็กต์หลัก
- `src/` หรือ `app/` - โค้ดส่วนหน้าจอ คอมโพเนนต์ และการตั้งค่า
- `prisma/` - โครงสร้างและเครื่องมือจัดการฐานข้อมูล (Prisma Schema)
- `assets/` - รูปภาพ ฟอนต์ และทรัพยากรอื่นๆ

## 📜 ลิขสิทธิ์ (License)

อ้างอิงจากไฟล์ [LICENSE](./LICENSE)
