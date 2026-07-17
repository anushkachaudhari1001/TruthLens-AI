import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "ai", text: "Hi! Ask me anything about news verification, credibility scoring, or a specific article." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input;
    setMsgs((m) => [...m, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await api.post("/chat", { message: userMsg, session_id: sessionId });
      setSessionId(data.session_id);
      setMsgs((m) => [...m, { role: "ai", text: data.response }]);
    } catch (err) {
      setMsgs((m) => [...m, { role: "ai", text: "Sorry, I'm having trouble responding." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(!open)} className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl bg-gradient-to-br from-blue-600 to-teal-500 hover:opacity-90 z-50" data-testid="ai-assistant-toggle">
        {open ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] glass rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden" data-testid="ai-assistant-panel">
            <div className="p-4 border-b border-slate-200/50 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="font-display font-semibold">AI Assistant</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.role === "user" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 text-sm text-slate-500">Thinking…</div>
                </div>
              )}
            </div>
            <form onSubmit={send} className="p-3 border-t border-slate-200/50 flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about news…" className="flex-1 rounded-xl" data-testid="ai-input" />
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 rounded-xl" data-testid="ai-send-btn"><Send className="w-4 h-4" /></Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
