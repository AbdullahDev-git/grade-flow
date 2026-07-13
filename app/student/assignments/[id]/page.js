"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, File, X, Loader2, AlertCircle, CheckCircle, Clock, Download, FileText, Edit3, XCircle } from "lucide-react";

export default function SubmitAssignmentPage({ params }) {
  const router = useRouter();
  const token = localStorage.getItem("token");
  const [assignment, setAssignment] = useState(null);
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    async function load() {
      const { id } = await params;
      const token = localStorage.getItem("token");

      try {
        const res = await fetch("/api/student/assignments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        const found = data.assignments.find((a) => a.id === id);
        if (!found) {
          setError("Assignment not found or no longer available");
          setLoading(false);
          return;
        }
        setAssignment(found);

        if (found.status === "submitted") {
          const subRes = await fetch(`/api/student/assignments/${id}/submit`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (subRes.ok) {
            const subData = await subRes.json();
            setExistingSubmission(subData.submission);
          }
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router, params]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.name.endsWith(".zip")) {
      setFile(dropped);
      setError("");
    } else {
      setError("Only ZIP files are allowed");
    }
  }, []);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.name.endsWith(".zip")) {
      setFile(selected);
      setError("");
    } else {
      setError("Only ZIP files are allowed");
    }
  };

  async function handleSubmit() {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setError("");

    const token = localStorage.getItem("token");
    const { id } = await params;
    const formData = new FormData();
    formData.append("file", file);

    const isEdit = !!(existingSubmission && editMode);

    try {
      const res = await fetch(`/api/student/assignments/${id}/submit`, {
        method: isEdit ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setUploading(false);
        return;
      }

      setUploadProgress(100);
      setSuccessMessage(isEdit ? "Updated Successfully!" : "Submitted Successfully!");
      setExistingSubmission(data.submission);
      setTimeout(() => {
        setSuccess(true);
        setEditMode(false);
        setFile(null);
      }, 500);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const removeFile = () => {
    setFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatDeadline = (d) => {
    return new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (d) => {
    return new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const deadlinePassed = assignment && new Date(assignment.deadline) < new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center py-20">
        <AlertCircle size={40} className="mx-auto text-accent mb-3" />
        <p className="text-text-secondary">Assignment not found.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 20 }}
          className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-5"
        >
          <CheckCircle size={44} className="text-success" />
        </motion.div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">{successMessage}</h2>
        <p className="text-text-secondary text-sm mb-8">Your work has been received.</p>
        <Link
          href="/student"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/student"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-2">{assignment.title}</h1>
          {assignment.description && (
            <p className="text-sm text-text-secondary mb-3 whitespace-pre-line">{assignment.description}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Clock size={14} />
            Due: {formatDeadline(assignment.deadline)}
          </div>
        </div>

        {/* Requirements PDF */}
        {assignment.requirementsPDF && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-5 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <FileText size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{assignment.requirementsPDFName || "Assignment Requirements"}</p>
                  <p className="text-xs text-text-secondary">Download the requirements PDF before submitting</p>
                </div>
              </div>
              <a
                href={`/api/download?url=${encodeURIComponent(assignment.requirementsPDF)}&filename=${encodeURIComponent(assignment.requirementsPDFName || "requirements.pdf")}&token=${encodeURIComponent(token || "")}`}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Download size={15} />
                Download PDF
              </a>
            </div>
          </div>
        )}

        {/* Already submitted, deadline active — show submission info + edit option */}
        {existingSubmission && !editMode && !deadlinePassed && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6 border-l-4 border-l-success">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-success/10">
                <CheckCircle size={20} className="text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-success">Submission Received</p>
                <p className="text-xs text-text-secondary">Submitted on {formatDate(existingSubmission.submittedAt)}</p>
              </div>
            </div>
            <button
              onClick={() => setEditMode(true)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Edit3 size={16} />
              Edit Submission
            </button>
          </div>
        )}

        {/* Already submitted, deadline passed — show only submission info */}
        {existingSubmission && deadlinePassed && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6 border-l-4 border-l-success">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/10">
                <CheckCircle size={20} className="text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-success">Submitted</p>
                <p className="text-xs text-text-secondary">Submitted on {formatDate(existingSubmission.submittedAt)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Deadline passed and not submitted */}
        {deadlinePassed && !existingSubmission && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <XCircle size={28} className="text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">Assignment Closed</h3>
            <p className="text-sm text-text-secondary">The submission deadline has passed.</p>
          </div>
        )}

        {/* Edit mode banner */}
        {editMode && existingSubmission && (
          <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-6 border-l-4 border-l-warning bg-amber-50/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 size={16} className="text-warning" />
                <p className="text-sm font-medium text-text-primary">Editing your submission</p>
              </div>
              <button
                onClick={() => { setEditMode(false); setFile(null); setError(""); }}
                className="text-xs text-text-secondary hover:text-accent transition-colors"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Current submission: {formatDate(existingSubmission.submittedAt)}. Upload a new ZIP file to replace it.
            </p>
          </div>
        )}

        {/* Upload Zone — show if not submitted, or if editing */}
        {(!existingSubmission || editMode) && !deadlinePassed && (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !file && inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : file
                  ? "border-success bg-success/5"
                  : "border-border hover:border-primary/50 hover:bg-gray-50"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!file ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Upload size={28} className="text-primary" />
                  </div>
                  <p className="text-sm font-medium text-text-primary mb-1">
                    {dragOver ? "Drop your file here" : "Drag & drop your ZIP file here"}
                  </p>
                  <p className="text-xs text-text-secondary mb-4">or click to browse</p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                    className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Browse Files
                  </button>
                  <p className="text-xs text-text-secondary mt-4">ZIP file only (Max {assignment.maxFileSize || 10}MB)</p>
                </>
              ) : (
                <div className="flex items-center justify-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <File size={24} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-text-primary">{file.name}</p>
                    <p className="text-xs text-text-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(); }}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X size={18} className="text-accent" />
                  </button>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="mt-4">
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
                <p className="text-xs text-text-secondary mt-1 text-center">{uploadProgress}% uploaded</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 flex items-center gap-2"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            {/* Submit / Update Button */}
            {file && !uploading && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                className="mt-6 w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {editMode ? "Update Submission" : "Submit Assignment"}
              </motion.button>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}