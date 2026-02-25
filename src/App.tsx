import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StaffLogin from "./pages/StaffLogin";
import CustomerDashboard from "./pages/customer/Dashboard";
import Booking from "./pages/customer/Booking";
import History from "./pages/customer/History";
import BarberDashboard from "./pages/barber/Dashboard";
import BarberSchedule from "./pages/barber/Schedule";
import OwnerDashboard from "./pages/owner/Dashboard";
import OwnerServices from "./pages/owner/Services";
import OwnerStaff from "./pages/owner/Staff";
import OwnerReviews from "./pages/owner/Reviews";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/staff-login" element={<StaffLogin />} />
          {/* Customer */}
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/customer/booking" element={<Booking />} />
          <Route path="/customer/history" element={<History />} />
          {/* Barber */}
          <Route path="/barber" element={<BarberDashboard />} />
          <Route path="/barber/schedule" element={<BarberSchedule />} />
          {/* Owner */}
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/owner/services" element={<OwnerServices />} />
          <Route path="/owner/staff" element={<OwnerStaff />} />
          <Route path="/owner/reviews" element={<OwnerReviews />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
