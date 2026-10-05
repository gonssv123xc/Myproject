import { createNavigationContainerRef } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Safely reset the root navigator to the target screen from anywhere in the app
 */
export function resetToRoot(screenName: keyof RootStackParamList) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: screenName as any }],
    });
  }
}
