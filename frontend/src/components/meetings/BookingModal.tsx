"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Calendar } from "lucide-react";
import type { MeetingLink } from "@/lib/types";
import { UPLOADS_BASE } from "@/lib/api";

interface Props {
  meeting: MeetingLink | null;
  onClose: () => void;
}

export default function BookingModal({ meeting, onClose }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (meeting) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [meeting, onClose]);

  const displayName = meeting?.display_name ?? meeting?.name ?? "";
  const hostName = meeting?.host?.display_name ?? meeting?.host?.name;
  const categoryName = meeting?.category?.name;
  const imageUrl = meeting?.image_path ? `${UPLOADS_BASE}${meeting.image_path}` : null;

  return (
    <AnimatePresence>
      {meeting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              background: "var(--bg-card)",
              borderRadius: "20px",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-xl)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px 20px",
                borderBottom: "1px solid var(--border)",
                background: "var(--bg-card)",
                flexShrink: 0,
              }}
            >
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt=""
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              )}
              {!imageUrl && (
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Calendar size={18} color="white" />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  style={{
                    fontWeight: 700,
                    fontSize: "16px",
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayName}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                  {categoryName && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "var(--radius-pill)",
                        background: "color-mix(in srgb, var(--secondary) 12%, transparent)",
                        color: "var(--secondary)",
                      }}
                    >
                      {categoryName}
                    </span>
                  )}
                  {hostName && (
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {hostName}
                    </span>
                  )}
                </div>
              </div>
              <a
                href={meeting.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                  color: "var(--primary)",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                  flexShrink: 0,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "color-mix(in srgb, var(--primary) 18%, transparent)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    "color-mix(in srgb, var(--primary) 10%, transparent)")
                }
              >
                <ExternalLink size={14} />
                Open
              </a>
              <button
                onClick={onClose}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--bg-hover)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Iframe */}
            <div style={{ flex: 1, overflow: "hidden", minHeight: "500px" }}>
              <iframe
                src={meeting.url}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: "block",
                  minHeight: "500px",
                }}
                title={displayName}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
