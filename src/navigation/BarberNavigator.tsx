import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Calendar } from "lucide-react-native";
import { BarberTabParamList } from "../types/navigation";
import { colors } from "../theme/colors";
import { BarberDashboardScreen } from "../screens/barber/BarberDashboardScreen";
import { ScheduleScreen } from "../screens/barber/ScheduleScreen";

const Tab = createBottomTabNavigator<BarberTabParamList>();

export const BarberNavigator = () => {
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
        name="BarberHome"
        component={BarberDashboardScreen}
        options={{
          tabBarLabel: "คิวงาน",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarLabel: "ตารางงาน",
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
