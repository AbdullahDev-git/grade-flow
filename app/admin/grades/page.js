"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Clock, Download, Loader2, AlertCircle, ChevronRight, Plus } from "lucide-react";
import DataTable from "@/components/admin/DataTable";

function getAuthHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function renderScoreBreakdown(grade) {
  if (!grade.scores || Object.keys(grade.scores).length === 0) {
    return <span className="font-semibold text-text-primary">{grade.score != null ? `${grade.score}/100` : "—"}</span>;
  }
  const criteria = grade.criteria || {};
  return (
    <div className="space-y-1">
      <div className="font-semibold text-text-primary">{grade.score != null ? `${grade.score}/100` : "—"}</div>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(grade.scores).map(([key, score]) => {
          const metric = criteria[key];
          const label = metric?.label || key;
          const max = metric?.weight || 0;
          return (
            <span key={key} className="text-xs px-2 py-0.5 bg-gray-100 rounded text-text-secondary hover:bg-gray-200 cursor-default" title={`${label}: ${score}/${max}`}>
              {label}: {score}/{max}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function GradesPage() {
  const router = useRouter();
  const [grades, setGrades] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [studentFilter, setStudentFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [gradesRes, asgnRes] = await Promise.all([
        fetch("/api/admin/grades", { headers: getAuthHeaders() }),
        fetch("/api/admin/assignments", { headers: getAuthHeaders() }),
      ]);
      if (!gradesRes.ok || !asgnRes.ok) throw new Error("Failed to load data");
      const [gradesJson, asgnJson] = await Promise.all([gradesRes.json(), asgnRes.json()]);
      setGrades(gradesJson.grades);
      setAssignments(asgnJson.assignments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch("/api/admin/export", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gradeflow-report.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (!assignmentFilter && !studentFilter) return;
    fetchFiltered();
  }, [assignmentFilter, studentFilter]);

  async function fetchFiltered() {
    const params = new URLSearchParams();
    if (assignmentFilter && assignmentFilter !== "all") params.set("assignmentId", assignmentFilter);
    if (studentFilter && studentFilter !== "all") params.set("studentId", studentFilter);
    try {
      const res = await fetch(`/api/admin/grades?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setGrades(json.grades);
    } catch {
      // silently fail filter
    }
  }

  const uniqueStudents = [...new Set(grades.map((g) => g.studentName))];

  const numericScores = grades
    .map((g) => g.score)
    .filter((s) => s != null)
    .map(Number);
  const classAverage = numericScores.length
    ? Math.round(numericScores.reduce((a, b) => a + b, 0) / numericScores.length)
    : 0;

  const topPerformers = numericScores.filter((s) => s >= 80).length;

  const columns = [
    { key: "studentName", label: "Student Name" },
    { key: "assignmentTitle", label: "Assignment" },
    {
      key: "score",
      label: "Score",
      render: (val, row) => renderScoreBreakdown(row),
    },
    {
      key: "course",
      label: "Course",
      render: (val) => <span className="text-sm px-2 py-0.5 bg-gray-100 rounded text-text-secondary capitalize">{val}</span>,
    },
    {
      key: "gradedAt",
      label: "Date",
      render: (val) => formatDate(val),
    },
    {
      key: "actions",
      label: "Actions",
      render: (val, row) => (
        <button
          onClick={() => router.push(`/admin/submissions/${row.submissionId}`)}
          className="text-primary hover:text-primary-dark text-sm font-medium transition-colors"
        >
          View Details
        </button>
      ),
    },
  ];

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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Grades Management</h1>
          <p className="text-sm text-text-secondary mt-1">Review and manage student grades</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 border border-border rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-sm border border-border p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-text-secondary">Class Average</p>
            <div className="p-2 rounded-lg bg-primary/10">
              <span className="text-primary text-lg">📊</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none" stroke="#6C63FF" strokeWidth="3"
                  strokeDasharray={`${classAverage * 0.97} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary">
                {classAverage}%
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{classAverage}%</p>
              <p className="text-xs text-text-secondary">Average Score</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl shadow-sm border border-border p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-text-secondary">Top Performers</p>
            <div className="p-2 rounded-lg bg-warning/10">
              <Trophy size={20} className="text-warning" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary">{topPerformers} Students</p>
          <p className="text-xs text-text-secondary mt-1">Scored 80% or above</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl shadow-sm border border-border p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-text-secondary">Pending Reviews</p>
            <div className="p-2 rounded-lg bg-accent/10">
              <Clock size={20} className="text-accent" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary">
            {grades.filter((g) => g.score == null).length} Drafts
          </p>
          <p className="text-xs text-text-secondary mt-1">Awaiting final grade</p>
        </motion.div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border p-5 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">By Assignment</label>
            <select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Assignments</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">By Student</label>
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="all">All Students</option>
              {uniqueStudents.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border p-5">
        {grades.length === 0 ? (
          <p className="text-text-secondary text-sm py-8 text-center">No grades yet. Grade submissions to see them here.</p>
        ) : (
          <DataTable
            columns={columns}
            data={grades}
            pageSize={5}
            searchPlaceholder="Search grades..."
          />
        )}
      </div>
    </div>
  );
}
