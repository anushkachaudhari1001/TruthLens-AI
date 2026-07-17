import { useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [model, setModel] = useState(user?.default_model || "gpt-5.2");

  const save = async () => {
    try {
      await api.put("/auth/profile", { name, default_model: model });
      const u = { ...user, name, default_model: model };
      localStorage.setItem("tl_user", JSON.stringify(u));
      toast.success("Saved");
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6 max-w-2xl" data-testid="settings-page">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-blue-600 mb-2">Settings</div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Preferences</h1>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-6 space-y-5">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 h-11 rounded-xl" data-testid="settings-name" />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={user?.email || ""} disabled className="mt-1.5 h-11 rounded-xl bg-slate-50" />
        </div>
        <div>
          <Label>Default AI model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="mt-1.5 h-11 rounded-xl" data-testid="settings-model"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-5.2">GPT-5.2</SelectItem>
              <SelectItem value="gpt-5.4">GPT-5.4</SelectItem>
              <SelectItem value="gpt-5.4-mini">GPT-5.4 Mini</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={save} className="bg-blue-600 h-11 rounded-xl" data-testid="settings-save-btn">Save changes</Button>
      </div>
    </div>
  );
}
