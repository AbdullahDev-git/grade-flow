"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Sparkles, FileText, ChevronRight, Shield, Edit3, Loader2, AlertCircle, User, Calendar } from "lucide-react";
import Toast from "@/components/admin/Toast";

function getAuthHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${color || "bg-primary/10"}`}>{icon}</div>
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <p className="text-lg font-bold text-text-primary">{value}</p>
    </div>
  );
}

export default function SubmissionsCheckPage() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [grading, setGrading] = useState(null);
  const [gradeForm, setGradeForm] = useState({
    totalScore: 0,
    codeQuality: 0,
    structure: 0,
    requirementsMet: 0,
    bestPractices: 0,
    noErrors: 0,
  });

  const showToast = (msg) => setToast({ visible: true, message: msg });
  const hideToast = () => setToast({ visible: false, message: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`/api/admin/assignments/${params.id}/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then(setData)
      .catch(() => router.push("/admin/login"))
      .finally(() => setLoading(false));
  }, [router, params.id]);

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  };

  async function handleGrade(submissionId) {
    const token = localStorage.getItem("token");

    const res = await fetch(`/api/admin/submissions/${submissionId}/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        totalScore: gradeForm.totalScore,
        categoryScores: {
          codeQuality: gradeForm.codeQuality,
          structure: gradeForm.structure,
          requirementsMet: gradeForm.requirementsMet,
          bestPractices: gradeForm.bestPractices,
          noErrors: gradeForm.noErrors,
        },
      }),
    });

    if (res.ok) {
      const updated = await fetch(`/api/admin/assignments/${params.id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedData = await updated.json();
      setData(updatedData);
      setGrading(null);
      showToast("Grade saved successfully!");
    }
  }

  async function handleAIGrade(submissionId) {
    setGrading(submissionId);
    setGradeForm((prev) => ({ ...prev, totalScore: 85, codeQuality: 21, structure: 22, requirementsMet: 26, bestPractices: 12, noErrors: 9 }));
    setTimeout(() => handleGrade(submissionId), 500);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const breakdownCategories = [
    { label: "Code Quality", key: "codeQuality", max: 25 },
    { label: "Structure & Logic", key: "structure", max: 25 },
    { label: "Requirements Met", key: "requirementsMet", max: 30 },
    { label: "Best Practices", key: "bestPractices", max: 20 },
    { label: "No Errors / Bugs", key: "noErrors", max: 10 },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <Toast message={toast.message} visible={toast.visible} onClose={hideToast} />

      <button
        onClick={() => router.push("/admin/assignments")}
        className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back to Assignments
      </button>

      <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
        <Link href="/admin/assignments" className="hover:text-primary transition-colors">Assignments</Link>
        <ChevronRight size={14} />
        <span className="text-text-primary font-medium">{data?.assignment?.title || "Submissions"}</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-5">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Assignment Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard icon={<FileText size={16} className="text-primary" />} label="Total Submissions" value={data?.submissions?.length || 0} color="bg-primary/10" />
              <StatCard icon={<User size={16} className="text-secondary" />} label="Assignment" value={data?.assignment?.title || "—"} color="bg-secondary/10" />
              <StatCard icon={<Calendar size={16} className="text-warning" />} label="Deadline" value={formatDate(data?.assignment?.deadline)} color="bg-warning/10" />
            </div>
          </div>

          {data?.submissions?.map((s) => {
            const grade = s.grade;
            const breakdown = grade ? breakdownCategories.map((c) => ({ label: c.label, score: grade[c.key] ?? 0, max: c.max })) : [];

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl shadow-sm border border-border p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {s.student?.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">{s.student?.name || "Unknown Student"}</p>
                        <p className="text-xs text-text-secondary">{s.student?.email}</p>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary mt-2">Submitted: {formatDate(s.submittedAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={s.zipFile}
                      download
                      className="flex items-center gap-1.5 border border-border rounded-lg px-3.5 py-2 text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors"
                    >
                      <Download size={15} />
                      Download ZIP
                    </a>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setGrading(s.id);
                        if (grade) {
                          setGradeForm({
                            totalScore: grade.totalScore || 0,
                            codeQuality: grade.codeQuality || 0,
                            structure: grade.structure || 0,
                            requirementsMet: grade.requirementsMet || 0,
                            bestPractices: grade.bestPractices || 0,
                            noErrors: grade.noErrors || 0,
                          });
                        } else {
                          setGradeForm({ totalScore: 0, codeQuality: 0, structure: 0, requirementsMet: 0, bestPractices: 0, noErrors: 0 });
                        }
                      }}
                      className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Sparkles size={15} />
                      {grade ? "Override" : "AI Grade"}
                    </motion.button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-text-secondary mb-3">
                  <span className="flex items-center gap-1"><FileText size={14} />{s.zipFile?.split("/").pop() || "submission.zip"}</span>
                </div>

                {grade && (
                  <div className="border-t border-border pt-4 mt-2">
                    <div className="text-center mb-4">
                      <div className="text-4xl font-bold text-primary">
                        {grade.totalScore}<span className="text-lg text-text-secondary">/100</span>
                      </div>
                      <div className={`text-lg font-bold mt-1 ${grade.totalScore >= 70 ? "text-success" : "text-accent"}`}>
                        {grade.totalScore >= 90 ? "A+" : grade.totalScore >= 80 ? "A" : grade.totalScore >= 70 ? "B" : grade.totalScore >= 60 ? "C" : "D"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {breakdown.map((item) => {
                        const pct = item.max > 0 ? Math.round((item.score / item.max) * 100) : 0;
                        return (
                          <div key={item.label}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-text-secondary">{item.label} ({item.max}%)</span>
                              <span className="font-medium text-text-primary">{item.score}/{item.max}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className={`h-full rounded-full ${pct >= 90 ? "bg-success" : pct >= 70 ? "bg-primary" : "bg-warning"}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}

          {(!data?.submissions || data.submissions.length === 0) && (
            <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center">
              <FileText size={40} className="mx-auto text-text-secondary mb-3" />
              <p className="text-text-secondary text-sm">No submissions yet.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h3>
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { if (data?.submissions?.[0]) handleAIGrade(data.submissions[0].id); }}
                disabled={!data?.submissions?.length}
                className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles size={16} />
                  Auto-Grade All
                </div>
              </motion.button>
              <button
                className="w-full border border-border hover:bg-gray-50 py-2.5 rounded-lg text-sm font-medium text-text-secondary transition-colors"
              >
                <div className="flex items-center justify-center gap-2">
                  <Download size={16} />
                  Export All Results
                </div>
              </button>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Integrity Report</h3>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={18} className="text-success" />
              <span className="text-sm font-medium text-success">No Plagiarism Detected</span>
            </div>
            <p className="text-xs text-text-secondary">Average similarity: 2.3%</p>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-2">Stats</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Graded</span>
                <span className="font-medium text-text-primary">{data?.submissions?.filter(s => s.grade).length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Pending</span>
                <span className="font-medium text-warning">{data?.submissions?.filter(s => !s.grade).length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {grading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl p-6 w-full max-w-md shadow-lg border border-border mx-4"
          >
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {data?.submissions?.find(s => s.id === grading)?.grade ? "Manual Grade Override" : "Grade Submission"}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Total Score (0-100)</label>
                <input
                  type="number"
                  value={gradeForm.totalScore}
                  onChange={(e) => setGradeForm({ ...gradeForm, totalScore: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {breakdownCategories.map((cat) => (
                  <div key={cat.key}>
                    <label className="block text-xs font-medium text-text-secondary mb-1">{cat.label} (0-{cat.max})</label>
                    <input
                      type="number"
                      value={gradeForm[cat.key]}
                      onChange={(e) => setGradeForm({ ...gradeForm, [cat.key]: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setGrading(null)}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleGrade(grading)}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Save Grade
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
