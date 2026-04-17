"use client";

import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        background:
          "linear-gradient(135deg, var(--color-primary) 0%, #012a4a 60%, var(--color-secondary) 100%)",
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } }}
    >
      {/* Logo mark */}
      <motion.div
        className="relative flex items-center justify-center"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
          <svg
            viewBox="0 0 40 40"
            fill="none"
            className="h-10 w-10"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="4" y="8" width="32" height="28" rx="4" fill="white" fillOpacity="0.15" />
            <rect x="4" y="8" width="32" height="8" rx="4" fill="white" fillOpacity="0.3" />
            <circle cx="13" cy="22" r="2" fill="white" />
            <circle cx="20" cy="22" r="2" fill="white" />
            <circle cx="27" cy="22" r="2" fill="white" />
            <circle cx="13" cy="30" r="2" fill="white" fillOpacity="0.6" />
            <circle cx="20" cy="30" r="2" fill="white" fillOpacity="0.6" />
          </svg>
        </div>
      </motion.div>

      {/* App name */}
      <motion.p
        className="mt-6 text-2xl font-bold tracking-wide text-white"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        Meetings Portal
      </motion.p>
      <motion.p
        className="mt-1 text-sm text-white/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        Getting things ready…
      </motion.p>

      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-white/30"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 1.1, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
