import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, ChevronRight, Upload, User, Calendar as CalIcon, Clock, Scissors, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const services = [
  { id: 1, name: "ตัดผมชาย", price: 200, duration: "30 นาที" },
  { id: 2, name: "ตัดผม + สระผม", price: 250, duration: "45 นาที" },
  { id: 3, name: "ตัดผม + โกนหนวด", price: 300, duration: "45 นาที" },
  { id: 4, name: "ทำสีผม", price: 800, duration: "90 นาที" },
  { id: 5, name: "ดัดผม", price: 600, duration: "60 นาที" },
];

const barbers = [
  { id: 1, name: "ช่างโอม", status: "available", specialty: "Fade, Undercut" },
  { id: 2, name: "ช่างเบียร์", status: "available", specialty: "Classic, Pompadour" },
  { id: 3, name: "ช่างบอส", status: "busy", specialty: "Textured, Korean" },
  { id: 4, name: "ช่างแจ็ค", status: "break", specialty: "Mullet, Mohawk" },
];

const timeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];
const bookedSlots = ["10:00", "14:00"];

const statusLabels: Record<string, { label: string; color: string }> = {
  available: { label: "ว่าง", color: "bg-success/15 text-success border-success/20" },
  busy: { label: "ติดลูกค้า", color: "bg-destructive/15 text-destructive border-destructive/20" },
  break: { label: "พักเบรก", color: "bg-warning/15 text-warning border-warning/20" },
};

const Booking = () => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [note, setNote] = useState("");
  const [refImage, setRefImage] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setRefImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    toast({ title: "จองคิวสำเร็จ! 🎉", description: "ระบบได้บันทึกการจองของคุณแล้ว" });
    navigate("/customer");
  };

  const steps = [
    { num: 1, label: "เลือกบริการ" },
    { num: 2, label: "เลือกช่าง" },
    { num: 3, label: "เลือกวันเวลา" },
    { num: 4, label: "รายละเอียด" },
    { num: 5, label: "ยืนยัน" },
  ];

  return (
    <AppLayout role="customer">
      <div className="md:ml-56 max-w-lg mx-auto space-y-6 animate-fade-in">
        {/* Progress */}
        <div className="flex items-center gap-1">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="mr-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{steps[step - 1].label}</span>
              <span className="text-xs text-muted-foreground">{step}/5</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full gold-gradient rounded-full transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Step 1: Service */}
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">เลือกบริการ</h2>
            {services.map((s) => (
              <Card
                key={s.id}
                className={`cursor-pointer transition-all ${selectedService === s.id ? "ring-2 ring-primary border-primary" : "card-shadow hover:card-shadow-hover"}`}
                onClick={() => setSelectedService(s.id)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{s.name}</h4>
                    <p className="text-sm text-muted-foreground">{s.duration}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">฿{s.price}</span>
                    {selectedService === s.id && <Check className="w-5 h-5 text-primary" />}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button className="w-full gold-gradient gold-glow font-semibold" disabled={!selectedService} onClick={() => setStep(2)}>
              ถัดไป <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 2: Barber */}
        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">เลือกช่าง</h2>
            {barbers.map((b) => (
              <Card
                key={b.id}
                className={`cursor-pointer transition-all ${b.status !== "available" ? "opacity-50" : ""} ${selectedBarber === b.id ? "ring-2 ring-primary border-primary" : "card-shadow hover:card-shadow-hover"}`}
                onClick={() => b.status === "available" && setSelectedBarber(b.id)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{b.name}</h4>
                      <p className="text-xs text-muted-foreground">{b.specialty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusLabels[b.status].color}>{statusLabels[b.status].label}</Badge>
                    {selectedBarber === b.id && <Check className="w-5 h-5 text-primary" />}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button className="w-full gold-gradient gold-glow font-semibold" disabled={!selectedBarber} onClick={() => setStep(3)}>
              ถัดไป <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 3: Date & Time */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">เลือกวันและเวลา</h2>
            <div className="space-y-2">
              <Label>วันที่</Label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>
            {selectedDate && (
              <div className="space-y-2">
                <Label>เวลา</Label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((t) => {
                    const isBooked = bookedSlots.includes(t);
                    const isSelected = selectedTime === t;
                    return (
                      <button
                        key={t}
                        disabled={isBooked}
                        onClick={() => setSelectedTime(t)}
                        className={`py-2.5 rounded-lg text-sm font-medium transition-all border ${
                          isBooked
                            ? "bg-muted text-muted-foreground/50 border-border cursor-not-allowed line-through"
                            : isSelected
                            ? "gold-gradient text-primary-foreground border-primary gold-glow"
                            : "bg-card text-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <Button className="w-full gold-gradient gold-glow font-semibold" disabled={!selectedDate || !selectedTime} onClick={() => setStep(4)}>
              ถัดไป <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 4: Reference */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">ข้อมูลเพิ่มเติม</h2>
            <div className="space-y-2">
              <Label>อธิบายทรงผมที่ต้องการ</Label>
              <Textarea placeholder="เช่น ตัด Fade ด้านข้างสั้น ข้างบนยาวหน่อย..." value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>อัปโหลดรูป Reference (ไม่บังคับ)</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => document.getElementById("ref-upload")?.click()}>
                {refImage ? (
                  <img src={refImage} alt="Reference" className="max-h-40 mx-auto rounded-lg" />
                ) : (
                  <div className="text-muted-foreground">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">คลิกเพื่ออัปโหลดรูปภาพ</p>
                  </div>
                )}
              </div>
              <input id="ref-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
            <Button className="w-full gold-gradient gold-glow font-semibold" onClick={() => setStep(5)}>
              ดูสรุป <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">ยืนยันการจอง</h2>
            <Card className="card-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Scissors className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">บริการ</p>
                    <p className="font-semibold">{services.find((s) => s.id === selectedService)?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">ช่าง</p>
                    <p className="font-semibold">{barbers.find((b) => b.id === selectedBarber)?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalIcon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">วันที่</p>
                    <p className="font-semibold">{selectedDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">เวลา</p>
                    <p className="font-semibold">{selectedTime} น.</p>
                  </div>
                </div>
                {note && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground">หมายเหตุ</p>
                    <p className="text-sm">{note}</p>
                  </div>
                )}
                {refImage && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">รูป Reference</p>
                    <img src={refImage} alt="Reference" className="max-h-32 rounded-lg" />
                  </div>
                )}
                <div className="pt-2 border-t border-border flex justify-between items-center">
                  <span className="text-muted-foreground">ราคา</span>
                  <span className="text-xl font-bold text-primary">฿{services.find((s) => s.id === selectedService)?.price}</span>
                </div>
              </CardContent>
            </Card>
            <Button className="w-full gold-gradient gold-glow font-semibold text-base py-6" onClick={handleConfirm}>
              ✅ ยืนยันการจอง
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Booking;
