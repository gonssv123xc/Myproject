import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const history = [
  { id: 1, service: "ตัดผมชาย", barber: "ช่างโอม", date: "20 ก.พ. 2026", time: "14:00", status: "completed", price: 200 },
  { id: 2, service: "ตัดผม + สระผม", barber: "ช่างเบียร์", date: "15 ก.พ. 2026", time: "10:30", status: "completed", price: 250 },
  { id: 3, service: "ตัดผม + โกนหนวด", barber: "ช่างโอม", date: "28 ก.พ. 2026", time: "16:00", status: "confirmed", price: 300 },
  { id: 4, service: "ทำสีผม", barber: "ช่างแจ็ค", date: "1 มี.ค. 2026", time: "13:00", status: "confirmed", price: 800 },
];

const statusMap: Record<string, { label: string; className: string }> = {
  confirmed: { label: "ยืนยันแล้ว", className: "bg-success/15 text-success border-success/20" },
  completed: { label: "เสร็จสิ้น", className: "bg-muted text-muted-foreground border-border" },
  cancelled: { label: "ยกเลิก", className: "bg-destructive/15 text-destructive border-destructive/20" },
  noshow: { label: "ไม่มา", className: "bg-destructive/15 text-destructive border-destructive/20" },
};

const History = () => {
  const { toast } = useToast();

  const handleCancel = (id: number) => {
    toast({ title: "ยกเลิกการจองแล้ว", description: `รายการ #${id} ถูกยกเลิก` });
  };

  return (
    <AppLayout role="customer">
      <div className="md:ml-56 space-y-4 animate-fade-in">
        <h1 className="text-2xl font-bold">ประวัติการจอง</h1>
        <div className="space-y-3">
          {history.map((b) => (
            <Card key={b.id} className="card-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{b.service}</h4>
                    <p className="text-sm text-muted-foreground">{b.barber}</p>
                  </div>
                  <Badge variant="outline" className={statusMap[b.status]?.className}>{statusMap[b.status]?.label}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {b.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {b.time}</span>
                  <span className="ml-auto font-semibold text-foreground">฿{b.price}</span>
                </div>
                {b.status === "confirmed" && (
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleCancel(b.id)}>
                    ยกเลิกการจอง
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default History;
