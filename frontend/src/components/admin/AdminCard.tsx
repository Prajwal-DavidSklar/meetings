"use client";

import { motion } from "framer-motion";
import React from "react";

interface AdminCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export default function AdminCard({ title, description, children, action }: AdminCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid var(--border)",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>{title}</h2>
          {description && (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div>{children}</div>
    </motion.div>
  );
}

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "24px",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.4px" }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function PrimaryButton({
  onClick,
  disabled,
  loading,
  children,
  variant = "primary",
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(135deg, var(--primary), var(--secondary))",
      color: "white",
      border: "none",
    },
    secondary: {
      background: "var(--bg-hover)",
      color: "var(--text-primary)",
      border: "1px solid var(--border)",
    },
    danger: {
      background: "rgba(239,68,68,0.1)",
      color: "#ef4444",
      border: "1px solid rgba(239,68,68,0.2)",
    },
    ghost: {
      background: "none",
      color: "var(--text-secondary)",
      border: "1px solid var(--border)",
    },
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: "9px 18px",
        borderRadius: "10px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.6 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        transition: "opacity 0.2s",
        ...styles[variant],
      }}
    >
      {loading && (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ display: "inline-flex" }}
        >
          ⟳
        </motion.span>
      )}
      {children}
    </motion.button>
  );
}

export function FormModal({
  title,
  onClose,
  onSubmit,
  loading,
  children,
  submitLabel = "Save",
}: {
  title: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  children: React.ReactNode;
  submitLabel?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "var(--bg-modal)",
          borderRadius: "20px",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-xl)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {children}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              padding: "16px 24px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <PrimaryButton variant="ghost" onClick={onClose}>
              Cancel
            </PrimaryButton>
            <PrimaryButton loading={loading} disabled={loading}>
              {submitLabel}
            </PrimaryButton>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text-secondary)",
          marginBottom: "6px",
        }}
      >
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "10px",
  border: "1px solid var(--border)",
  background: "var(--bg-input)",
  color: "var(--text-primary)",
  fontSize: "14px",
  outline: "none",
};

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 9px",
        borderRadius: "var(--radius-pill)",
        fontSize: "12px",
        fontWeight: 600,
        background: active ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)",
        color: active ? "#16a34a" : "#ef4444",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: active ? "#16a34a" : "#ef4444",
          display: "inline-block",
        }}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}
