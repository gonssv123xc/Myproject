import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Scissors } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: number;
  name: string;
  price: number;
  duration: string;
}

const OwnerServices = () => {
  const [services, setServices] = useState<Service[]>([
    { id: 1, name: "ตัดผมชาย", price: 200, duration: "30 นาที" },
    { id: 2, name: "ตัดผม + สระผม", price: 250, duration: "45 นาที" },
    { id: 3, name: "ตัดผม + โกนหนวด", price: 300, duration: "45 นาที" },
    { id: 4, name: "ทำสีผม", price: 800, duration: "90 นาที" },
    { id: 5, name: "ดัดผม", price: 600, duration: "60 นาที" },
  ]);
  const [editService, setEditService] = useState<Service | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", duration: "" });
  const { toast } = useToast();

  const openAdd = () => {
    setEditService(null);
    setForm({ name: "", price: "", duration: "" });
    setIsOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditService(s);
    setForm({ name: s.name, price: String(s.price), duration: s.duration });
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.price) return;
    if (editService) {
      setServices((prev) => prev.map((s) => (s.id === editService.id ? { ...s, name: form.name, price: Number(form.price), duration: form.duration } : s)));
      toast({ title: "แก้ไขบริการแล้ว" });
    } else {
      setServices((prev) => [...prev, { id: Date.now(), name: form.name, price: Number(form.price), duration: form.duration }]);
      toast({ title: "เพิ่มบริการใหม่แล้ว" });
    }
    setIsOpen(false);
  };

  const handleDelete = (id: number) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "ลบบริการแล้ว" });
  };

  return (
    <AppLayout role="owner">
      <div className="md:ml-56 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">จัดการบริการ</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gold-gradient gold-glow" onClick={openAdd}>
                <Plus className="w-4 h-4 mr-1" /> เพิ่มบริการ
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editService ? "แก้ไขบริการ" : "เพิ่มบริการใหม่"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>ชื่อบริการ</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น ตัดผมชาย" />
                </div>
                <div className="space-y-2">
                  <Label>ราคา (บาท)</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="200" />
                </div>
                <div className="space-y-2">
                  <Label>ระยะเวลา</Label>
                  <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="30 นาที" />
                </div>
                <Button className="w-full gold-gradient gold-glow font-semibold" onClick={handleSave}>
                  {editService ? "บันทึก" : "เพิ่มบริการ"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {services.map((s) => (
            <Card key={s.id} className="card-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{s.name}</h4>
                    <p className="text-sm text-muted-foreground">{s.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary mr-2">฿{s.price}</span>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default OwnerServices;
