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
  KeyRound,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { getUsers, createUser, updateUser, deleteUser, getCategories, updateUserPermissions } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { User as UserType, UserCreate, UserRole, Category } from "@/lib/types";

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permModalUser, setPermModalUser] = useState<UserType | null>(null);

  const reload = () =>
    Promise.all([getUsers(), getCategories(true)]).then(([data, cats]) => {
      setUsers(data);
      setCategories(cats);
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
                      {u.role !== "admin" && (
                        <button
                          onClick={() => setPermModalUser(u)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-text-muted hover:bg-surface hover:text-primary transition-colors"
                          title="Manage access permissions"
                        >
                          <KeyRound className="h-3 w-3" />
                          Permissions
                        </button>
                      )}
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

      {permModalUser && (
        <PermissionsModal
          user={permModalUser}
          categories={categories}
          onClose={() => setPermModalUser(null)}
          onSaved={() => {
            setPermModalUser(null);
            reload();
          }}
        />
      )}
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

// Nav links that can be restricted (portal is always accessible)
const RESTRICTABLE_NAV_LINKS = [
  { key: "live-call", label: "Live Call" },
  { key: "new-contact", label: "New Contact" },
] as const;

function PermissionsModal({
  user,
  categories,
  onClose,
  onSaved,
}: {
  user: UserType;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const existingPerm = user.permission;

  const [restrictNav, setRestrictNav] = useState(
    existingPerm?.allowed_nav_links !== null && existingPerm?.allowed_nav_links !== undefined
  );
  const [allowedNav, setAllowedNav] = useState<string[]>(
    existingPerm?.allowed_nav_links ?? RESTRICTABLE_NAV_LINKS.map((l) => l.key)
  );
  const [restrictCats, setRestrictCats] = useState(
    existingPerm?.allowed_category_ids !== null && existingPerm?.allowed_category_ids !== undefined
  );
  const [allowedCatIds, setAllowedCatIds] = useState<number[]>(
    existingPerm?.allowed_category_ids ?? categories.map((c) => c.id)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleNav = (key: string) => {
    setAllowedNav((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleCat = (id: number) => {
    setAllowedCatIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateUserPermissions(user.id, {
        allowed_nav_links: restrictNav ? allowedNav : null,
        allowed_category_ids: restrictCats ? allowedCatIds : null,
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save permissions");
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Permissions — ${user.name}`}
      size="sm"
    >
      <div className="p-6 flex flex-col gap-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-error-bg px-3 py-2 text-sm text-error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Nav Links */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Nav Links
            </span>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs text-text-muted">Restrict access</span>
              <button
                type="button"
                onClick={() => setRestrictNav((v) => !v)}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  restrictNav ? "bg-primary" : "bg-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    restrictNav ? "translate-x-4" : ""
                  }`}
                />
              </button>
            </label>
          </div>

          {restrictNav ? (
            <div className="flex flex-col gap-2 pl-2">
              {RESTRICTABLE_NAV_LINKS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowedNav.includes(key)}
                    onChange={() => toggleNav(key)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm text-text">{label}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted pl-2">
              User can access all nav links.
            </p>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Categories */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Categories
            </span>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs text-text-muted">Restrict access</span>
              <button
                type="button"
                onClick={() => {
                  if (!restrictCats) {
                    // Pre-select all categories when enabling restriction
                    setAllowedCatIds(categories.map((c) => c.id));
                  }
                  setRestrictCats((v) => !v);
                }}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  restrictCats ? "bg-primary" : "bg-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    restrictCats ? "translate-x-4" : ""
                  }`}
                />
              </button>
            </label>
          </div>

          {restrictCats ? (
            <div className="flex flex-col gap-2 pl-2 max-h-48 overflow-y-auto">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowedCatIds.includes(cat.id)}
                    onChange={() => toggleCat(cat.id)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="flex items-center gap-2 text-sm text-text">
                    {cat.color && (
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                    )}
                    {cat.name}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted pl-2">
              User can access all categories and their meetings.
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-surface-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving…" : "Save Permissions"}
          </button>
        </div>
      </div>
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
