import { motion } from "framer-motion";

export default function CredibilityGauge({ score = 0, size = 180 }) {
  const s = Math.max(0, Math.min(100, score));
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (s / 100) * circumference;
  const color = s >= 70 ? "#22C55E" : s >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <div className="relative inline-block" style={{ width: size, height: size }} data-testid="credibility-gauge">
      <svg width={size} height={size} viewBox="0 0 180 180" className="-rotate-90">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="14" />
        <motion.circle
          cx="90" cy="90" r={radius} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-4xl font-display font-semibold" style={{ color }}>{s}</motion.div>
        <div className="text-xs uppercase tracking-widest text-slate-500 mt-1">Credibility</div>
      </div>
    </div>
  );
}
