import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import sawasdeeLogo from "@/assets/sawasdee-logo.png";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock login
    setTimeout(() => {
      setLoading(false);
      toast({ title: "เข้าสู่ระบบสำเร็จ", description: "ยินดีต้อนรับกลับมา!" });
      navigate("/customer");
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <img src={sawasdeeLogo} alt="Sawasdee Krab Barber Logo" className="w-20 h-20 rounded-2xl mx-auto mb-4 object-cover" />
          <h1 className="text-2xl font-bold text-foreground">Sawasdee Krab Barber</h1>
          <p className="text-muted-foreground mt-1">ระบบจองคิวร้านสวัสดีคลับ</p>
        </div>

        <Card className="card-shadow border-border/50">
          <CardHeader className="pb-4">
            <h2 className="text-xl font-semibold text-center">เข้าสู่ระบบ</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full gold-gradient gold-glow font-semibold" disabled={loading}>
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                ยังไม่มีบัญชี?{" "}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  สมัครสมาชิก
                </Link>
              </p>
              <p className="text-xs text-muted-foreground border-t border-border pt-4 mt-4">
                <Link to="/staff-login" className="text-primary/80 hover:text-primary hover:underline transition-colors">
                  สำหรับช่าง / เจ้าของร้าน →
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
