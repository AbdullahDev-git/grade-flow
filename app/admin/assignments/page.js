"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader2, AlertCircle } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import FileUploadZone from "@/components/admin/FileUploadZone";
import Toast from "@/components/admin/Toast";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import ErrorPopover from "@/components/admin/ErrorPopover";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [errPop, setErrPop] = useState({ visible: false, message: "" });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
    maxFileSize: 25,
    requirements: null,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/admin/login"); return; }
    fetchAssignments();
  }, [router]);

  async function fetchAssignments() {
    try {
      const res = await fetch("/api/admin/assignments", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load assignments");
      const json = await res.json();
      setAssignments(json.assignments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const showToast = (msg) => setToast({ visible: true, message: msg });
  const hideToast = () => setToast({ visible: false, message: "" });
  const showErr = (msg) => setErrPop({ visible: true, message: msg });
  const hideErr = () => setErrPop({ visible: false, message: "" });

  const handlePublish = async () => {
    if (!form.title || !form.deadline) {
      showErr("Title and deadline are required");
      return;
    }

    setSaving(true);
    try {
      const body = new FormData();
      body.append("title", form.title);
      body.append("description", form.description);
      body.append("deadline", form.deadline);
      body.append("maxFileSize", String(form.maxFileSize));
      if (form.requirements) body.append("requirementsPDF", form.requirements);

      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body,
      });

      if (!res.ok) {
        const data = await res.json();
        showErr(data.error || "Failed to publish");
        return;
      }

      setForm({ title: "", description: "", deadline: "", maxFileSize: 25, requirements: null });
      setShowForm(false);
      showToast("Assignment published successfully!");
      await fetchAssignments();
    } catch {
      showErr("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => setConfirm({ open: true, id });

  const confirmDelete = async () => {
    try {
      const res = await fetch(`/api/admin/assignments?id=${confirm.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      setAssignments(assignments.filter((a) => a.id !== confirm.id));
      showToast("Assignment deleted");
    } catch {
      showErr("Failed to delete");
    } finally {
      setConfirm({ open: false, id: null });
    }
  };

  const formatDeadline = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const columns = [
    { key: "title", label: "Title" },
    {
      key: "deadline",
      label: "Deadline",
      render: (val) => formatDeadline(val),
    },
    {
      key: "submissions",
      label: "Submissions",
      render: (val, row) => `${val}/${row.totalStudents || "—"}`,
    },
    {
      key: "status",
      label: "Status",
      render: (val) => (
        <StatusBadge status={val.charAt(0).toUpperCase() + val.slice(1)} />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors">
            Edit
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="px-3 py-1.5 text-sm font-medium text-accent hover:bg-red-50 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
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

  return (
    <div className="max-w-7xl mx-auto">
      <ErrorPopover message={errPop.message} visible={errPop.visible} onClose={hideErr} />
      <Toast message={toast.message} visible={toast.visible} onClose={hideToast} />
      <ConfirmDialog
        open={confirm.open}
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setConfirm({ open: false, id: null })}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Assignments Management</h1>
          <p className="text-sm text-text-secondary mt-1">Create and manage assignments</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Close" : "New Assignment"}
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-text-primary mb-4">New Assignment</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Midterm Lab Assessment"
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Detailed instructions for students..."
                    className="w-full resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Max File Size (MB)</label>
                  <input
                    type="number"
                    value={form.maxFileSize}
                    onChange={(e) => setForm({ ...form, maxFileSize: Number(e.target.value) })}
                    className="w-full"
                    min={1}
                    max={100}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-1">Requirements PDF</label>
                <FileUploadZone
                  accept=".pdf"
                  maxSize={25}
                  onFileChange={(f) => setForm({ ...form, requirements: f })}
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {saving ? "Publishing..." : "Publish"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card rounded-xl shadow-sm border border-border p-5">
        {assignments.length === 0 ? (
          <p className="text-text-secondary text-sm py-8 text-center">No assignments yet. Create one to get started.</p>
        ) : (
          <DataTable
            columns={columns}
            data={assignments}
            pageSize={10}
            searchPlaceholder="Search assignments..."
          />
        )}
      </div>
    </div>
  );
}
