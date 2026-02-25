import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Scissors, Home, Calendar, Clock, User, LogOut, Settings, BarChart3, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

interface AppLayoutProps {
  children: ReactNode;
  role: "customer" | "barber" | "owner";
}

const navItems: Record<string, NavItem[]> = {
  customer: [
    { label: "หน้าหลัก", href: "/customer", icon: <Home className="w-5 h-5" /> },
    { label: "จองคิว", href: "/customer/booking", icon: <Calendar className="w-5 h-5" /> },
    { label: "ประวัติ", href: "/customer/history", icon: <Clock className="w-5 h-5" /> },
    { label: "โปรไฟล์", href: "/customer/profile", icon: <User className="w-5 h-5" /> },
  ],
  barber: [
    { label: "คิวงาน", href: "/barber", icon: <Home className="w-5 h-5" /> },
    { label: "ตารางงาน", href: "/barber/schedule", icon: <Calendar className="w-5 h-5" /> },
    { label: "โปรไฟล์", href: "/barber/profile", icon: <User className="w-5 h-5" /> },
  ],
  owner: [
    { label: "แดชบอร์ด", href: "/owner", icon: <BarChart3 className="w-5 h-5" /> },
    { label: "บริการ", href: "/owner/services", icon: <Settings className="w-5 h-5" /> },
    { label: "พนักงาน", href: "/owner/staff", icon: <Users className="w-5 h-5" /> },
    { label: "รีวิว", href: "/owner/reviews", icon: <Star className="w-5 h-5" /> },
  ],
};

const roleLabels = { customer: "ลูกค้า", barber: "ช่างตัดผม", owner: "เจ้าของร้าน" };

const AppLayout = ({ children, role }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const items = navItems[role];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <Scissors className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">BarberQ</span>
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{roleLabels[role]}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="text-muted-foreground">
            <LogOut className="w-4 h-4 mr-1" /> ออก
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container py-4 pb-20 md:pb-4">
        {children}
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {items.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all text-xs",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar indicator */}
      <div className="hidden md:block fixed left-0 top-14 bottom-0 w-56 bg-card border-r border-border p-4">
        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AppLayout;
