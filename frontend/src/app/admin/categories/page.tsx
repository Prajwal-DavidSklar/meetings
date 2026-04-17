"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/api";
import type { Category, CategoryCreate } from "@/lib/types";

const PRESET_COLORS = [
  "#01467f", "#7d1e4e", "#16a34a", "#d97706",
  "#dc2626", "#7c3aed", "#0891b2", "#be123c",
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = () =>
    getCategories(true).then((data) => {
      setCategories(data);
      setLoading(false);
    });

  useEffect(() => {
    reload();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (data: CategoryCreate) => {
    try {
      if (editing) {
        await updateCategory(editing.id, data);
      } else {
        await createCategory(data);
      }
      setModalOpen(false);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleToggle = async (cat: Category) => {
    await updateCategory(cat.id, { is_active: !cat.is_active });
    reload();
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Deactivate "${cat.name}"?`)) return;
    await deleteCategory(cat.id);
    reload();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Categories</h1>
          <p className="text-sm text-text-muted mt-1">
            Organise meetings into categories
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-border bg-surface animate-pulse"
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Tag className="h-12 w-12 text-text-muted/30 mb-3" />
          <p className="font-semibold text-text mb-1">No categories yet</p>
          <p className="text-sm text-text-muted">Create one to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3 ${
                  !cat.is_active ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-xl shrink-0"
                    style={{ backgroundColor: cat.color ?? "#ccc" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text truncate">{cat.name}</p>
                    {cat.description && (
                      <p className="text-xs text-text-muted truncate">
                        {cat.description}
                      </p>
                    )}
                  </div>
                  {!cat.is_active && (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-muted shrink-0">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 pt-1 border-t border-border">
                  <button
                    onClick={() => openEdit(cat)}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-text-muted hover:bg-surface-2 hover:text-text transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggle(cat)}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-text-muted hover:bg-surface-2 transition-colors"
                  >
                    {cat.is_active ? (
                      <X className="h-3 w-3" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    {cat.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-text-muted hover:bg-error-bg hover:text-error transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editing={editing}
        error={error}
      />
    </div>
  );
}

function CategoryModal({
  open,
  onClose,
  onSave,
  editing,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: CategoryCreate) => Promise<void>;
  editing: Category | null;
  error: string | null;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setDescription(editing?.description ?? "");
      setColor(editing?.color ?? PRESET_COLORS[0]);
      setSortOrder(editing?.sort_order ?? 0);
    }
  }, [open, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ name, description: description || undefined, color, sort_order: sortOrder });
    setSaving(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Category" : "New Category"}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-error-bg px-3 py-2 text-sm text-error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputCls}
            placeholder="e.g. Sales"
          />
        </Field>

        <Field label="Description">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputCls}
            placeholder="Optional description"
          />
        </Field>

        <Field label="Colour">
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full transition-transform ${
                  color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-7 w-7 rounded-full cursor-pointer border-0 p-0"
            />
          </div>
        </Field>

        <Field label="Sort Order">
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className={inputCls}
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
