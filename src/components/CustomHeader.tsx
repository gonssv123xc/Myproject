import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions, Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LogOut } from "lucide-react-native";
import { colors } from "../theme/colors";

interface CustomHeaderProps {
  title?: string;
  roleLabel?: string;
  onLogout?: () => void;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({
  title = "Sawasdee club",
  roleLabel,
  onLogout,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const navigation = useNavigation<any>();
  const route = useRoute();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require("../../assets/sawasdee_logo.jpg")} 
              style={{ width: "100%", height: "100%", borderRadius: 8 }} 
              resizeMode="cover" 
            />
          </View>
          <Text style={styles.title}>{title}</Text>
          {roleLabel ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{roleLabel}</Text>
            </View>
          ) : null}

          {/* Desktop Navigation Links */}
          {isDesktop && roleLabel === "ลูกค้า" && (
            <View style={styles.desktopNav}>
              <TouchableOpacity onPress={() => navigation.navigate("CustomerHome")} style={styles.navItem}>
                <Text style={[styles.navLink, route.name === "CustomerHome" && styles.navLinkActive]}>หน้าหลัก</Text>
                {route.name === "CustomerHome" && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("Booking")} style={styles.navItem}>
                <Text style={[styles.navLink, route.name === "Booking" && styles.navLinkActive]}>จองคิว</Text>
                {route.name === "Booking" && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("History")} style={styles.navItem}>
                <Text style={[styles.navLink, route.name === "History" && styles.navLinkActive]}>ประวัติ</Text>
                {route.name === "History" && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {onLogout ? (
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.7}>
            <LogOut size={16} color={colors.danger} />
            <Text style={styles.logoutText}>ออกจากระบบ</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "rgba(15, 23, 42, 0.4)", // Translucent dark
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {}) as any,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },
  badge: {
    backgroundColor: "rgba(59, 130, 246, 0.2)", // blue-500/20
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20, // pill shape
  },
  badgeText: {
    fontSize: 12,
    color: "#93C5FD", // blue-300
    fontWeight: "700",
  },
  desktopNav: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 32,
    gap: 24,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    height: 40,
  },
  navLink: {
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: "600",
  },
  navLinkActive: {
    color: colors.primary,
    fontWeight: "800",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 2,
    width: 20,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.1)", // red-500/10
  },
  logoutText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: "bold",
  },
});
