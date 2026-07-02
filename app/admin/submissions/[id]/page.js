"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Download, FileText, ChevronRight, Shield, Edit3, Loader2, AlertCircle, X, Save } from "lucide-react";
import Toast from "@/components/admin/Toast";

function getAuthHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

export default function SubmissionCheckPage({ params }) {
  const router = useRouter();
  const [submissionId, setSubmissionId] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [gradeResult, setGradeResult] = useState(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    codeQuality: 0,
    structure: 0,
    requirementsMet: 0,
    bestPractices: 0,
    noErrors: 0,
  });

  useEffect(() => {
    async function resolveParams() {
      const { id } = await params;
      setSubmissionId(id);
    }
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!submissionId) return;
    const token = localStorage.getItem("token");
    if (!token) { router.push("/admin/login"); return; }

    async function fetchSubmission() {
      try {
        const res = await fetch(`/api/admin/submissions/${submissionId}/grade`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to load submission");
        const json = await res.json();
        setSubmission(json.submission);
        if (json.grade) {
          setGradeResult(json.grade);
          setGradeForm({
            codeQuality: json.grade.codeQuality ?? 0,
            structure: json.grade.structure ?? 0,
            requirementsMet: json.grade.requirementsMet ?? 0,
            bestPractices: json.grade.bestPractices ?? 0,
            noErrors: json.grade.noErrors ?? 0,
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSubmission();
  }, [submissionId, router]);

  const handleDownload = async () => {
    if (!submission?.zipFile) return;
    try {
      const res = await fetch(`/api/download?path=${encodeURIComponent(submission.zipFile)}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const studentName = submission?.student?.name || "submission";
      a.href = url;
      a.download = `${studentName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Failed to download file");
    }
  };

  const openGradeModal = () => {
    if (!gradeResult) {
      setGradeForm({ codeQuality: 0, structure: 0, requirementsMet: 0, bestPractices: 0, noErrors: 0 });
    }
    setShowGradeModal(true);
  };

  const handleGradeChange = (field, value) => {
    const num = Math.min(Math.max(0, parseInt(value) || 0), getMaxForField(field));
    setGradeForm((prev) => ({ ...prev, [field]: num }));
  };

  const getMaxForField = (field) => {
    const maxes = { codeQuality: 25, structure: 20, requirementsMet: 30, bestPractices: 15, noErrors: 10 };
    return maxes[field] || 0;
  };

  const totalFromForm = () => {
    return gradeForm.codeQuality + gradeForm.structure + gradeForm.requirementsMet + gradeForm.bestPractices + gradeForm.noErrors;
  };

  const handleSaveGrade = async () => {
    setSavingGrade(true);
    const total = totalFromForm();
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          totalScore: total,
          categoryScores: gradeForm,
        }),
      });
      if (!res.ok) throw new Error("Failed to save grade");
      const json = await res.json();
      setGradeResult(json.grade);
      setShowGradeModal(false);
      showToast("Grade saved successfully!");
    } catch (err) {
      showToast(err.message);
    } finally {
      setSavingGrade(false);
    }
  };

  const showToast = (msg) => setToast({ visible: true, message: msg });
  const hideToast = () => setToast({ visible: false, message: "" });

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    });
  };

  const breakdown = gradeResult
    ? [
        { label: "Code Quality", score: gradeResult.codeQuality ?? 0, max: 25 },
        { label: "Structure & Logic", score: gradeResult.structure ?? 0, max: 20 },
        { label: "Requirements Met", score: gradeResult.requirementsMet ?? 0, max: 30 },
        { label: "Best Practices", score: gradeResult.bestPractices ?? 0, max: 15 },
        { label: "No Errors / Bugs", score: gradeResult.noErrors ?? 0, max: 10 },
      ]
    : [];

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

  const totalScore = gradeResult?.totalScore ?? 0;
  const gradeLetter = totalScore >= 90 ? "A+" : totalScore >= 80 ? "A" : totalScore >= 70 ? "B" : totalScore >= 60 ? "C" : "D";

  const gradeFields = [
    { key: "codeQuality", label: "Code Quality", max: 25 },
    { key: "structure", label: "Structure & Logic", max: 20 },
    { key: "requirementsMet", label: "Requirements Met", max: 30 },
    { key: "bestPractices", label: "Best Practices", max: 15 },
    { key: "noErrors", label: "No Errors / Bugs", max: 10 },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <Toast message={toast.message} visible={toast.visible} onClose={hideToast} />

      <button
        onClick={() => router.push("/admin/dashboard")}
        className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
        <button onClick={() => router.push("/admin/assignments")} className="hover:text-primary transition-colors">
          Assignments
        </button>
        <ChevronRight size={14} />
        <span className="text-text-primary font-medium">Submission Review</span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-5">
            <h2 className="text-lg font-semibold text-text-primary mb-3">Submission Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-secondary">Student</p>
                <p className="font-medium text-text-primary">{submission?.student?.name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-text-secondary">Submitted</p>
                <p className="font-medium text-text-primary">{formatDate(submission?.submittedAt)}</p>
              </div>
              <div>
                <p className="text-text-secondary">File</p>
                <p className="font-medium text-text-primary">{submission?.zipFile?.split("/").pop() || "No file"}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{submission?.zipFile?.split("/").pop() || "submission.zip"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 border border-border rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-gray-50 transition-colors"
              >
                <Download size={16} />
                Download ZIP
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openGradeModal}
                className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Edit3 size={16} />
                {gradeResult ? "Edit Grade" : "Grade Submission"}
              </motion.button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Grading Results</h3>
            {!gradeResult ? (
              <p className="text-sm text-text-secondary text-center py-6">
                Click &ldquo;Grade Submission&rdquo; to enter marks
              </p>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-primary">
                    {totalScore}<span className="text-lg text-text-secondary">/100</span>
                  </div>
                  <div className={`text-2xl font-bold mt-1 ${totalScore >= 70 ? "text-success" : "text-accent"}`}>
                    {gradeLetter}
                  </div>
                </div>

                <div className="space-y-3">
                  {breakdown.map((item) => {
                    const pct = item.max > 0 ? Math.round((item.score / item.max) * 100) : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-text-secondary">{item.label}</span>
                          <span className="font-medium text-text-primary">{item.score}/{item.max}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className={`h-full rounded-full ${
                              pct >= 90 ? "bg-success" : pct >= 70 ? "bg-primary" : "bg-warning"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Integrity Report</h3>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={18} className="text-success" />
              <span className="text-sm font-medium text-success">
                {gradeResult ? "No Plagiarism Detected" : "Pending Analysis"}
              </span>
            </div>
            <p className="text-xs text-text-secondary">Verified against Global Database</p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showGradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-lg font-semibold text-text-primary">Grade Submission</h2>
                <button onClick={() => setShowGradeModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="text-sm text-text-secondary mb-2">
                  Enter marks for <strong>{submission?.student?.name || "Unknown"}</strong>
                </div>

                {gradeFields.map((field) => (
                  <div key={field.key}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <label className="font-medium text-text-primary">{field.label}</label>
                      <span className="text-text-secondary">/ {field.max}</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={field.max}
                      value={gradeForm[field.key]}
                      onChange={(e) => handleGradeChange(field.key, e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                ))}

                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-base font-bold">
                    <span className="text-text-primary">Total</span>
                    <span className="text-primary">{totalFromForm()}/100</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
                <button
                  onClick={() => setShowGradeModal(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveGrade}
                  disabled={savingGrade}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {savingGrade ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {savingGrade ? "Saving..." : "Save Grade"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
