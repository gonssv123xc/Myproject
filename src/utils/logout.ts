import { Alert, Platform } from "react-native";
import { supabase } from "../services/supabase";

export const confirmLogout = (
  navigation: any,
  targetScreen: "Login" | "StaffLogin" = "Login"
) => {
  const doLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.log("Error signing out:", e);
    }
    const rootNav = navigation.getParent?.() || navigation;
    rootNav.reset({
      index: 0,
      routes: [{ name: targetScreen }],
    });
  };

  if (Platform.OS === "web") {
    const confirmed = window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?");
    if (confirmed) {
      doLogout();
    }
  } else {
    Alert.alert(
      "ออกจากระบบ",
      "คุณต้องการออกจากระบบใช่หรือไม่?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ออกจากระบบ",
          style: "destructive",
          onPress: doLogout,
        },
      ]
    );
  }
};

