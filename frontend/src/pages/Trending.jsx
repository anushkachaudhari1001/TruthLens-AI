import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import api from "@/lib/api";

export default function Trending() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/trending").then((r) => setData(r.data)); }, []);
  if (!data) return <div className="text-slate-500">Loading…</div>;

  return (
    <div className="space-y-6" data-testid="trending-page">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-blue-600 mb-2">Trending</div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Trending topics</h1>
        <p className="text-slate-600 mt-2">Where fake news is spreading right now.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white border border-slate-200 p-6">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 mb-4">Fake vs Real by topic</div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.trending}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="topic" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip />
              <Bar dataKey="real" stackId="a" fill="#22C55E" radius={[0, 0, 0, 0]} />
              <Bar dataKey="fake" stackId="a" fill="#EF4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200 p-6">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 mb-4">Fake rate by topic (%)</div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data.trending}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="topic" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="fake_rate" stroke="#EF4444" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-6">
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 mb-4">Topic cloud</div>
        <div className="flex flex-wrap gap-3">
          {data.trending.length === 0 && <div className="text-slate-500 text-sm">No trending data yet.</div>}
          {data.trending.map((t) => (
            <span key={t.topic} className="capitalize px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium"
              style={{ fontSize: `${12 + Math.min(t.total, 20)}px` }}>{t.topic} <span className="text-xs text-blue-500">({t.total})</span></span>
          ))}
        </div>
      </div>
    </div>
  );
}
