import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Star, Trash2, Eye } from "lucide-react";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

export default function History() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [prediction, setPrediction] = useState("all");
  const [favOnly, setFavOnly] = useState(false);

  const load = () => {
    api.get("/history", { params: { q, prediction: prediction === "all" ? "" : prediction, favorite: favOnly ? "true" : "" } })
      .then((r) => setItems(r.data));
  };
  useEffect(load, [prediction, favOnly]);

  const del = async (id) => {
    if (!confirm("Delete this analysis?")) return;
    await api.delete(`/history/${id}`);
    toast.success("Deleted");
    load();
  };
  const fav = async (id) => {
    await api.post(`/history/${id}/favorite`);
    load();
  };

  return (
    <div className="space-y-6" data-testid="history-page">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-blue-600 mb-2">History</div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Your analyses</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search headline or text…" value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()} className="pl-9 h-11 rounded-xl" data-testid="history-search" />
        </div>
        <Select value={prediction} onValueChange={setPrediction}>
          <SelectTrigger className="w-40 h-11 rounded-xl" data-testid="filter-prediction"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All predictions</SelectItem>
            <SelectItem value="real">Real</SelectItem>
            <SelectItem value="fake">Fake</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={favOnly ? "default" : "outline"} onClick={() => setFavOnly(!favOnly)} className="h-11 rounded-xl" data-testid="filter-fav"><Star className="w-4 h-4 mr-1" /> Favorites</Button>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
        {items.length === 0 && <div className="p-12 text-center text-slate-500">No analyses yet. Start by analyzing an article.</div>}
        {items.map((it, i) => (
          <motion.div key={it.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
            className="p-5 border-b border-slate-100 hover:bg-slate-50 transition flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={it.prediction === "fake" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>{it.prediction}</Badge>
                <span className="text-xs text-slate-500">{new Date(it.created_at).toLocaleString()}</span>
                <span className="text-xs text-slate-500">• {it.credibility_score}/100</span>
              </div>
              <div className="font-medium truncate">{it.headline || "Untitled"}</div>
              <div className="text-sm text-slate-500 truncate">{it.summary || it.text?.slice(0, 120)}</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => fav(it.id)} data-testid={`fav-${it.id}`}><Star className={`w-4 h-4 ${it.favorite ? "fill-amber-500 text-amber-500" : ""}`} /></Button>
              <Link to={`/analyze/${it.id}`}><Button variant="ghost" size="icon" data-testid={`view-${it.id}`}><Eye className="w-4 h-4" /></Button></Link>
              <Button variant="ghost" size="icon" onClick={() => del(it.id)} data-testid={`del-${it.id}`}><Trash2 className="w-4 h-4 text-red-500" /></Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
