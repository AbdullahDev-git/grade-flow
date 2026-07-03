"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Copy, Check, Loader2, AlertCircle, Download, Eye, EyeOff, Trash2 } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import Toast from "@/components/admin/Toast";
import ErrorPopover from "@/components/admin/ErrorPopover";

const COURSES = [
  { value: "fullstack", label: "Full Stack Development" },
  { value: "wordpress", label: "WordPress Development" },
  { value: "uiux", label: "UI/UX Design" },
  { value: "ai-chatbot", label: "AI Chatbot Development" },
];

const COURSE_LABELS = Object.fromEntries(COURSES.map(c => [c.value, c.label]));

function getAuthHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

const CREDS_KEY = "gradeflow_saved_credentials";

function loadSavedCredentials() {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(CREDS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export default function InvitePage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [inviteCourse, setInviteCourse] = useState("fullstack");
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [errPop, setErrPop] = useState({ visible: false, message: "" });
  const [sending, setSending] = useState(false);
  const [credentials, setCredentials] = useState(loadSavedCredentials);
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    fetchInvites();
  }, []);

  useEffect(() => {
    localStorage.setItem(CREDS_KEY, JSON.stringify(credentials));
  }, [credentials]);

  async function fetchInvites() {
    try {
      const res = await fetch("/api/admin/invite", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to load invites");
      const json = await res.json();
      setInvites(json.results || []);

      if (json.results) {
        setCredentials((prev) =>
          prev.map((c) => {
            const match = json.results.find((r) => r.email === c.email);
            return match ? { ...c, passwordChanged: match.passwordChanged } : c;
          })
        );
      }
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

  const parseInput = () => {
    return input
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const commaIdx = line.lastIndexOf(",");
        if (commaIdx === -1) return { name: "", email: line, course: inviteCourse };
        const name = line.slice(0, commaIdx).trim();
        const email = line.slice(commaIdx + 1).trim();
        return { name, email, course: inviteCourse };
      });
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddStudents = async () => {
    const parsed = parseInput();

    if (parsed.length === 0) {
      showErr("Enter at least one student (Name, email@example.com)");
      return;
    }

    const invalid = parsed.filter((s) => !validateEmail(s.email));
    if (invalid.length > 0) {
      showErr(`Invalid email(s): ${invalid.map((s) => s.email).join(", ")}`);
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ students: parsed }),
      });

      if (!res.ok) {
        const data = await res.json();
        showErr(data.error || "Failed to add students");
        return;
      }

      const json = await res.json();
      const newCreds = json.results.filter((r) => r.password);
      if (newCreds.length > 0) {
        setCredentials((prev) => [...newCreds, ...prev]);
      }
      setInvites((prev) => [...json.results, ...prev]);
      setInput("");
      showToast(`${newCreds.length} student(s) added successfully!`);
    } catch {
      showErr("Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const copyAll = () => {
    const text = credentials.map((c) => `Name: ${c.name}\nEmail: ${c.email}\nPassword: ${c.password}`).join("\n\n");
    navigator.clipboard.writeText(text);
    showToast("All credentials copied!");
  };

  const exportCSV = () => {
    const header = "Name,Email,Password,Course\n";
    const rows = credentials.map((c) => `"${c.name}",${c.email},${c.password},${COURSE_LABELS[c.course] || c.course || "fullstack"}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student-credentials.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearCredentials = () => {
    setCredentials([]);
    localStorage.removeItem(CREDS_KEY);
    showToast("Credentials cleared");
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "course",
      label: "Course",
      render: (val) => (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {COURSE_LABELS[val] || val || "Full Stack"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (val) => {
        const map = { invited: "Invited", joined: "Joined" };
        return <StatusBadge status={map[val] || val} />;
      },
    },
    {
      key: "passwordChanged",
      label: "Password",
      render: (val) => (
        <span className={`text-xs font-medium ${val ? "text-success" : "text-warning"}`}>
          {val ? "Changed" : "Default"}
        </span>
      ),
    },
    {
      key: "invitedAt",
      label: "Date Added",
      render: (val) => formatDate(val),
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
    <div className="max-w-5xl mx-auto">
      <ErrorPopover message={errPop.message} visible={errPop.visible} onClose={hideErr} />
      <Toast message={toast.message} visible={toast.visible} onClose={hideToast} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Add Students</h1>
        <p className="text-sm text-text-secondary mt-1">
          Add students manually. Each gets an auto-generated password — share their credentials.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6"
      >
        <h2 className="text-lg font-semibold text-text-primary mb-1">Add Students</h2>
        <p className="text-sm text-text-secondary mb-4">
          One per line: <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">Name, email@example.com</code>
        </p>

        <div className="mb-3">
          <label className="block text-sm font-medium text-text-primary mb-1.5">Course</label>
          <select
            value={inviteCourse}
            onChange={(e) => setInviteCourse(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white mb-3"
          >
            {COURSES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <textarea
            rows={5}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ali Khan, ali@university.edu\nSara Ahmed, sara@university.edu\nZain Malik, zain@university.edu`}
            className="w-full resize-none font-mono text-sm"
          />
          <p className="text-xs text-text-secondary mt-1">
            Enter <strong>Name, email</strong> per line. Passwords are auto-generated. All students will be added to <strong>{COURSE_LABELS[inviteCourse]}</strong>.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddStudents}
          disabled={sending}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {sending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Adding...
            </span>
          ) : (
            <>
              <UserPlus size={16} />
              Add Students
            </>
          )}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {credentials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Generated Credentials</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Saved locally — visible even after students join
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="flex items-center gap-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-text-primary px-3 py-2 rounded-lg transition-colors"
                >
                  {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showPasswords ? "Hide" : "Show"}
                </button>
                <button
                  onClick={copyAll}
                  className="flex items-center gap-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-text-primary px-3 py-2 rounded-lg transition-colors"
                >
                  <Copy size={14} />
                  Copy All
                </button>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-1.5 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-2 rounded-lg transition-colors"
                >
                  <Download size={14} />
                  CSV
                </button>
                <button
                  onClick={clearCredentials}
                  className="flex items-center gap-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                  Clear
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-border">
                    <th className="text-left px-4 py-2.5 font-medium text-text-secondary">#</th>
                    <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Name</th>
                    <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Email</th>
                    <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Password</th>
                    <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Password Status</th>
                    <th className="text-right px-4 py-2.5 font-medium text-text-secondary">Copy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {credentials.map((c, i) => (
                    <tr key={`${c.email}-${i}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-text-secondary text-xs">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-text-primary">{c.name}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{c.email}</td>
                      <td className="px-4 py-2.5">
                        <code className={`font-mono text-sm px-2 py-0.5 rounded ${showPasswords ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400"}`}>
                          {showPasswords ? c.password : "••••••••"}
                        </code>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-medium ${c.passwordChanged ? "text-success" : "text-warning"}`}>
                          {c.passwordChanged ? "Changed" : "Default"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`Name: ${c.name}\nEmail: ${c.email}\nPassword: ${c.password}`);
                            showToast(`Copied ${c.email}`);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white transition-colors text-text-secondary hover:text-primary"
                        >
                          <Copy size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card rounded-xl shadow-sm border border-border p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-4">All Students</h2>
        {invites.length === 0 ? (
          <p className="text-text-secondary text-sm py-8 text-center">No students added yet.</p>
        ) : (
          <DataTable columns={columns} data={invites} pageSize={10} searchPlaceholder="Search by name or email..." />
        )}
      </div>


    </div>
  );
}
