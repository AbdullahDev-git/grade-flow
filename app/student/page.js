"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, Clock, ArrowRight, CheckCircle, FileText, ClipboardList } from "lucide-react";

export default function StudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("/api/student/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const isUrgent = (deadline) => {
    const diff = new Date(deadline) - new Date();
    return diff > 0 && diff < 48 * 60 * 60 * 1000;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <AlertCircle size={40} className="mx-auto text-accent mb-3" />
        <p className="text-text-secondary">{error}</p>
      </div>
    );
  }

  const formatDeadline = (d) => {
    const date = new Date(d);
    const urgent = isUrgent(d);
    return (
      <span className={urgent ? "text-accent font-medium" : "text-text-secondary"}>
        {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        {urgent && <span className="ml-1.5 inline-flex items-center gap-1 text-xs text-accent">• Due soon</span>}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-text-primary">
          Welcome, <span className="text-primary">{data?.name || "Student"}</span>
        </h1>
        <p className="text-sm text-text-secondary mt-1">Here&apos;s your assignment overview.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Action Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {data?.recentPending ? (
              <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    <Clock size={12} className="mr-1" />
                    Pending
                  </span>
                  {isUrgent(data.recentPending.deadline) && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Urgent
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {data.recentPending.title}
                </h3>
                <div className="flex items-center gap-2 text-sm mb-5">
                  <Clock size={14} className="text-text-secondary" />
                  {formatDeadline(data.recentPending.deadline)}
                </div>
                <Link
                  href={`/student/assignments/${data.recentPending.id}`}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Submit Assignment
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-success" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">All caught up!</h3>
                <p className="text-sm text-text-secondary">No pending assignments. Great job!</p>
              </div>
            )}
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div className="bg-card rounded-xl shadow-sm border border-border p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <ClipboardList size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Active Assignments</p>
                <p className="text-2xl font-bold text-text-primary">{data?.totalAssignments || 0}</p>
              </div>
            </div>
            <div className="bg-card rounded-xl shadow-sm border border-border p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-warning/10">
                <Clock size={24} className="text-warning" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Pending</p>
                <p className="text-2xl font-bold text-text-primary">{data?.pendingCount || 0}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl shadow-sm border border-border p-5"
          >
            <h3 className="text-sm font-semibold text-text-primary mb-3">Quick Info</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Total Assignments</p>
                  <p className="text-sm font-medium text-text-primary">{data?.totalAssignments || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock size={16} className="text-warning" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Pending</p>
                  <p className="text-sm font-medium text-text-primary">{data?.pendingCount || 0}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl shadow-sm border border-border p-5"
          >
            <div className="text-3xl mb-2">💡</div>
            <p className="text-sm text-text-secondary italic leading-relaxed">
              &ldquo;The beautiful thing about learning is that nobody can take it away from you.&rdquo;
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-xl shadow-sm border border-border p-5"
          >
            <Link
              href="/student/assignments"
              className="flex items-center justify-between text-sm text-primary hover:text-primary-dark font-medium transition-colors"
            >
              View All Assignments
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
