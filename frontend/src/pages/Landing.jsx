import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Zap, BarChart3, FileText, Globe, MessageSquare, ChevronRight, CheckCircle2, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Shield, title: "Fake News Detection", desc: "AI-powered classifier trained on the language patterns of misinformation." },
  { icon: BarChart3, title: "Credibility Score", desc: "0-100 score weighing writing style, sources, evidence and bias." },
  { icon: Brain, title: "Explainable AI", desc: "Highlighted clickbait, emotional language, and unsupported claims." },
  { icon: Zap, title: "Trend Analytics", desc: "See which topics are most targeted by fake news right now." },
  { icon: FileText, title: "Report Generation", desc: "Export shareable PDF and JSON reports for every analysis." },
  { icon: Globe, title: "Source Reliability", desc: "Instant reputation ratings for hundreds of domains." },
  { icon: MessageSquare, title: "AI Chat Assistant", desc: "Ask follow-ups: 'why is this suspicious?', 'how do I verify?'" },
  { icon: Sparkles, title: "Browser Extension", desc: "Coming soon — analyze articles from any tab in one click." },
];

const steps = ["Upload article", "Preprocess text", "Extract features", "AI classification", "Explainability", "Credibility score", "Report"];

export default function Landing() {
  return (
    <div className="hero-bg min-h-screen text-slate-900">
      {/* Nav */}
      <header className="glass sticky top-0 z-50 border-b border-slate-200/50" data-testid="landing-nav">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 grid place-items-center text-white">
              <Shield className="w-5 h-5" />
            </div>
            TruthLens<span className="text-blue-600">AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#workflow" className="hover:text-slate-900">How it works</a>
            <a href="#tech" className="hover:text-slate-900">Technology</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" data-testid="nav-login-btn">Sign in</Button></Link>
            <Link to="/register"><Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full" data-testid="nav-signup-btn">Get started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium mb-6">
            <Sparkles className="w-3 h-3" /> Powered by GPT-5.2 & Explainable AI
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tighter leading-[1.05] max-w-4xl mx-auto">
            See through the noise.<br />
            <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">Trust the truth.</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            AI-powered fake news detection with explainable credibility analysis. Instantly analyze any article — text, URL, or file — and see exactly why it's trustworthy or not.
          </p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link to="/register"><Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-12 px-8 text-base" data-testid="hero-analyze-btn">Analyze an article <ChevronRight className="w-4 h-4 ml-1" /></Button></Link>
            <Link to="/login"><Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base border-slate-300" data-testid="hero-dashboard-btn">View dashboard</Button></Link>
          </div>
        </motion.div>

        {/* Hero mockup */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }} className="mt-16 max-w-4xl mx-auto">
          <div className="glass rounded-3xl p-8 shadow-2xl">
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="rounded-2xl bg-white p-6 border border-slate-100">
                <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Prediction</div>
                <div className="text-2xl font-display font-semibold text-red-500">Likely Fake</div>
                <div className="text-sm text-slate-500 mt-1">Confidence 94%</div>
              </div>
              <div className="rounded-2xl bg-white p-6 border border-slate-100">
                <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Credibility</div>
                <div className="text-2xl font-display font-semibold text-amber-500">32/100</div>
                <div className="text-sm text-slate-500 mt-1">Risk: High</div>
              </div>
              <div className="rounded-2xl bg-white p-6 border border-slate-100">
                <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Time</div>
                <div className="text-2xl font-display font-semibold text-slate-900">2.1s</div>
                <div className="text-sm text-slate-500 mt-1">GPT-5.2</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-2xl mb-16">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-blue-600 mb-3">Capabilities</div>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">Everything you need to fact-check faster.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="rounded-3xl bg-white border border-slate-200 p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-blue-50 grid place-items-center mb-5">
                <f.icon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-teal-600 mb-3">How it works</div>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">From article to insight in seconds.</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {steps.map((s, i) => (
            <motion.div key={s} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3">
              <div className="rounded-2xl bg-white border border-slate-200 px-5 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white grid place-items-center text-xs font-bold">{i + 1}</div>
                <span className="text-sm font-medium">{s}</span>
              </div>
              {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-slate-400 hidden sm:block" />}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tech */}
      <section id="tech" className="max-w-7xl mx-auto px-6 py-24">
        <div className="glass rounded-3xl p-12 text-center">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-blue-600 mb-3">Built on</div>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-8">Industrial-grade AI stack.</h2>
          <div className="flex flex-wrap justify-center gap-8 text-slate-600 font-medium">
            {["React", "FastAPI", "MongoDB", "GPT-5.2", "HuggingFace", "Docker"].map(t => (
              <div key={t} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-500" />{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mb-6">Ready to see the truth?</h2>
        <p className="text-lg text-slate-600 mb-8">Free forever. Analyze your first article in under a minute.</p>
        <Link to="/register"><Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-12 px-10 text-base" data-testid="cta-signup-btn">Get started free</Button></Link>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between items-center gap-4 text-sm text-slate-600">
          <div>© 2026 TruthLens AI</div>
          <div className="flex gap-6"><a href="#" className="hover:text-slate-900">About</a><a href="#" className="hover:text-slate-900">Privacy</a><a href="#" className="hover:text-slate-900">Terms</a><a href="#" className="hover:text-slate-900">Contact</a></div>
        </div>
      </footer>
    </div>
  );
}
