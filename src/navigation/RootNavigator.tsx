import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { StaffLoginScreen } from "../screens/auth/StaffLoginScreen";
import { OwnerRegisterScreen } from "../screens/auth/OwnerRegisterScreen";
import { SelectShopScreen } from "../screens/customer/SelectShopScreen";
import { CustomerNavigator } from "./CustomerNavigator";
import { BarberNavigator } from "./BarberNavigator";
import { OwnerNavigator } from "./OwnerNavigator";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="StaffLogin" component={StaffLoginScreen} />
      <Stack.Screen name="OwnerRegister" component={OwnerRegisterScreen} />
      <Stack.Screen name="SelectShop" component={SelectShopScreen} />
      <Stack.Screen name="CustomerMain" component={CustomerNavigator} />
      <Stack.Screen name="BarberMain" component={BarberNavigator} />
      <Stack.Screen name="OwnerMain" component={OwnerNavigator} />
    </Stack.Navigator>
  );
};
