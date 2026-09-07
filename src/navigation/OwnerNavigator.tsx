import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BarChart3, Settings, Users, Star, ClipboardList } from "lucide-react-native";
import { OwnerTabParamList } from "../types/navigation";
import { colors } from "../theme/colors";
import { OwnerDashboardScreen } from "../screens/owner/OwnerDashboardScreen";
import { ServicesScreen } from "../screens/owner/ServicesScreen";
import { StaffScreen } from "../screens/owner/StaffScreen";
import { ReviewsScreen } from "../screens/owner/ReviewsScreen";
import { ReportScreen } from "../screens/owner/ReportScreen";

const Tab = createBottomTabNavigator<OwnerTabParamList>();

export const OwnerNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="OwnerHome"
        component={OwnerDashboardScreen}
        options={{
          tabBarLabel: "แดชบอร์ด",
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Services"
        component={ServicesScreen}
        options={{
          tabBarLabel: "บริการ",
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Staff"
        component={StaffScreen}
        options={{
          tabBarLabel: "พนักงาน",
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Reviews"
        component={ReviewsScreen}
        options={{
          tabBarLabel: "รีวิว",
          tabBarIcon: ({ color, size }) => <Star size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportScreen}
        options={{
          tabBarLabel: "รายงาน",
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
