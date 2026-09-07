import React from "react";
import { Platform, useWindowDimensions } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Calendar, Clock, User, Store } from "lucide-react-native";
import { CustomerTabParamList } from "../types/navigation";
import { colors } from "../theme/colors";
import { CustomerHomeScreen } from "../screens/customer/CustomerHomeScreen";
import { BookingScreen } from "../screens/customer/BookingScreen";
import { HistoryScreen } from "../screens/customer/HistoryScreen";
import { ProfileScreen } from "../screens/customer/ProfileScreen";
import { RewardShopScreen } from "../screens/customer/RewardShopScreen";

const Tab = createBottomTabNavigator<CustomerTabParamList>();

export const CustomerNavigator = () => {
  const { width } = useWindowDimensions();
  const paddingH = width > 480 ? (width - 480) / 2 : 0;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: { flex: 1, backgroundColor: "#080C1A" },
        tabBarStyle: {
          backgroundColor: "rgba(15, 23, 42, 0.92)",
          borderTopColor: "rgba(255,255,255,0.12)",
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 70,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingTop: 12,
          position: 'absolute',
          bottom: 0,
          width: '100%',
          paddingHorizontal: paddingH,
          ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)' } as any : {}),
        },
        tabBarActiveTintColor: "#FBBF24",
        tabBarInactiveTintColor: "#CBD5E1",
      }}
    >
      <Tab.Screen
        name="CustomerHome"
        component={CustomerHomeScreen}
        options={{
          tabBarLabel: "หน้าหลัก",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Booking"
        component={BookingScreen}
        options={{
          tabBarLabel: "จองคิว",
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: "ประวัติ",
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="RewardShop"
        component={RewardShopScreen}
        options={{
          tabBarLabel: "ร้านค้า",
          tabBarIcon: ({ color, size }) => <Store size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "โปรไฟล์",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
