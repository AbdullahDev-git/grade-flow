"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";

function getStudentBadge(status) {
  const map = {
    submitted: "Submitted",
    pending: "Pending",
    overdue: "Overdue",
  };
  return <StatusBadge status={map[status] || status} />;
}

export default function StudentAssignments() {
  const router = useRouter();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("/api/student/assignments", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load assignments");
        return res.json();
      })
      .then((data) => setAssignments(data.assignments))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

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

  const pendingCount = assignments.filter((a) => a.status === "pending").length;
  const submittedCount = assignments.filter((a) => a.status === "submitted").length;

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-text-primary">All Assignments</h1>
        <p className="text-sm text-text-secondary mt-1">Track and submit your assignments.</p>
      </motion.div>

      {/* Mini Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-sm border border-border p-4 flex items-center gap-3"
        >
          <div className="p-2.5 rounded-lg bg-primary/10">
            <FileText size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Total</p>
            <p className="text-xl font-bold text-text-primary">{assignments.length}</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-xl shadow-sm border border-border p-4 flex items-center gap-3"
        >
          <div className="p-2.5 rounded-lg bg-yellow-50">
            <Clock size={20} className="text-warning" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Pending</p>
            <p className="text-xl font-bold text-text-primary">{pendingCount}</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl shadow-sm border border-border p-4 flex items-center gap-3"
        >
          <div className="p-2.5 rounded-lg bg-green-50">
            <CheckCircle size={20} className="text-success" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Submitted</p>
            <p className="text-xl font-bold text-text-primary">{submittedCount}</p>
          </div>
        </motion.div>
      </div>

      {/* Assignments Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        {assignments.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={40} className="mx-auto text-text-secondary mb-3" />
            <p className="text-text-secondary text-sm">No assignments available yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                    Assignment Name
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a, i) => (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-medium text-text-primary">{a.title}</td>
                    <td className="px-4 py-3.5">{getStudentBadge(a.status)}</td>
                    <td className="px-4 py-3.5">
                      {a.status === "overdue" ? (
                        <span className="flex items-center gap-1.5 text-accent">
                          <XCircle size={14} />
                          Closed
                        </span>
                      ) : (
                        <span className={`flex items-center gap-1.5 ${isUrgent(a.deadline) ? "text-accent font-medium" : "text-text-secondary"}`}>
                          <Clock size={14} />
                          {formatDate(a.deadline)}
                          {isUrgent(a.deadline) && <span className="text-xs text-accent">• Soon</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {a.status === "overdue" ? (
                        <span className="text-sm text-text-secondary">Closed</span>
                      ) : a.status === "submitted" ? (
                        <span className="inline-flex items-center gap-1 text-sm text-success font-medium">
                          <CheckCircle size={14} />
                          Submitted
                        </span>
                      ) : (
                        <button
                          onClick={() => router.push(`/student/assignments/${a.id}`)}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-dark font-medium transition-colors"
                        >
                          Submit Now
                        </button>
                      )}
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
