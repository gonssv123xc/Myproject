import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Staff { id: number; name: string; email: string; specialty: string; }

const OwnerStaff = () => {
  const [staff, setStaff] = useState<Staff[]>([
    { id: 1, name: "ช่างโอม", email: "ohm@barber.com", specialty: "Fade, Undercut" },
    { id: 2, name: "ช่างเบียร์", email: "beer@barber.com", specialty: "Classic, Pompadour" },
    { id: 3, name: "ช่างบอส", email: "boss@barber.com", specialty: "Textured, Korean" },
    { id: 4, name: "ช่างแจ็ค", email: "jack@barber.com", specialty: "Mullet, Mohawk" },
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", specialty: "" });
  const { toast } = useToast();

  const handleAdd = () => {
    if (!form.name || !form.email) return;
    setStaff((prev) => [...prev, { id: Date.now(), ...form }]);
    toast({ title: "เพิ่มช่างใหม่แล้ว" });
    setIsOpen(false);
    setForm({ name: "", email: "", specialty: "" });
  };

  const handleDelete = (id: number) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "ลบช่างแล้ว" });
  };

  return (
    <AppLayout role="owner">
      <div className="md:ml-56 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">จัดการพนักงาน</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gold-gradient gold-glow"><Plus className="w-4 h-4 mr-1" /> เพิ่มช่าง</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>เพิ่มช่างใหม่</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>ชื่อ</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>อีเมล</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>ความเชี่ยวชาญ</Label><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
                <Button className="w-full gold-gradient gold-glow font-semibold" onClick={handleAdd}>เพิ่มช่าง</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-3">
          {staff.map((s) => (
            <Card key={s.id} className="card-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{s.name}</h4>
                    <p className="text-sm text-muted-foreground">{s.email} • {s.specialty}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(s.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default OwnerStaff;
