import { supabase } from "./supabase";

export interface ReportBooking {
  id: string;
  date: string;
  startTime: string;
  customerName: string;
  barberName: string;
  serviceName: string;
  status: string;
  totalPrice: number;
}

export interface ReportSummary {
  totalRevenue: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}

export const getReportData = async (
  startDate: string,
  endDate: string
): Promise<{ bookings: ReportBooking[]; summary: ReportSummary }> => {
  try {
    const { data, error } = await supabase
      .from("Booking")
      .select(`
        id,
        date,
        startTime,
        status,
        totalPrice,
        User:customerId (firstName, lastName),
        Barber:barberId ( User!userId (firstName, lastName) ),
        Service:serviceId ( name )
      `)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false })
      .order("startTime", { ascending: false });

    if (error) {
      console.error("Error fetching report data:", error);
      throw error;
    }

    let totalRevenue = 0;
    let completedBookings = 0;
    let cancelledBookings = 0;

    const bookings: ReportBooking[] = data.map((b: any) => {
      // Calculate summary
      if (b.status === "COMPLETED") {
        totalRevenue += b.totalPrice;
        completedBookings++;
      } else if (b.status === "CANCELLED" || b.status === "NO_SHOW") {
        cancelledBookings++;
      }

      // Map names
      const customerName = b.User ? `${b.User.firstName} ${b.User.lastName}` : "Unknown Customer";
      const barberName = b.Barber?.User ? `${b.Barber.User.firstName} ${b.Barber.User.lastName}` : "Unknown Barber";
      
      let serviceName = "Unknown Service";
      if (b.Service && Array.isArray(b.Service) && b.Service.length > 0) {
        serviceName = b.Service[0].name;
      } else if (b.Service && b.Service.name) {
        serviceName = b.Service.name;
      }

      return {
        id: b.id,
        date: new Date(b.date).toISOString().split('T')[0], // Extract just the date part if it's full ISO
        startTime: b.startTime,
        customerName,
        barberName,
        serviceName,
        status: b.status,
        totalPrice: b.totalPrice,
      };
    });

    const summary: ReportSummary = {
      totalRevenue,
      totalBookings: data.length,
      completedBookings,
      cancelledBookings,
    };

    return { bookings, summary };
  } catch (err) {
    console.error("Report Service Error:", err);
    return {
      bookings: [],
      summary: { totalRevenue: 0, totalBookings: 0, completedBookings: 0, cancelledBookings: 0 },
    };
  }
};
