import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Users, FileText, AlertTriangle, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  const load = () => {
    api.get("/admin/stats").then((r) => setStats(r.data));
    api.get("/admin/users").then((r) => setUsers(r.data));
  };
  useEffect(load, []);

  const del = async (id) => {
    if (!confirm("Delete this user and all their data?")) return;
    try { await api.delete(`/admin/users/${id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  return (
    <div className="space-y-6" data-testid="admin-page">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-blue-600 mb-2">Admin</div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Platform overview</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "Users", value: stats.users, color: "blue" },
            { icon: FileText, label: "Articles", value: stats.articles, color: "teal" },
            { icon: AlertTriangle, label: "Fake detected", value: stats.fake_detected, color: "red" },
            { icon: MessageSquare, label: "Feedback", value: stats.feedback_count, color: "amber" },
          ].map((s) => (
            <div key={s.label} className="rounded-3xl bg-white border border-slate-200 p-6">
              <div className={`w-10 h-10 rounded-xl bg-${s.color}-50 grid place-items-center mb-4`}><s.icon className={`w-5 h-5 text-${s.color}-600`} /></div>
              <div className="text-3xl font-display font-semibold">{s.value}</div>
              <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 font-display font-semibold">Users</div>
        {users.map((u) => (
          <div key={u.id} className="px-5 py-3 border-b border-slate-50 flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-white grid place-items-center font-bold text-sm">{(u.name || u.email)[0].toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{u.name}</div>
              <div className="text-xs text-slate-500 truncate">{u.email}</div>
            </div>
            <Badge className={u.role === "admin" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}>{u.role}</Badge>
            <Button variant="ghost" size="icon" onClick={() => del(u.id)} data-testid={`del-user-${u.id}`}><Trash2 className="w-4 h-4 text-red-500" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
