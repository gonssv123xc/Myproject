import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, Users, Calendar, TrendingUp } from "lucide-react";

const revenueData = [
  { day: "จ.", revenue: 2400 },
  { day: "อ.", revenue: 1800 },
  { day: "พ.", revenue: 3200 },
  { day: "พฤ.", revenue: 2800 },
  { day: "ศ.", revenue: 4200 },
  { day: "ส.", revenue: 5100 },
  { day: "อา.", revenue: 3600 },
];

const barberShare = [
  { name: "ช่างโอม", value: 35, color: "hsl(40, 96%, 53%)" },
  { name: "ช่างเบียร์", value: 28, color: "hsl(35, 95%, 45%)" },
  { name: "ช่างบอส", value: 22, color: "hsl(40, 50%, 70%)" },
  { name: "ช่างแจ็ค", value: 15, color: "hsl(40, 20%, 85%)" },
];

const stats = [
  { label: "รายได้วันนี้", value: "฿5,100", icon: DollarSign, change: "+12%" },
  { label: "จองวันนี้", value: "14", icon: Calendar, change: "+3" },
  { label: "ลูกค้าทั้งหมด", value: "328", icon: Users, change: "+18" },
  { label: "รายได้เดือนนี้", value: "฿68,400", icon: TrendingUp, change: "+8%" },
];

const OwnerDashboard = () => {
  return (
    <AppLayout role="owner">
      <div className="md:ml-56 space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold">แดชบอร์ด</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <Card key={s.label} className="card-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <s.icon className="w-5 h-5 text-primary" />
                  <span className="text-xs text-success font-medium">{s.change}</span>
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Chart */}
        <Card className="card-shadow">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">รายได้รายสัปดาห์</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [`฿${v.toLocaleString()}`, "รายได้"]} />
                <Bar dataKey="revenue" fill="hsl(40, 96%, 53%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="card-shadow">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">สัดส่วนงานช่าง</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={barberShare} innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                    {barberShare.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {barberShare.map((b) => (
                  <div key={b.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ background: b.color }} />
                    <span>{b.name}</span>
                    <span className="text-muted-foreground">{b.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default OwnerDashboard;
