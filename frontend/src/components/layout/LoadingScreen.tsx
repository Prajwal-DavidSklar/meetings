"use client";

import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 60%, var(--secondary) 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      {/* Animated rings */}
      <div style={{ position: "relative", width: "80px", height: "80px", marginBottom: "32px" }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeOut",
            }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.5)",
            }}
          />
        ))}
        {/* Center icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            inset: "12px",
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "white",
            borderRightColor: "rgba(255,255,255,0.4)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "20px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="8" width="24" height="18" rx="3" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M4 12h24" stroke="white" strokeWidth="2"/>
            <circle cx="10" cy="18" r="2" fill="white"/>
            <circle cx="16" cy="18" r="2" fill="white"/>
            <circle cx="22" cy="18" r="2" fill="white"/>
          </svg>
        </div>
      </div>

      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          color: "rgba(255,255,255,0.8)",
          fontSize: "15px",
          fontWeight: 500,
          letterSpacing: "0.5px",
        }}
      >
        Loading your portal…
      </motion.p>
    </motion.div>
  );
}
