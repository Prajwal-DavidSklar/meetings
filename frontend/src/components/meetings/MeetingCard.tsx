"use client";

import { motion } from "framer-motion";
import { Calendar, User, ExternalLink } from "lucide-react";
import type { MeetingLink } from "@/lib/types";
import { UPLOADS_BASE } from "@/lib/api";

interface Props {
  meeting: MeetingLink;
  onBook: (meeting: MeetingLink) => void;
  index?: number;
}

export default function MeetingCard({ meeting, onBook, index = 0 }: Props) {
  const displayName = meeting.display_name ?? meeting.name;
  const hostName = meeting.host?.display_name ?? meeting.host?.name;
  const categoryName = meeting.category?.name;
  const categoryColor = meeting.category?.color;
  const imageUrl = meeting.image_path ? `${UPLOADS_BASE}${meeting.image_path}` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: "var(--shadow-lg)" }}
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s",
        cursor: "pointer",
      }}
      onClick={() => onBook(meeting)}
    >
      {/* Image / gradient header */}
      <div
        style={{
          height: "140px",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayName}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: categoryColor
                ? `linear-gradient(135deg, ${categoryColor}cc, ${categoryColor}66)`
                : "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Calendar size={40} color="rgba(255,255,255,0.7)" />
          </div>
        )}

        {/* Category badge */}
        {categoryName && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              padding: "4px 10px",
              borderRadius: "var(--radius-pill)",
              background: categoryColor ?? "var(--primary)",
              color: "white",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.3px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {categoryName}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <h3
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: "1.3",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {displayName}
        </h3>

        {hostName && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--text-secondary)",
              fontSize: "13px",
            }}
          >
            <User size={13} style={{ flexShrink: 0 }} />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {hostName}
            </span>
          </div>
        )}
      </div>

      {/* Book button */}
      <div style={{ padding: "0 16px 16px" }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            onBook(meeting);
          }}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(135deg, var(--primary), var(--secondary))",
            color: "white",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <ExternalLink size={14} />
          Book Now
        </motion.button>
      </div>
    </motion.div>
  );
}
