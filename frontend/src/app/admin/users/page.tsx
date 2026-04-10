"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Pencil, Trash2, Shield, User } from "lucide-react";
import { usersApi } from "@/lib/api";
import type { User as UserType } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import AdminCard, {
  AdminPageHeader,
  FormField,
  FormModal,
  PrimaryButton,
  StatusBadge,
  inputStyle,
} from "@/components/admin/AdminCard";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserType | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    email: "",
    name: "",
    role: "user" as "admin" | "user",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      setUsers(await usersApi.list());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ email: "", name: "", role: "user", password: "" });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (u: UserType) => {
    setEditing(u);
    setForm({ email: u.email, name: u.name ?? "", role: u.role, password: "" });
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await usersApi.update(editing.id, {
          name: form.name || null,
          role: form.role,
          password: form.password || null,
        });
      } else {
        await usersApi.create({
          email: form.email,
          name: form.name || null,
          role: form.role,
          password: form.password || null,
        });
      }
      setModalOpen(false);
      fetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (u: UserType) => {
    if (u.id === currentUser?.id) return;
    try {
      await usersApi.update(u.id, { is_active: !u.is_active });
      fetch();
    } catch { /* ignore */ }
  };

  return (
    <>
      <AdminPageHeader
        title="Users"
        description="Manage who has access to the portal."
        action={
          <PrimaryButton onClick={openCreate}>
            <Plus size={14} /> Add User
          </PrimaryButton>
        }
      />

      <AdminCard title={`Portal Users (${users.length})`}>
        {loading ? (
          <LoadingRows />
        ) : users.length === 0 ? (
          <EmptyRow />
        ) : (
          <div>
            {users.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "14px 24px",
                  borderBottom: i < users.length - 1 ? "1px solid var(--border)" : "none",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background:
                      u.role === "admin"
                        ? "linear-gradient(135deg, var(--primary), var(--secondary))"
                        : "linear-gradient(135deg, var(--primary-light), var(--primary))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {u.role === "admin" ? (
                    <Shield size={16} color="white" />
                  ) : (
                    <User size={16} color="white" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>
                      {u.name ?? u.email}
                    </p>
                    {u.id === currentUser?.id && (
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>(you)</span>
                    )}
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {u.email}
                  </p>
                </div>

                <RoleBadge role={u.role} />
                <StatusBadge active={u.is_active} />

                <div style={{ display: "flex", gap: "6px", marginLeft: "8px" }}>
                  <IconButton onClick={() => openEdit(u)} title="Edit">
                    <Pencil size={14} />
                  </IconButton>
                  {u.id !== currentUser?.id && (
                    <IconButton
                      onClick={() => handleDeactivate(u)}
                      title={u.is_active ? "Deactivate" : "Reactivate"}
                      danger={u.is_active}
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AdminCard>

      <AnimatePresence>
        {modalOpen && (
          <FormModal
            title={editing ? "Edit User" : "Add User"}
            onClose={() => setModalOpen(false)}
            onSubmit={handleSubmit}
            loading={saving}
          >
            <FormField label="Email" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required={!editing}
                disabled={!!editing}
                style={{ ...inputStyle, opacity: editing ? 0.6 : 1 }}
                placeholder="user@company.com"
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </FormField>

            <FormField label="Name">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                style={inputStyle}
                placeholder="Display name"
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </FormField>

            <FormField label="Role" required>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "admin" | "user" }))}
                style={{ ...inputStyle }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </FormField>

            <FormField label={editing ? "New Password (leave blank to keep)" : "Password"}>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required={!editing}
                style={inputStyle}
                placeholder={editing ? "Leave blank to keep current" : "Set a password"}
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

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      style={{
        padding: "3px 9px",
        borderRadius: "var(--radius-pill)",
        fontSize: "12px",
        fontWeight: 700,
        background:
          role === "admin"
            ? "color-mix(in srgb, var(--primary) 12%, transparent)"
            : "color-mix(in srgb, var(--text-muted) 15%, transparent)",
        color: role === "admin" ? "var(--primary)" : "var(--text-secondary)",
      }}
    >
      {role === "admin" ? "Admin" : "User"}
    </span>
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

function EmptyRow() {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
      No users yet.
    </div>
  );
}
