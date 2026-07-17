import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [token, setToken] = useState("");
  const [newPw, setNewPw] = useState("");

  const requestReset = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      if (data.reset_token) {
        setToken(data.reset_token);
        toast.success("Reset token generated. Paste below.");
      } else {
        toast.info(data.message);
      }
      setStep(2);
    } catch (err) {
      toast.error("Failed");
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/reset-password", { token, new_password: newPw });
      toast.success("Password reset! Please sign in.");
      window.location.href = "/login";
    } catch (err) {
      toast.error(err.response?.data?.detail || "Reset failed");
    }
  };

  return (
    <div className="hero-bg min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center font-display font-bold text-2xl mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 grid place-items-center text-white"><Shield className="w-5 h-5" /></div>
          TruthLens<span className="text-blue-600">AI</span>
        </Link>
        <div className="glass rounded-3xl p-8">
          <h1 className="font-display text-3xl font-semibold mb-6">Reset password</h1>
          {step === 1 ? (
            <form onSubmit={requestReset} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} data-testid="forgot-email-input" className="mt-1.5 h-11 rounded-xl" />
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl bg-blue-600" data-testid="forgot-submit-btn">Send reset link</Button>
            </form>
          ) : (
            <form onSubmit={reset} className="space-y-4">
              <div>
                <Label htmlFor="token">Reset token</Label>
                <Input id="token" required value={token} onChange={(e) => setToken(e.target.value)} data-testid="reset-token-input" className="mt-1.5 h-11 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="newpw">New password</Label>
                <Input id="newpw" type="password" required minLength={6} value={newPw} onChange={(e) => setNewPw(e.target.value)} data-testid="reset-newpw-input" className="mt-1.5 h-11 rounded-xl" />
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl bg-blue-600" data-testid="reset-submit-btn">Reset password</Button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-slate-600">
            <Link to="/login" className="text-blue-600 hover:underline">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
