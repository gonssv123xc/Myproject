import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const reviews = [
  { id: 1, customer: "คุณสมชาย", barber: "ช่างโอม", rating: 5, comment: "ตัดได้ดีมาก ตรงสไตล์เลย!", date: "20 ก.พ. 2026" },
  { id: 2, customer: "คุณวิชัย", barber: "ช่างเบียร์", rating: 4, comment: "บริการดี ร้านสะอาด", date: "18 ก.พ. 2026" },
  { id: 3, customer: "คุณณัฐ", barber: "ช่างโอม", rating: 5, comment: "Fade สวยมาก ประทับใจ", date: "15 ก.พ. 2026" },
  { id: 4, customer: "คุณเจมส์", barber: "ช่างแจ็ค", rating: 3, comment: "พอใช้ได้ แต่รอนานไปหน่อย", date: "12 ก.พ. 2026" },
];

const OwnerReviews = () => {
  const avg = (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1);

  return (
    <AppLayout role="owner">
      <div className="md:ml-56 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">รีวิว</h1>
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 text-primary fill-primary" />
            <span className="text-xl font-bold">{avg}</span>
            <span className="text-sm text-muted-foreground">({reviews.length} รีวิว)</span>
          </div>
        </div>
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="card-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{r.customer}</h4>
                    <p className="text-sm text-muted-foreground">ช่าง: {r.barber} • {r.date}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < r.rating ? "text-primary fill-primary" : "text-muted"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-foreground">{r.comment}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default OwnerReviews;
