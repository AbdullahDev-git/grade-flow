"use client";
import { Server, Database, Clock, Shield } from "lucide-react";

export default function SystemHealthCard({ health }) {
  const metrics = [
    { label: "Server Load", value: `${health.serverLoad}%`, icon: Server, progress: health.serverLoad, color: "bg-accent" },
    { label: "Database Sync", value: health.dbSync, icon: Database, dot: "bg-green-500" },
    { label: "Uptime", value: health.uptime, icon: Clock },
    { label: "Last Backup", value: health.lastBackup, icon: Shield },
  ];

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4">System Health</h3>
      <div className="space-y-4">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-50">
              <m.icon size={16} className="text-text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-secondary">{m.label}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">{m.value}</span>
                {m.dot && <span className={`w-2 h-2 rounded-full ${m.dot}`} />}
              </div>
              {m.progress != null && (
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                  <div
                    className={`h-full rounded-full ${m.color} transition-all`}
                    style={{ width: `${m.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
