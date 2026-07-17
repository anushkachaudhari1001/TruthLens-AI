import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Shield, Home, ScanText, History, BarChart3, TrendingUp, Globe, Settings, LogOut, ShieldCheck, FileText, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AIAssistant from "@/components/AIAssistant";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/analyze", icon: ScanText, label: "Analyze" },
  { to: "/history", icon: History, label: "History" },
  { to: "/reports", icon: FileText, label: "Reports" },
  { to: "/trending", icon: TrendingUp, label: "Trending" },
  { to: "/sources", icon: Globe, label: "Sources" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = () => { logout(); nav("/"); };

  return (
    <div className="min-h-screen hero-bg flex">
      {/* Sidebar */}
      <aside className={`${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:sticky top-0 left-0 h-screen w-64 glass border-r border-slate-200/50 z-40 transition-transform`} data-testid="sidebar">
        <div className="p-6 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 font-display font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 grid place-items-center text-white"><Shield className="w-4 h-4" /></div>
            TruthLens
          </Link>
          <button onClick={() => setOpen(false)} className="md:hidden"><X className="w-5 h-5" /></button>
        </div>
        <nav className="px-3 flex flex-col gap-1">
          {navItems.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/dashboard"} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}
              data-testid={`nav-${n.label.toLowerCase()}`}>
              <n.icon className="w-4 h-4" /> {n.label}
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink to="/admin" onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}
              data-testid="nav-admin">
              <ShieldCheck className="w-4 h-4" /> Admin
            </NavLink>
          )}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="rounded-xl bg-white border border-slate-200 p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-white grid place-items-center font-bold text-sm">
              {(user?.name || user?.email || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 truncate capitalize">{user?.role}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={doLogout} data-testid="logout-btn" title="Sign out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden glass border-b border-slate-200/50 p-4 flex items-center justify-between">
          <button onClick={() => setOpen(true)}><Menu className="w-5 h-5" /></button>
          <span className="font-display font-semibold">TruthLens</span>
          <div className="w-5" />
        </header>
        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <AIAssistant />
    </div>
  );
}
