import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { FileCheck, AlertTriangle, TrendingUp, Activity, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const COLORS = { real: "#22C55E", fake: "#EF4444", primary: "#2563EB", accent: "#14B8A6" };

function StatCard({ icon: Icon, label, value, sub, color = "blue" }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-white border border-slate-200 p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-${color}-50 grid place-items-center`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
      </div>
      <div className="text-3xl font-display font-semibold">{value}</div>
      <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-2">{sub}</div>}
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/analytics").then((r) => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return <div className="text-slate-500">Loading analytics…</div>;

  const pieData = [{ name: "Real", value: data.real }, { name: "Fake", value: data.fake }];

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-blue-600 mb-2">Dashboard</div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Welcome, {user?.name?.split(" ")[0]}.</h1>
          <p className="text-slate-600 mt-2">Here's your fake-news detection intelligence.</p>
        </div>
        <Link to="/analyze"><Button className="bg-blue-600 hover:bg-blue-700 rounded-full h-11 px-6" data-testid="dash-analyze-btn"><Zap className="w-4 h-4 mr-2" /> New analysis</Button></Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Analyzed" value={data.total} sub="all-time" color="blue" />
        <StatCard icon={FileCheck} label="Real" value={data.real} color="green" />
        <StatCard icon={AlertTriangle} label="Fake" value={data.fake} color="red" />
        <StatCard icon={Sparkles} label="Today" value={data.today} color="teal" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="rounded-3xl bg-white border border-slate-200 p-6">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 mb-4">Fake vs Real</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                <Cell fill={COLORS.real} />
                <Cell fill={COLORS.fake} />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 text-sm">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500" /> Real {data.real}</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" /> Fake {data.fake}</span>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 p-6 lg:col-span-2">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 mb-4">Analyses over time</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 p-6">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 mb-4">Credibility distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.credibility_buckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="range" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.accent} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 p-6">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 mb-4">Confidence histogram</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.confidence_histogram}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="range" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 p-6">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 mb-4">Top topics</div>
          <div className="space-y-2 mt-3">
            {data.top_topics.length === 0 && <div className="text-sm text-slate-500">No data yet.</div>}
            {data.top_topics.map((t) => (
              <div key={t.topic} className="flex items-center justify-between text-sm">
                <span className="capitalize font-medium">{t.topic}</span>
                <span className="text-slate-500">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
