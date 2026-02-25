import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const days = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];

const BarberSchedule = () => {
  const [schedule, setSchedule] = useState(
    days.map((d, i) => ({ day: d, active: i < 6, start: "09:00", end: "18:00" }))
  );

  const toggleDay = (index: number) => {
    setSchedule((prev) => prev.map((s, i) => (i === index ? { ...s, active: !s.active } : s)));
  };

  return (
    <AppLayout role="barber">
      <div className="md:ml-56 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">ตารางงาน</h1>
        <div className="space-y-3">
          {schedule.map((s, i) => (
            <Card key={s.day} className={`card-shadow transition-opacity ${!s.active ? "opacity-50" : ""}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch checked={s.active} onCheckedChange={() => toggleDay(i)} />
                  <span className="font-medium w-20">{s.day}</span>
                </div>
                {s.active && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="time"
                      value={s.start}
                      onChange={(e) => setSchedule((p) => p.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))}
                      className="bg-muted rounded px-2 py-1 text-foreground"
                    />
                    <span>-</span>
                    <input
                      type="time"
                      value={s.end}
                      onChange={(e) => setSchedule((p) => p.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))}
                      className="bg-muted rounded px-2 py-1 text-foreground"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <Button className="w-full gold-gradient gold-glow font-semibold">บันทึกตารางงาน</Button>
      </div>
    </AppLayout>
  );
};

export default BarberSchedule;
