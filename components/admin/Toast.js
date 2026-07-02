"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X } from "lucide-react";

export default function Toast({ message, visible, onClose }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div className="bg-[#10B981] text-white rounded-lg shadow-lg p-4 flex items-center gap-3">
            <CheckCircle size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium flex-1">{message}</span>
            <button onClick={onClose} className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
