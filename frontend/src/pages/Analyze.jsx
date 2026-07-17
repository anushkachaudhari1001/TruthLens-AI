import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Link as LinkIcon, ScanText, Trash2, Sparkles, Loader2, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import api, { API } from "@/lib/api";
import CredibilityGauge from "@/components/CredibilityGauge";

const SAMPLES = {
  fake: {
    headline: "SHOCKING: Scientists Discover Miracle Cure Big Pharma Doesn't Want You to Know!",
    text: "BREAKING! In a stunning revelation that mainstream media REFUSES to cover, scientists have discovered a miracle cure that big pharmaceutical companies have been hiding for decades. This one weird trick will change EVERYTHING. Doctors HATE this! Share before it's deleted! The government doesn't want you to know the shocking truth about this simple household ingredient that can cure any disease overnight. Millions of lives could be saved but the elites are silencing the truth."
  },
  real: {
    headline: "Federal Reserve raises interest rates by 0.25% amid persistent inflation",
    text: "The Federal Reserve announced Wednesday it would raise its benchmark interest rate by a quarter percentage point, bringing the federal funds rate to a target range of 5.25% to 5.5%. Chair Jerome Powell said in a press conference that the decision reflects the committee's ongoing effort to bring inflation back to its 2% target. According to data released by the Bureau of Labor Statistics, the consumer price index rose 3.2% year-over-year in June, down from 4.0% in May. Economists at Goldman Sachs and JPMorgan said the move was widely anticipated."
  }
};

function highlightText(text, highlights) {
  if (!highlights?.length) return text;
  const parts = [];
  let cursor = 0;
  const sorted = highlights
    .map((h) => ({ ...h, idx: text.toLowerCase().indexOf(h.phrase.toLowerCase()) }))
    .filter((h) => h.idx !== -1)
    .sort((a, b) => a.idx - b.idx);
  for (const h of sorted) {
    if (h.idx < cursor) continue;
    if (h.idx > cursor) parts.push(<span key={`t-${cursor}`}>{text.slice(cursor, h.idx)}</span>);
    parts.push(<span key={`h-${h.idx}`} className={`hl-${h.category}`} title={`${h.category}: ${h.reason}`}>{text.slice(h.idx, h.idx + h.phrase.length)}</span>);
    cursor = h.idx + h.phrase.length;
  }
  parts.push(<span key="tail">{text.slice(cursor)}</span>);
  return parts;
}

export default function Analyze() {
  const { id } = useParams();
  const [tab, setTab] = useState("text");
  const [headline, setHeadline] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (id) api.get(`/history/${id}`).then((r) => setResult(r.data)).catch(() => {});
  }, [id]);

  const clear = () => { setHeadline(""); setText(""); setUrl(""); setFile(null); setResult(null); };
  const loadSample = (kind) => { setTab("text"); setHeadline(SAMPLES[kind].headline); setText(SAMPLES[kind].text); };
  const pasteClipboard = async () => {
    try { const t = await navigator.clipboard.readText(); setText(t); toast.success("Pasted"); }
    catch { toast.error("Clipboard blocked"); }
  };

  const analyze = async () => {
    setLoading(true); setResult(null);
    try {
      let res;
      if (tab === "file" && file) {
        const fd = new FormData(); fd.append("file", file); fd.append("headline", headline);
        res = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        res = await api.post("/analyze", { headline, text, url });
      }
      setResult(res.data);
      toast.success("Analysis complete");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Analysis failed");
    } finally { setLoading(false); }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) { setFile(e.dataTransfer.files[0]); setTab("file"); }
  };

  const exportPdf = async () => {
    const token = localStorage.getItem("tl_token");
    const r = await fetch(`${API}/reports/${result.id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await r.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob); link.download = `truthlens-${result.id.slice(0,8)}.pdf`; link.click();
  };

  return (
    <div className="space-y-8" data-testid="analyze-page">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-blue-600 mb-2">Analyze</div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Fact-check any article.</h1>
        <p className="text-slate-600 mt-2">Paste text, drop a file, or share a URL. TruthLens will do the rest.</p>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-3 rounded-full p-1 bg-slate-100">
            <TabsTrigger value="text" className="rounded-full" data-testid="tab-text"><ScanText className="w-4 h-4 mr-1" /> Text</TabsTrigger>
            <TabsTrigger value="url" className="rounded-full" data-testid="tab-url"><LinkIcon className="w-4 h-4 mr-1" /> URL</TabsTrigger>
            <TabsTrigger value="file" className="rounded-full" data-testid="tab-file"><Upload className="w-4 h-4 mr-1" /> File</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-6 space-y-4">
            <Input placeholder="Headline (optional)" value={headline} onChange={(e) => setHeadline(e.target.value)} className="h-11 rounded-xl" data-testid="analyze-headline" />
            <Textarea placeholder="Paste article text here…" value={text} onChange={(e) => setText(e.target.value)} className="min-h-[240px] rounded-xl" data-testid="analyze-text" />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={pasteClipboard} data-testid="paste-btn">Paste clipboard</Button>
              <Button variant="outline" size="sm" onClick={() => loadSample("fake")} data-testid="sample-fake-btn">Sample fake</Button>
              <Button variant="outline" size="sm" onClick={() => loadSample("real")} data-testid="sample-real-btn">Sample real</Button>
              <Button variant="ghost" size="sm" onClick={clear} data-testid="clear-btn"><Trash2 className="w-4 h-4 mr-1" /> Clear</Button>
            </div>
          </TabsContent>

          <TabsContent value="url" className="mt-6 space-y-4">
            <Input placeholder="https://example.com/article" value={url} onChange={(e) => setUrl(e.target.value)} className="h-11 rounded-xl" data-testid="analyze-url" />
            <Input placeholder="Headline (optional)" value={headline} onChange={(e) => setHeadline(e.target.value)} className="h-11 rounded-xl" />
            <p className="text-xs text-slate-500">We'll fetch the article and analyze it. Source reliability will also be computed.</p>
          </TabsContent>

          <TabsContent value="file" className="mt-6 space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition ${dragOver ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:bg-slate-50"}`}
              data-testid="dropzone">
              <Upload className="w-10 h-10 text-slate-400 mb-3" />
              <div className="font-medium">{file ? file.name : "Drop file here or click to browse"}</div>
              <div className="text-xs text-slate-500 mt-1">PDF, DOCX, TXT — up to 10MB</div>
              <input ref={fileRef} type="file" hidden accept=".pdf,.docx,.txt" onChange={(e) => setFile(e.target.files[0])} data-testid="file-input" />
            </div>
            <Input placeholder="Headline (optional)" value={headline} onChange={(e) => setHeadline(e.target.value)} className="h-11 rounded-xl" />
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button onClick={analyze} disabled={loading || (tab === "text" && !text) || (tab === "url" && !url) || (tab === "file" && !file)} className="bg-blue-600 hover:bg-blue-700 rounded-full h-11 px-8" data-testid="analyze-submit-btn">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing…</> : <><Sparkles className="w-4 h-4 mr-2" /> Analyze</>}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6" data-testid="result-panel">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-3xl bg-white border border-slate-200 p-6 flex flex-col items-center text-center">
                <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 mb-4">Prediction</div>
                <div className={`text-3xl font-display font-semibold ${result.prediction === "fake" ? "text-red-500" : "text-green-500"}`} data-testid="result-prediction">
                  {result.prediction === "fake" ? "🔴 Likely Fake" : "🟢 Likely Real"}
                </div>
                <div className="text-sm text-slate-500 mt-2">Confidence <span className="font-semibold text-slate-800" data-testid="result-confidence">{result.confidence}%</span></div>
                <Badge className={`mt-3 ${result.risk_level === "high" ? "bg-red-100 text-red-700" : result.risk_level === "medium" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                  Risk: {result.risk_level}
                </Badge>
              </div>

              <div className="rounded-3xl bg-white border border-slate-200 p-6 flex justify-center items-center">
                <CredibilityGauge score={result.credibility_score} />
              </div>

              <div className="rounded-3xl bg-white border border-slate-200 p-6">
                <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 mb-4">Meta</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Model</span><span className="font-medium">{result.model_used}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Time</span><span className="font-medium">{result.time_taken_sec}s</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Topics</span><span className="font-medium capitalize">{(result.topics || []).slice(0,2).join(", ") || "—"}</span></div>
                  {result.source && result.source.known && (
                    <div className="flex justify-between"><span className="text-slate-500">Source</span><span className="font-medium">{result.source.trust}</span></div>
                  )}
                </div>
                <Button onClick={exportPdf} variant="outline" className="w-full mt-4 rounded-xl" data-testid="export-pdf-btn"><Download className="w-4 h-4 mr-2" /> Export PDF</Button>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-6">
              <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 mb-3">Summary</div>
              <p className="text-slate-800 leading-relaxed">{result.summary}</p>
              <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 mt-6 mb-3">Reasoning</div>
              <p className="text-slate-700 leading-relaxed">{result.reasoning}</p>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500">Explainable AI — Article Highlights</div>
                <div className="flex gap-2 text-xs">
                  <span className="hl-clickbait px-2 py-0.5 rounded">Clickbait</span>
                  <span className="hl-emotional px-2 py-0.5 rounded">Emotional</span>
                  <span className="hl-bias px-2 py-0.5 rounded">Bias</span>
                  <span className="hl-unsupported px-2 py-0.5 rounded">Unsupported</span>
                </div>
              </div>
              <div className="text-slate-800 leading-loose whitespace-pre-wrap" data-testid="highlighted-article">
                {highlightText(result.text || text, result.highlights)}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-3xl bg-white border border-slate-200 p-6">
                <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Suspicious statements</div>
                <ul className="space-y-2 text-sm">
                  {(result.suspicious_statements || []).map((s, i) => (<li key={i} className="flex gap-2"><span className="text-amber-500">•</span>{s}</li>))}
                  {!result.suspicious_statements?.length && <li className="text-slate-500">None flagged.</li>}
                </ul>
              </div>
              <div className="rounded-3xl bg-white border border-slate-200 p-6">
                <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Recommendations</div>
                <ul className="space-y-2 text-sm">
                  {(result.recommendations || []).map((r, i) => (<li key={i} className="flex gap-2"><span className="text-green-500">✓</span>{r}</li>))}
                </ul>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-6">
              <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 mb-4">Credibility factors</div>
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(result.factors || {}).map(([k, v]) => (
                  <div key={k}>
                    <div className="flex justify-between text-sm mb-1"><span className="capitalize">{k.replace(/_/g, " ")}</span><span className="font-medium">{v}</span></div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.8 }}
                        className={`h-full ${v >= 70 ? "bg-green-500" : v >= 40 ? "bg-amber-500" : "bg-red-500"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
