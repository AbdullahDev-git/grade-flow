"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, CheckCircle, User } from "lucide-react";
import ErrorPopover from "@/components/admin/ErrorPopover";

const COURSES = [
  { value: "fullstack", label: "Full Stack Development" },
  { value: "wordpress", label: "WordPress Development" },
  { value: "uiux", label: "UI/UX Design" },
  { value: "ai-chatbot", label: "AI Chatbot Development" },
];

function SetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [name, setName] = useState(email.split("@")[0]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [course, setCourse] = useState("fullstack");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState({ visible: false, message: "" });

  const showError = (msg) => setError({ visible: true, message: msg });
  const hideError = () => setError({ visible: false, message: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    hideError();

    if (password !== confirm) {
      showError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "student", course }),
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setDone(true);
      setTimeout(() => router.push("/student"), 1500);
    } catch {
      showError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-card rounded-2xl shadow-lg p-8 max-w-md w-full border border-border text-center"
        >
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-success" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Password Set Successfully!</h2>
          <p className="text-text-secondary text-sm">Redirecting to your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main px-4">
      <ErrorPopover message={error.message} visible={error.visible} onClose={hideError} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card rounded-2xl shadow-lg p-8 max-w-md w-full border border-border"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">G</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Set Up Your Account</h1>
          <p className="text-sm text-text-secondary mt-1">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Name</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Select Your Course</label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              required
            >
              {COURSES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Setting up..." : "Set Password & Login"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-bg-main">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    }>
      <SetupForm />
    </Suspense>
  );
}
