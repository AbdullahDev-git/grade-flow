"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Edit2, Loader2, AlertCircle } from "lucide-react";
import StatsCard from "@/components/admin/StatsCard";
import StatusBadge from "@/components/admin/StatusBadge";


export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    async function fetchData() {
      try {
        const res = await fetch("/api/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

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
        <div className="text-center">
          <AlertCircle size={40} className="mx-auto text-accent mb-3" />
          <p className="text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: "📝", number: data.totalAssignments, label: "Total Assignments", color: "primary" },
    { icon: "📤", number: data.totalSubmissions, label: "Total Submissions", color: "secondary" },
    { icon: "⏳", number: data.pendingReviews, label: "Pending Reviews", color: "warning" },
    { icon: "👨‍🎓", number: data.activeStudents ?? "—", label: "Active Students", color: "success" },
  ];

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-1">
          Welcome back. Here&apos;s your overview.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <StatsCard key={s.label} {...s} />
        ))}
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border p-5">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Submissions</h2>
          {data.recentSubmissions.length === 0 ? (
            <p className="text-text-secondary text-sm py-8 text-center">No submissions yet</p>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-3 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Student Name</th>
                    <th className="text-left px-3 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Assignment</th>
                    <th className="text-left px-3 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left px-3 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left px-3 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSubmissions.map((row, i) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-border/50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-3 font-medium text-text-primary">{row.student?.name || "Unknown"}</td>
                      <td className="px-3 py-3 text-text-secondary">{row.assignment?.title || "—"}</td>
                      <td className="px-3 py-3 text-text-secondary">{formatDate(row.submittedAt)}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={row.grade ? "Graded" : "Pending"} />
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => router.push(`/admin/submissions/${row.id}`)}
                          className="flex items-center gap-1 text-primary hover:text-primary-dark text-sm font-medium transition-colors"
                        >
                          <Edit2 size={14} />
                          Review
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  );
}
