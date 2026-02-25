import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, User, Scissors, Image, CheckCircle2, XCircle, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const queue = [
  { id: 1, customer: "คุณสมชาย", service: "ตัดผมชาย", time: "14:00", note: "Fade ด้านข้างสั้น ข้างบนยาว", refImage: null, status: "waiting" },
  { id: 2, customer: "คุณวิชัย", service: "ตัดผม + โกนหนวด", time: "14:30", note: "ทรง Classic ย้อนยุค", refImage: null, status: "waiting" },
  { id: 3, customer: "คุณณัฐ", service: "ตัดผม + สระผม", time: "15:00", note: "", refImage: null, status: "waiting" },
];

const statusActions: Record<string, { label: string; color: string }> = {
  waiting: { label: "รอ", color: "bg-warning/15 text-warning border-warning/20" },
  in_progress: { label: "กำลังตัด", color: "bg-info/15 text-info border-info/20" },
  completed: { label: "เสร็จแล้ว", color: "bg-success/15 text-success border-success/20" },
  noshow: { label: "ไม่มา", color: "bg-destructive/15 text-destructive border-destructive/20" },
};

const BarberDashboard = () => {
  const [items, setItems] = useState(queue);
  const [myStatus, setMyStatus] = useState<"available" | "busy" | "break">("available");
  const { toast } = useToast();

  const updateStatus = (id: number, status: string) => {
    setItems((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
    if (status === "completed") {
      toast({ title: "ตัดเสร็จแล้ว!", description: "ลูกค้าจะได้รับแจ้งเตือนรีวิว" });
    }
  };

  const barberStatuses = [
    { key: "available" as const, label: "ว่าง", emoji: "🟢" },
    { key: "busy" as const, label: "ติดลูกค้า", emoji: "🔴" },
    { key: "break" as const, label: "พักเบรก", emoji: "🟡" },
  ];

  return (
    <AppLayout role="barber">
      <div className="md:ml-56 space-y-6 animate-fade-in">
        {/* Status toggle */}
        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">สถานะของคุณ</h2>
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex gap-2">
              {barberStatuses.map((s) => (
                <Button
                  key={s.key}
                  variant={myStatus === s.key ? "default" : "outline"}
                  size="sm"
                  className={myStatus === s.key ? "gold-gradient" : ""}
                  onClick={() => {
                    setMyStatus(s.key);
                    toast({ title: `สถานะ: ${s.label}` });
                  }}
                >
                  {s.emoji} {s.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Queue */}
        <div>
          <h2 className="text-lg font-semibold mb-3">คิวงานวันนี้ ({items.filter((i) => i.status === "waiting").length} รอ)</h2>
          <div className="space-y-3">
            {items.map((q) => (
              <Card key={q.id} className="card-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{q.customer}</h4>
                        <p className="text-sm text-muted-foreground">{q.service} • <Clock className="w-3 h-3 inline" /> {q.time}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusActions[q.status]?.color}>{statusActions[q.status]?.label}</Badge>
                  </div>
                  {q.note && <p className="text-sm bg-muted rounded-lg p-2 mb-3 text-muted-foreground">💬 {q.note}</p>}
                  {q.status === "waiting" && (
                    <div className="flex gap-2">
                      <Button size="sm" className="gold-gradient flex-1" onClick={() => updateStatus(q.id, "completed")}>
                        <CheckCircle2 className="w-4 h-4 mr-1" /> ตัดเสร็จ
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => updateStatus(q.id, "noshow")}>
                        <XCircle className="w-4 h-4 mr-1" /> ไม่มา
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default BarberDashboard;
