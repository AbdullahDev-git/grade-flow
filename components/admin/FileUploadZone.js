"use client";
import { useState, useRef } from "react";
import { Upload, File, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function FileUploadZone({ accept = ".pdf", maxSize = 25, onFileChange }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const validate = (f) => {
    const maxBytes = maxSize * 1024 * 1024;
    if (f.size > maxBytes) {
      setError(`File exceeds ${maxSize}MB limit`);
      return false;
    }
    const ext = "." + f.name.split(".").pop().toLowerCase();
    const allowed = accept.split(",").map((a) => a.trim().toLowerCase());
    if (!allowed.includes(ext)) {
      setError(`Only ${accept} files are allowed`);
      return false;
    }
    return true;
  };

  const handleFile = (f) => {
    setError("");
    if (!validate(f)) return;
    setFile(f);
    setProgress(0);
    // Simulate upload progress
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        onFileChange?.(f);
      }
    }, 150);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleChange = (e) => {
    const f = e.target.files[0];
    if (f) handleFile(f);
  };

  const removeFile = () => {
    setFile(null);
    setProgress(0);
    setError("");
    onFileChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-gray-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        <Upload size={36} className="mx-auto text-text-secondary mb-3" />
        <p className="text-sm text-text-primary font-medium">
          {dragOver ? "Drop file here" : "Drag & drop or click to upload"}
        </p>
        <p className="text-xs text-text-secondary mt-1">PDF only, up to {maxSize}MB</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 flex items-center gap-2"
        >
          <span>⚠️ {error}</span>
        </motion.div>
      )}

      {file && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 rounded-lg border border-border bg-white flex items-center gap-3"
        >
          <div className="p-2 rounded-lg bg-primary/10">
            <File size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
            <p className="text-xs text-text-secondary">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); removeFile(); }}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}

      {file && progress < 100 && (
        <div className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-primary rounded-full"
          />
        </div>
      )}
    </div>
  );
}
