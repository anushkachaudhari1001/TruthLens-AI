import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Download } from "lucide-react";
import api, { API } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Reports() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/history").then((r) => setItems(r.data)); }, []);

  const download = async (id, kind) => {
    const token = localStorage.getItem("tl_token");
    const r = await fetch(`${API}/reports/${id}/${kind}`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await r.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob); link.download = `truthlens-${id.slice(0,8)}.${kind === "pdf" ? "pdf" : "json"}`; link.click();
  };

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-blue-600 mb-2">Reports</div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Downloadable reports</h1>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {items.length === 0 && <div className="text-slate-500">No reports yet.</div>}
        {items.map((it) => (
          <div key={it.id} className="rounded-3xl bg-white border border-slate-200 p-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <FileText className="w-6 h-6 text-blue-600 shrink-0" />
              <Badge className={it.prediction === "fake" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>{it.prediction}</Badge>
            </div>
            <div className="font-medium truncate">{it.headline || "Untitled"}</div>
            <div className="text-xs text-slate-500 mt-1">{new Date(it.created_at).toLocaleString()}</div>
            <div className="text-sm text-slate-600 mt-2 line-clamp-2">{it.summary}</div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => download(it.id, "pdf")} data-testid={`pdf-${it.id}`}><Download className="w-4 h-4 mr-1" /> PDF</Button>
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => download(it.id, "json")} data-testid={`json-${it.id}`}><Download className="w-4 h-4 mr-1" /> JSON</Button>
              <Link to={`/analyze/${it.id}`}><Button size="sm" variant="ghost" className="rounded-xl">View</Button></Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
