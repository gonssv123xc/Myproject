import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Scissors, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const upcomingBookings = [
  { id: 1, service: "ตัดผมชาย", barber: "ช่างโอม", date: "28 ก.พ. 2026", time: "14:00", status: "confirmed" },
  { id: 2, service: "ตัดผม + โกนหนวด", barber: "ช่างเบียร์", date: "5 มี.ค. 2026", time: "10:30", status: "confirmed" },
];

const statusMap: Record<string, { label: string; className: string }> = {
  confirmed: { label: "ยืนยันแล้ว", className: "bg-success/15 text-success border-success/20" },
  pending: { label: "รอยืนยัน", className: "bg-warning/15 text-warning border-warning/20" },
  completed: { label: "เสร็จสิ้น", className: "bg-muted text-muted-foreground border-border" },
};

const CustomerDashboard = () => {
  return (
    <AppLayout role="customer">
      <div className="md:ml-56 space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">สวัสดีครับ! 👋</h1>
          <p className="text-muted-foreground">พร้อมจองคิวตัดผมหรือยัง?</p>
        </div>

        {/* Quick Book */}
        <Link to="/customer/booking">
          <Card className="gold-gradient gold-glow border-0 cursor-pointer hover:scale-[1.01] transition-transform">
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                  <Scissors className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-foreground text-lg">จองคิวตัดผม</h3>
                  <p className="text-primary-foreground/70 text-sm">เลือกบริการ ช่าง วัน เวลา</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-primary-foreground/70" />
            </CardContent>
          </Card>
        </Link>

        {/* Upcoming */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">การจองที่กำลังจะมาถึง</h2>
            <Link to="/customer/history" className="text-sm text-primary hover:underline">ดูทั้งหมด</Link>
          </div>
          <div className="space-y-3">
            {upcomingBookings.map((b) => (
              <Card key={b.id} className="card-shadow hover:card-shadow-hover transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-foreground">{b.service}</h4>
                      <p className="text-sm text-muted-foreground">{b.barber}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {b.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {b.time}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusMap[b.status]?.className}>
                      {statusMap[b.status]?.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CustomerDashboard;
