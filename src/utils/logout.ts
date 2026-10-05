import { Alert, Platform } from "react-native";
import { supabase } from "../services/supabase";
import { navigationRef, resetToRoot } from "../navigation/navigationRef";
import { RootStackParamList } from "../types/navigation";

export const confirmLogout = (
  navigation?: any,
  targetScreen: keyof RootStackParamList = "Login"
) => {
  const doLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.log("Error signing out:", e);
    }

    try {
      if (navigationRef.isReady()) {
        resetToRoot(targetScreen);
        return;
      }

      let rootNav = navigation;
      while (rootNav?.getParent?.()) {
        rootNav = rootNav.getParent();
      }

      if (rootNav?.reset) {
        rootNav.reset({
          index: 0,
          routes: [{ name: targetScreen }],
        });
      } else if (rootNav?.navigate) {
        rootNav.navigate(targetScreen);
      }
    } catch (navErr) {
      console.error("Logout navigation reset error:", navErr);
      if (navigation?.navigate) {
        navigation.navigate(targetScreen);
      }
    }
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

