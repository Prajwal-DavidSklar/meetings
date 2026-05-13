"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import type { MeetingLink } from "@/lib/types";

interface BookingModalProps {
  meeting: MeetingLink | null;
  onClose: () => void;
}

const LOAD_TIMEOUT_MS = 20_000;

function buildEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    // HubSpot renders more reliably in iframes with embed=true
    if (u.hostname.includes("hubspot.com") || u.hostname.includes("meetings.")) {
      u.searchParams.set("embed", "true");
    }
    return u.toString();
  } catch {
    return url;
  }
}

export default function BookingModal({ meeting, onClose }: BookingModalProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timeoutRef.current = setTimeout(() => setLoadError(true), LOAD_TIMEOUT_MS);
  }, [clearTimer]);

  // Reset every time the meeting changes (handles rapid open/close/reopen).
  // This fires before AnimatePresence onExitComplete so we're always clean.
  useEffect(() => {
    setIframeLoaded(false);
    setLoadError(false);
    if (meeting) {
      startTimer();
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [meeting, retryKey, startTimer, clearTimer]);

  const handleLoad = useCallback(() => {
    clearTimer();
    setIframeLoaded(true);
  }, [clearTimer]);

  const handleRetry = useCallback(() => {
    setIframeLoaded(false);
    setLoadError(false);
    setRetryKey((k) => k + 1);
  }, []);

  const title = meeting ? (meeting.display_name ?? meeting.name) : "";
  const embedUrl = meeting ? buildEmbedUrl(meeting.url) : "";

  return (
    <AnimatePresence>
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
              <h2 className="font-semibold text-text line-clamp-1">{title}</h2>
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

            {/* iFrame area */}
            <div className="relative flex-1 overflow-hidden">
              {/* Loading spinner */}
              {!iframeLoaded && !loadError && (
                <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              )}

              {/* Error / timeout state */}
              {loadError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10 gap-4 px-6 text-center">
                  <AlertCircle className="h-10 w-10 text-text-muted/40" />
                  <p className="text-sm text-text-muted">
                    The meeting page couldn&apos;t be loaded in this window.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2 text-sm font-medium text-text hover:bg-surface-2/80 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry
                    </button>
                    <a
                      href={meeting.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in new tab
                    </a>
                  </div>
                </div>
              )}

              {/*
                key={meeting.id + retryKey} forces a full DOM remount whenever the
                selected meeting changes or the user retries, preventing stale onLoad
                events and src-swap rendering glitches.
              */}
              <iframe
                key={`${meeting.id}-${retryKey}`}
                src={embedUrl}
                title={title}
                className="h-full w-full border-0"
                onLoad={handleLoad}
                allow="camera; microphone; geolocation"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
