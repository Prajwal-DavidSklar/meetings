"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Pencil, Trash2, UserCog } from "lucide-react";
import { hostsApi } from "@/lib/api";
import type { MeetingHost } from "@/lib/types";
import AdminCard, {
  AdminPageHeader,
  FormField,
  FormModal,
  PrimaryButton,
  StatusBadge,
  inputStyle,
} from "@/components/admin/AdminCard";

export default function HostsPage() {
  const [hosts, setHosts] = useState<MeetingHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MeetingHost | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", display_name: "", email: "" });
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      setHosts(await hostsApi.list(true));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", display_name: "", email: "" });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (host: MeetingHost) => {
    setEditing(host);
    setForm({
      name: host.name,
      display_name: host.display_name ?? "",
      email: host.email ?? "",
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await hostsApi.update(editing.id, {
          name: form.name,
          display_name: form.display_name || null,
          email: form.email || null,
        });
      } else {
        await hostsApi.create({
          name: form.name,
          display_name: form.display_name || null,
          email: form.email || null,
        });
      }
      setModalOpen(false);
      fetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save host.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (host: MeetingHost) => {
    try {
      await hostsApi.update(host.id, { is_active: !host.is_active });
      fetch();
    } catch { /* ignore */ }
  };

  return (
    <>
      <AdminPageHeader
        title="Meeting Hosts"
        description="Hosts are auto-synced from HubSpot owners. You can also create custom hosts."
        action={
          <PrimaryButton onClick={openCreate}>
            <Plus size={14} /> New Custom Host
          </PrimaryButton>
        }
      />

      <AdminCard title="All Hosts">
        {loading ? (
          <LoadingRows />
        ) : hosts.length === 0 ? (
          <EmptyRow message="No hosts found. Sync from HubSpot or create a custom host." />
        ) : (
          <div>
            {hosts.map((host, i) => (
              <motion.div
                key={host.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "14px 24px",
                  borderBottom: i < hosts.length - 1 ? "1px solid var(--border)" : "none",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: host.is_custom
                      ? "linear-gradient(135deg, var(--secondary), var(--primary))"
                      : "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <UserCog size={16} color="white" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>
                      {host.display_name ?? host.name}
                    </p>
                    {host.display_name && (
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        ({host.name})
                      </span>
                    )}
                    {host.is_custom && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "var(--radius-pill)",
                          background: "color-mix(in srgb, var(--secondary) 12%, transparent)",
                          color: "var(--secondary)",
                        }}
                      >
                        Custom
                      </span>
                    )}
                  </div>
                  {host.email && (
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {host.email}
                    </p>
                  )}
                </div>
                <StatusBadge active={host.is_active} />
                <div style={{ display: "flex", gap: "6px", marginLeft: "8px" }}>
                  <IconButton onClick={() => openEdit(host)} title="Edit">
                    <Pencil size={14} />
                  </IconButton>
                  <IconButton
                    onClick={() => handleToggle(host)}
                    title={host.is_active ? "Deactivate" : "Activate"}
                    danger={host.is_active}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AdminCard>

      <AnimatePresence>
        {modalOpen && (
          <FormModal
            title={editing ? "Edit Host" : "New Custom Host"}
            onClose={() => setModalOpen(false)}
            onSubmit={handleSubmit}
            loading={saving}
          >
            <FormField label="Name" required>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                style={inputStyle}
                placeholder="e.g. John Smith"
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </FormField>
            <FormField label="Display Name">
              <input
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                style={inputStyle}
                placeholder="Override display name"
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </FormField>
            <FormField label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                style={inputStyle}
                placeholder="host@company.com"
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </FormField>
            {error && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#ef4444",
                  fontSize: "13px",
                }}
              >
                {error}
              </div>
            )}
          </FormModal>
        )}
      </AnimatePresence>
    </>
  );
}

function IconButton({ onClick, title, danger, children }: { onClick: () => void; title: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={title}
      style={{
        width: "30px",
        height: "30px",
        borderRadius: "8px",
        border: "1px solid var(--border)",
        background: "var(--bg-hover)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: danger ? "#ef4444" : "var(--text-secondary)",
      }}
    >
      {children}
    </motion.button>
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
          style={{ height: "60px", margin: "8px 24px", borderRadius: "8px", background: "var(--bg-hover)" }}
        />
      ))}
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
      {message}
    </div>
  );
}
