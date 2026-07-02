"use client";
import { motion } from "framer-motion";

export default function StatsCard({ icon, number, label, color = "primary" }) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    warning: "bg-warning/10 text-warning",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-sm border border-border p-5 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary">{label}</p>
          <p className="text-3xl font-bold text-text-primary mt-1">{number}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.primary}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </motion.div>
  );
}
