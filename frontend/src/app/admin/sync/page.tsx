"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { triggerSync, getSyncLogs } from "@/lib/api";
import type { SyncLog } from "@/lib/types";

export default function SyncPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    const data = await getSyncLogs(0, 50);
    setLogs(data);
  }, []);

  useEffect(() => {
    fetchLogs().finally(() => setLoading(false));
  }, [fetchLogs]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      await triggerSync();
      // Poll for 30s until the running log becomes success/failed
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const updated = await getSyncLogs(0, 50);
        setLogs(updated);
        const latest = updated[0];
        if (!latest || latest.status !== "running" || attempts > 30) {
          clearInterval(poll);
          setSyncing(false);
        }
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text">HubSpot Sync</h1>
        <p className="text-sm text-text-muted mt-1">
          Sync meeting links and owners from HubSpot
        </p>
      </div>

      {/* Trigger card */}
      <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-text mb-1">Sync with HubSpot</p>
          <p className="text-sm text-text-muted">
            Pulls all meeting links and owners. Admin overrides are preserved.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all shrink-0"
        >
          <RefreshCw
            className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Syncing…" : "Start Sync"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-error-bg px-4 py-3 text-sm text-error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Logs table */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-3">Sync History</h2>
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-2xl border border-border bg-surface animate-pulse"
              />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-text-muted py-8 text-center">
            No sync history yet.
          </p>
        ) : (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Started</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Duration</th>
                  <th className="px-4 py-3 hidden md:table-cell">Added</th>
                  <th className="px-4 py-3 hidden md:table-cell">Updated</th>
                  <th className="px-4 py-3 hidden md:table-cell">Removed</th>
                  <th className="px-4 py-3">Error</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {logs.map((log, i) => {
                    const duration =
                      log.completed_at
                        ? `${((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000).toFixed(1)}s`
                        : "—";

                    return (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <StatusBadge status={log.status} />
                        </td>
                        <td className="px-4 py-3 text-text-muted">
                          {new Date(log.started_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-text-muted hidden sm:table-cell">
                          {duration}
                        </td>
                        <td className="px-4 py-3 text-success hidden md:table-cell">
                          +{log.links_added}
                        </td>
                        <td className="px-4 py-3 text-text hidden md:table-cell">
                          {log.links_updated}
                        </td>
                        <td className="px-4 py-3 text-warning hidden md:table-cell">
                          {log.links_deactivated}
                        </td>
                        <td className="px-4 py-3 text-error text-xs max-w-[180px] truncate">
                          {log.error_message ?? "—"}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SyncLog["status"] }) {
  const config = {
    success: {
      icon: CheckCircle2,
      label: "Success",
      cls: "bg-success-bg text-success",
    },
    failed: {
      icon: XCircle,
      label: "Failed",
      cls: "bg-error-bg text-error",
    },
    running: {
      icon: Clock,
      label: "Running",
      cls: "bg-warning-bg text-warning",
    },
  };
  const { icon: Icon, label, cls } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
