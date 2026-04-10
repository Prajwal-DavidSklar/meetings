"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { categoriesApi } from "@/lib/api";
import type { Category } from "@/lib/types";
import AdminCard, {
  AdminPageHeader,
  FormField,
  FormModal,
  PrimaryButton,
  StatusBadge,
  inputStyle,
} from "@/components/admin/AdminCard";

const PRESET_COLORS = [
  "#01467f", "#7d1e4e", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: "#01467f", sort_order: 0 });
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    try {
      setCategories(await categoriesApi.list(true));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", color: "#01467f", sort_order: 0 });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description ?? "",
      color: cat.color ?? "#01467f",
      sort_order: cat.sort_order,
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
        await categoriesApi.update(editing.id, {
          name: form.name,
          description: form.description || null,
          color: form.color,
          sort_order: form.sort_order,
        });
      } else {
        await categoriesApi.create({
          name: form.name,
          description: form.description || null,
          color: form.color,
          sort_order: form.sort_order,
        });
      }
      setModalOpen(false);
      fetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (cat: Category) => {
    try {
      await categoriesApi.update(cat.id, { is_active: !cat.is_active });
      fetch();
    } catch { /* ignore */ }
  };

  return (
    <>
      <AdminPageHeader
        title="Categories"
        description="Organise meeting links into booking categories."
        action={
          <PrimaryButton onClick={openCreate}>
            <Plus size={14} /> New Category
          </PrimaryButton>
        }
      />

      <AdminCard title="All Categories">
        {loading ? (
          <LoadingRows />
        ) : categories.length === 0 ? (
          <EmptyRow message="No categories yet. Create one to start organising meetings." />
        ) : (
          <div>
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "14px 24px",
                  borderBottom: i < categories.length - 1 ? "1px solid var(--border)" : "none",
                  flexWrap: "wrap",
                }}
              >
                {/* Color swatch */}
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: cat.color ?? "var(--primary)",
                    flexShrink: 0,
                    boxShadow: `0 0 0 3px ${(cat.color ?? "#01467f")}33`,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>
                    {cat.name}
                  </p>
                  {cat.description && (
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {cat.description}
                    </p>
                  )}
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", marginRight: "8px" }}>
                  order: {cat.sort_order}
                </span>
                <StatusBadge active={cat.is_active} />
                <div style={{ display: "flex", gap: "6px", marginLeft: "8px" }}>
                  <IconButton onClick={() => openEdit(cat)} title="Edit">
                    <Pencil size={14} />
                  </IconButton>
                  <IconButton
                    onClick={() => handleToggle(cat)}
                    title={cat.is_active ? "Deactivate" : "Activate"}
                    danger={cat.is_active}
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
            title={editing ? "Edit Category" : "New Category"}
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
                placeholder="e.g. Consultation"
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </FormField>

            <FormField label="Description">
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                style={inputStyle}
                placeholder="Optional description"
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </FormField>

            <FormField label="Color">
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: c,
                      border: form.color === c ? "3px solid var(--text-primary)" : "2px solid transparent",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  style={{ width: "28px", height: "28px", padding: "0", border: "none", borderRadius: "50%", cursor: "pointer" }}
                  title="Custom color"
                />
              </div>
            </FormField>

            <FormField label="Sort Order">
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                style={{ ...inputStyle, width: "100px" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </FormField>

            {error && <ErrorMessage message={error} />}
          </FormModal>
        )}
      </AnimatePresence>
    </>
  );
}

function IconButton({
  onClick,
  title,
  danger,
  children,
}: {
  onClick: () => void;
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
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
          style={{
            height: "56px",
            margin: "1px 24px",
            borderRadius: "8px",
            background: "var(--bg-hover)",
            marginBottom: "8px",
          }}
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

function ErrorMessage({ message }: { message: string }) {
  return (
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
      {message}
    </div>
  );
}
