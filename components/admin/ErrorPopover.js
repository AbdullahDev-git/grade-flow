"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function ErrorPopover({ message, visible, onClose }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="fixed top-6 right-6 z-50 max-w-sm"
        >
          <div className="bg-[#FF6B6B] text-white rounded-lg shadow-lg p-4 flex items-start gap-3">
            <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Error</p>
              <p className="text-sm opacity-90 mt-0.5">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
