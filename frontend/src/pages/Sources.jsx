import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Search } from "lucide-react";
import { toast } from "sonner";

const trustColor = (t) => ({
  "Trusted": "bg-green-100 text-green-700",
  "Mostly Trusted": "bg-teal-100 text-teal-700",
  "Questionable": "bg-red-100 text-red-700",
  "Unknown": "bg-slate-100 text-slate-700",
}[t] || "bg-slate-100 text-slate-700");

export default function Sources() {
  const [list, setList] = useState([]);
  const [url, setUrl] = useState("");
  const [rating, setRating] = useState(null);

  useEffect(() => { api.get("/sources").then((r) => setList(r.data)); }, []);

  const check = async () => {
    if (!url) return;
    try {
      const { data } = await api.get("/source-rating", { params: { url } });
      setRating(data);
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6" data-testid="sources-page">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-blue-600 mb-2">Sources</div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Source reliability</h1>
        <p className="text-slate-600 mt-2">Check the reputation of any news domain.</p>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="https://example.com/article or domain.com" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && check()} className="pl-9 h-11 rounded-xl" data-testid="source-url" />
          </div>
          <Button onClick={check} className="bg-blue-600 h-11 rounded-xl" data-testid="check-source-btn"><Search className="w-4 h-4 mr-1" /> Check</Button>
        </div>
        {rating && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500 uppercase tracking-widest">Domain</div><div className="font-medium mt-1 truncate">{rating.domain}</div></div>
            <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500 uppercase tracking-widest">Trust</div><Badge className={`mt-1 ${trustColor(rating.trust)}`}>{rating.trust}</Badge></div>
            <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500 uppercase tracking-widest">Score</div><div className="font-medium mt-1">{rating.score ?? "—"}/100</div></div>
            <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500 uppercase tracking-widest">Bias</div><div className="font-medium mt-1">{rating.bias}</div></div>
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-slate-100 text-xs uppercase tracking-widest text-slate-500 font-bold">
          <div>Domain</div><div>Trust</div><div>Bias</div><div className="text-right">Score</div>
        </div>
        {list.map((s) => (
          <div key={s.domain} className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-slate-50 items-center text-sm">
            <div className="font-medium">{s.domain}</div>
            <div><Badge className={trustColor(s.trust)}>{s.trust}</Badge></div>
            <div className="text-slate-600">{s.bias}</div>
            <div className="text-right font-medium">{s.score}/100</div>
          </div>
        ))}
      </div>
    </div>
  );
}
