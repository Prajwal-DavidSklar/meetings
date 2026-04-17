"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Users,
  ShieldCheck,
  User,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { User as UserType, UserCreate, UserRole } from "@/lib/types";

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = () =>
    getUsers().then((data) => {
      setUsers(data);
      setLoading(false);
    });

  useEffect(() => {
    reload();
  }, []);

  const handleSave = async (data: UserCreate & { password?: string }) => {
    try {
      if (editing) {
        await updateUser(editing.id, data);
      } else {
        await createUser(data);
      }
      setModalOpen(false);
      setError(null);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleToggle = async (u: UserType) => {
    if (u.id === me?.id) return;
    await updateUser(u.id, { is_active: !u.is_active });
    reload();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Users</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage portal access
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setError(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-2xl border border-border bg-surface animate-pulse"
            />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Users className="h-12 w-12 text-text-muted/30 mb-3" />
          <p className="font-semibold text-text">No users yet</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3 hidden sm:table-cell">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary shrink-0">
                        {u.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-text">{u.name}</p>
                        <p className="text-xs text-text-muted sm:hidden">
                          {u.email}
                        </p>
                        {u.id === me?.id && (
                          <span className="text-xs text-primary">(you)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-muted hidden sm:table-cell">
                    {u.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        u.role === "admin"
                          ? "bg-secondary-light text-secondary"
                          : "bg-primary-light text-primary"
                      }`}
                    >
                      {u.role === "admin" ? (
                        <ShieldCheck className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        u.is_active
                          ? "bg-success-bg text-success"
                          : "bg-error-bg text-error"
                      }`}
                    >
                      {u.is_active ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditing(u);
                          setError(null);
                          setModalOpen(true);
                        }}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-text-muted hover:bg-surface hover:text-text transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      {u.id !== me?.id && (
                        <button
                          onClick={() => handleToggle(u)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-text-muted hover:bg-surface hover:text-text transition-colors"
                        >
                          {u.is_active ? (
                            <X className="h-3 w-3" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          {u.is_active ? "Disable" : "Enable"}
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editing={editing}
        error={error}
        isSelf={editing?.id === me?.id}
      />
    </div>
  );
}

function UserModal({
  open,
  onClose,
  onSave,
  editing,
  error,
  isSelf,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: UserCreate & { password?: string }) => Promise<void>;
  editing: UserType | null;
  error: string | null;
  isSelf: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setEmail(editing?.email ?? "");
      setRole(editing?.role ?? "user");
      setPassword("");
    }
  }, [open, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      name,
      email,
      role,
      password: password || undefined,
    });
    setSaving(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit User" : "New User"}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-error-bg px-3 py-2 text-sm text-error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Field label="Full Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputCls}
            placeholder="Jane Doe"
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={!!editing}
            className={`${inputCls} ${editing ? "opacity-60 cursor-not-allowed" : ""}`}
            placeholder="jane@company.com"
          />
        </Field>

        <Field label="Role">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={isSelf}
            className={`${inputCls} ${isSelf ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </Field>

        <Field label={editing ? "New Password (leave blank to keep)" : "Password (optional)"}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </Field>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-surface-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors";
