"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Loader2 } from "lucide-react";
import type { MeetingLink } from "@/lib/types";

interface BookingModalProps {
  meeting: MeetingLink | null;
  onClose: () => void;
}

export default function BookingModal({ meeting, onClose }: BookingModalProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const title = meeting ? (meeting.display_name ?? meeting.name) : "";

  return (
    <AnimatePresence onExitComplete={() => setIframeLoaded(false)}>
      {meeting && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="relative z-10 w-full sm:max-w-5xl h-[95dvh] sm:h-[88vh] rounded-t-3xl sm:rounded-3xl bg-background border border-border shadow-2xl flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5 shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-text line-clamp-1">{title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={meeting.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-2 hover:text-text transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-2 hover:text-text transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* iFrame */}
            <div className="relative flex-1 overflow-hidden">
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              )}
              <iframe
                src={meeting.url}
                title={title}
                className="h-full w-full border-0"
                onLoad={() => setIframeLoaded(true)}
                allow="camera; microphone; geolocation"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
