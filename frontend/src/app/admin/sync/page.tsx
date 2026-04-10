"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { meetingsApi } from "@/lib/api";
import type { SyncLog } from "@/lib/types";
import AdminCard, { AdminPageHeader, PrimaryButton } from "@/components/admin/AdminCard";

export default function SyncPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncLog | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      setLogs(await meetingsApi.syncLogs());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const result = await meetingsApi.sync();
      setSyncResult(result);
      fetchLogs();
    } catch (err: unknown) {
      setSyncError(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const fmtDate = (d: string | null) => {
    if (!d) return "–";
    return new Date(d).toLocaleString();
  };

  const fmtDuration = (start: string, end: string | null) => {
    if (!end) return "–";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <>
      <AdminPageHeader
        title="HubSpot Sync"
        description="Sync meeting links from HubSpot. Existing customisations are preserved."
      />

      {/* Trigger card */}
      <AdminCard
        title="Manual Sync"
        description="Pull the latest meeting links from HubSpot."
        action={
          <PrimaryButton onClick={handleSync} loading={syncing} disabled={syncing}>
            <RefreshCw size={14} />
            {syncing ? "Syncing…" : "Sync Now"}
          </PrimaryButton>
        }
      >
        <div style={{ padding: "20px 24px" }}>
          {syncing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "16px 20px",
                borderRadius: "12px",
                background: "color-mix(in srgb, var(--primary) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw size={18} color="var(--primary)" />
              </motion.div>
              <div>
                <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--primary)" }}>
                  Syncing from HubSpot…
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  This may take a few seconds.
                </p>
              </div>
            </motion.div>
          )}

          {syncResult && !syncing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: "16px 20px",
                borderRadius: "12px",
                background: syncResult.status === "success"
                  ? "rgba(34,197,94,0.08)"
                  : "rgba(239,68,68,0.08)",
                border: `1px solid ${syncResult.status === "success" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                {syncResult.status === "success" ? (
                  <CheckCircle size={20} color="#16a34a" />
                ) : (
                  <XCircle size={20} color="#ef4444" />
                )}
                <p style={{ fontWeight: 700, fontSize: "15px", color: syncResult.status === "success" ? "#16a34a" : "#ef4444" }}>
                  Sync {syncResult.status === "success" ? "Completed" : "Failed"}
                </p>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                }}
              >
                <StatTile label="Added" value={syncResult.links_added} color="#16a34a" />
                <StatTile label="Updated" value={syncResult.links_updated} color="var(--primary)" />
                <StatTile label="Deactivated" value={syncResult.links_deactivated} color="#f59e0b" />
              </div>
              {syncResult.error_message && (
                <p style={{ marginTop: "12px", fontSize: "13px", color: "#ef4444" }}>
                  {syncResult.error_message}
                </p>
              )}
            </motion.div>
          )}

          {syncError && !syncing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "14px 18px",
                borderRadius: "10px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#ef4444",
                fontSize: "14px",
              }}
            >
              <AlertTriangle size={18} />
              {syncError}
            </motion.div>
          )}

          {!syncing && !syncResult && !syncError && (
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              Click &ldquo;Sync Now&rdquo; to fetch the latest meeting links from HubSpot.
            </p>
          )}
        </div>
      </AdminCard>

      {/* Logs */}
      <AdminCard title="Sync History" description="Recent sync operations">
        {loading ? (
          <LoadingRows />
        ) : logs.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
            No sync history yet.
          </div>
        ) : (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                padding: "10px 24px",
                borderBottom: "1px solid var(--border)",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <span>Time</span>
              <span>Status</span>
              <span>Added</span>
              <span>Updated</span>
              <span>Duration</span>
            </div>
            {logs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                  padding: "13px 24px",
                  borderBottom: i < logs.length - 1 ? "1px solid var(--border)" : "none",
                  alignItems: "center",
                  fontSize: "13px",
                }}
              >
                <div>
                  <p style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                    {fmtDate(log.started_at)}
                  </p>
                  {log.error_message && (
                    <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "2px" }}>
                      {log.error_message}
                    </p>
                  )}
                </div>
                <SyncStatusBadge status={log.status} />
                <span style={{ color: "#16a34a", fontWeight: 600 }}>+{log.links_added}</span>
                <span style={{ color: "var(--primary)", fontWeight: 600 }}>~{log.links_updated}</span>
                <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={12} />
                  {fmtDuration(log.started_at, log.completed_at)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </AdminCard>
    </>
  );
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "12px",
        borderRadius: "10px",
        background: "var(--bg-hover)",
      }}
    >
      <p style={{ fontSize: "22px", fontWeight: 800, color }}>{value}</p>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{label}</p>
    </div>
  );
}

function SyncStatusBadge({ status }: { status: string }) {
  const isSuccess = status === "success";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 8px",
        borderRadius: "var(--radius-pill)",
        fontSize: "12px",
        fontWeight: 600,
        background: isSuccess ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
        color: isSuccess ? "#16a34a" : "#ef4444",
      }}
    >
      {isSuccess ? <CheckCircle size={11} /> : <XCircle size={11} />}
      {status}
    </span>
  );
}

function LoadingRows() {
  return (
    <div>
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ height: "50px", margin: "8px 24px", borderRadius: "8px", background: "var(--bg-hover)" }}
        />
      ))}
    </div>
  );
}
