"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Search,
  CalendarDays,
  ImageIcon,
  Lock,
  Unlock,
  EyeOff,
  Eye,
  ChevronDown,
  X,
  Plus,
  FileText,
  AlertCircle,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import ImageUpload from "@/components/ui/ImageUpload";
import {
  getMeetings,
  getCategories,
  getHosts,
  createMeeting,
  updateMeeting,
  uploadMeetingImage,
  deleteMeetingImage,
} from "@/lib/api";
import { assetUrl } from "@/lib/api";
import type {
  MeetingLink,
  MeetingLinkCreate,
  MeetingLinkUpdate,
  Category,
  MeetingHost,
} from "@/lib/types";

export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingLink[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hosts, setHosts] = useState<MeetingHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [imageModal, setImageModal] = useState<MeetingLink | null>(null);
  const [notesModal, setNotesModal] = useState<MeetingLink | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [bulkLocking, setBulkLocking] = useState(false);

  const reload = async () => {
    const [ms, cats, hs] = await Promise.all([
      getMeetings({ include_inactive: true, limit: 500 }),
      getCategories(true),
      getHosts(true),
    ]);
    setMeetings(ms);
    setCategories(cats);
    setHosts(hs);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      if (filterActive === "active" && !m.is_active) return false;
      if (filterActive === "inactive" && m.is_active) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = (m.display_name ?? m.name).toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    });
  }, [meetings, search, filterActive]);

  const handleUpdate = async (id: number, data: MeetingLinkUpdate) => {
    await updateMeeting(id, data);
    reload();
  };

  const handleBulkLock = async (lock: boolean) => {
    setBulkLocking(true);
    await Promise.all(
      meetings.map((m) => updateMeeting(m.id, { unlock_host_override: !lock }))
    );
    await reload();
    setBulkLocking(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Meetings</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage all meeting links and their settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => handleBulkLock(true)}
              disabled={bulkLocking || loading}
              title="Lock all meetings — sync will not overwrite host assignments"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-2 hover:text-text transition-colors disabled:opacity-40"
            >
              <Lock className="h-3.5 w-3.5" />
              Lock All
            </button>
            <div className="w-px self-stretch bg-border" />
            <button
              onClick={() => handleBulkLock(false)}
              disabled={bulkLocking || loading}
              title="Unlock all meetings — sync can freely update host assignments"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-2 hover:text-text transition-colors disabled:opacity-40"
            >
              <Unlock className="h-3.5 w-3.5" />
              Unlock All
            </button>
            {bulkLocking && (
              <div className="px-2">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin block" />
              </div>
            )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Meeting
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="search"
            placeholder="Search meetings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>
        <div className="flex rounded-xl border border-border overflow-hidden">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterActive(f)}
              className={`px-3 py-2 text-sm font-medium transition-colors capitalize ${
                filterActive === f
                  ? "bg-primary text-white"
                  : "text-text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-text-muted">
        Showing {filtered.length} of {meetings.length} meetings
      </p>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl border border-border bg-surface animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <CalendarDays className="h-12 w-12 text-text-muted/30 mb-3" />
          <p className="font-semibold text-text">No meetings found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((meeting, i) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
            >
              <MeetingRow
                meeting={meeting}
                categories={categories}
                hosts={hosts}
                onUpdate={handleUpdate}
                onImageClick={() => setImageModal(meeting)}
                onNotesClick={() => setNotesModal(meeting)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Image upload modal */}
      <Modal
        open={!!imageModal}
        onClose={() => {
          setImageModal(null);
          reload();
        }}
        title={`Image — ${imageModal?.display_name ?? imageModal?.name ?? ""}`}
        size="sm"
      >
        {imageModal && (
          <div className="p-6">
            <ImageUpload
              currentImageUrl={assetUrl(imageModal.image_path)}
              label="Meeting thumbnail"
              onUpload={async (file) => {
                const updated = await uploadMeetingImage(imageModal.id, file);
                setImageModal(updated);
                reload();
              }}
              onRemove={async () => {
                const updated = await deleteMeetingImage(imageModal.id);
                setImageModal(updated);
                reload();
              }}
            />
          </div>
        )}
      </Modal>

      {/* Notes modal */}
      <Modal
        open={!!notesModal}
        onClose={() => setNotesModal(null)}
        title={`Notes — ${notesModal?.display_name ?? notesModal?.name ?? ""}`}
        size="sm"
      >
        {notesModal && (
          <NotesEditor
            initialNotes={notesModal.notes ?? ""}
            onSave={async (notes) => {
              await handleUpdate(notesModal.id, { notes });
              setNotesModal(null);
            }}
            onCancel={() => setNotesModal(null)}
          />
        )}
      </Modal>

      {/* Create meeting modal */}
      <CreateMeetingModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        categories={categories}
        hosts={hosts}
        onCreated={() => {
          reload();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}

function MeetingRow({
  meeting,
  categories,
  hosts,
  onUpdate,
  onImageClick,
  onNotesClick,
}: {
  meeting: MeetingLink;
  categories: Category[];
  hosts: MeetingHost[];
  onUpdate: (id: number, data: MeetingLinkUpdate) => Promise<void>;
  onImageClick: () => void;
  onNotesClick: () => void;
}) {
  const [displayName, setDisplayName] = useState(
    meeting.display_name ?? meeting.name
  );
  const [editingName, setEditingName] = useState(false);
  const [sortOrder, setSortOrder] = useState(String(meeting.sort_order));
  const [saving, setSaving] = useState(false);

  const imgUrl = assetUrl(meeting.image_path);
  const categoryColor = meeting.category?.color ?? "#01467f";

  const save = async (data: MeetingLinkUpdate) => {
    setSaving(true);
    await onUpdate(meeting.id, data);
    setSaving(false);
  };

  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-4 transition-opacity ${
        !meeting.is_active ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Thumbnail */}
        <button
          onClick={onImageClick}
          className="relative h-12 w-20 rounded-xl overflow-hidden bg-surface-2 shrink-0 group"
        >
          {imgUrl ? (
            <Image
              src={imgUrl}
              alt={meeting.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: `${categoryColor}22` }}
            >
              <CalendarDays
                className="h-5 w-5"
                style={{ color: categoryColor }}
              />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <ImageIcon className="h-4 w-4 text-white" />
          </div>
        </button>

        {/* Name */}
        <div className="flex-1 min-w-36">
          {editingName ? (
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={() => {
                setEditingName(false);
                save({ display_name: displayName || undefined });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setEditingName(false);
                  save({ display_name: displayName || undefined });
                }
                if (e.key === "Escape") {
                  setEditingName(false);
                  setDisplayName(meeting.display_name ?? meeting.name);
                }
              }}
              autoFocus
              className="w-full rounded-lg border border-primary bg-background px-2 py-1 text-sm font-medium text-text focus:outline-none"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-sm font-semibold text-text hover:text-primary transition-colors text-left w-full truncate"
              title="Click to edit display name"
            >
              {displayName}
            </button>
          )}
          <p className="text-xs text-text-muted truncate mt-0.5">
            {meeting.name}
          </p>
        </div>

        {/* Category selector */}
        <div className="min-w-32">
          <SelectField
            value={String(meeting.category_id ?? "")}
            onChange={(v) => save({ category_id: v ? Number(v) : null })}
            placeholder="Category"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        </div>

        {/* Host selector */}
        <div className="min-w-32 flex items-center gap-1">
          <SelectField
            value={String(meeting.host_id ?? "")}
            onChange={(v) => save({ host_id: v ? Number(v) : null })}
            placeholder="Host"
          >
            <option value="">No host</option>
            {hosts.map((h) => (
              <option key={h.id} value={h.id}>
                {h.display_name ?? h.name}
              </option>
            ))}
          </SelectField>
          <button
            title={
              meeting.host_override_locked
                ? "Host locked (admin override). Click to unlock for sync."
                : "Host unlocked (sync can update)."
            }
            onClick={() =>
              save({ unlock_host_override: meeting.host_override_locked })
            }
            className="text-text-muted hover:text-primary transition-colors shrink-0"
          >
            {meeting.host_override_locked ? (
              <Lock className="h-3.5 w-3.5 text-secondary" />
            ) : (
              <Unlock className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Sort order */}
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          onBlur={() => save({ sort_order: Number(sortOrder) })}
          className="w-16 rounded-xl border border-border bg-surface px-2 py-1.5 text-center text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          title="Sort order"
        />

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={onNotesClick}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs transition-colors ${
              meeting.notes
                ? "text-secondary hover:bg-surface-2"
                : "text-text-muted hover:bg-surface-2 hover:text-text"
            }`}
            title={meeting.notes ? "Edit notes" : "Add notes"}
          >
            <FileText className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onImageClick}
            className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs text-text-muted hover:bg-surface-2 hover:text-text transition-colors"
            title="Upload image"
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => save({ is_active: !meeting.is_active })}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs transition-colors ${
              meeting.is_active
                ? "text-text-muted hover:bg-error-bg hover:text-error"
                : "text-success hover:bg-success-bg"
            }`}
            title={meeting.is_active ? "Hide meeting" : "Show meeting"}
          >
            {meeting.is_active ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
          {saving && (
            <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          )}
        </div>
      </div>
    </div>
  );
}

function NotesEditor({
  initialNotes,
  onSave,
  onCancel,
}: {
  initialNotes: string;
  onSave: (notes: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(notes);
    setSaving(false);
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={6}
        autoFocus
        className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors resize-none"
        placeholder="Add notes visible to users on the meeting card…"
      />
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-surface-2 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function CreateMeetingModal({
  open,
  onClose,
  categories,
  hosts,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  hosts: MeetingHost[];
  onCreated: () => void;
}) {
  const emptyForm = {
    name: "",
    url: "",
    display_name: "",
    category_id: "",
    host_id: "",
    sort_order: "0",
    notes: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setError("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (k: string, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) {
      setError("Name and URL are required.");
      return;
    }
    setSaving(true);
    try {
      const payload: MeetingLinkCreate = {
        name: form.name.trim(),
        url: form.url.trim(),
        display_name: form.display_name.trim() || undefined,
        category_id: form.category_id ? Number(form.category_id) : undefined,
        host_id: form.host_id ? Number(form.host_id) : undefined,
        sort_order: Number(form.sort_order) || 0,
        notes: form.notes.trim() || undefined,
      };
      await createMeeting(payload);
      onCreated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create meeting.");
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Meeting Link" size="md">
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-error-bg px-3 py-2 text-sm text-error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Field label="Name *">
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            className={inputCls}
            placeholder="30-minute intro call"
          />
        </Field>

        <Field label="Booking URL *">
          <input
            value={form.url}
            onChange={(e) => set("url", e.target.value)}
            required
            type="url"
            className={inputCls}
            placeholder="https://meetings.hubspot.com/…"
          />
        </Field>

        <Field label="Display Name (optional)">
          <input
            value={form.display_name}
            onChange={(e) => set("display_name", e.target.value)}
            className={inputCls}
            placeholder="Override shown in UI"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <div className="relative">
              <select
                value={form.category_id}
                onChange={(e) => set("category_id", e.target.value)}
                className={`${inputCls} appearance-none pr-7`}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            </div>
          </Field>

          <Field label="Host">
            <div className="relative">
              <select
                value={form.host_id}
                onChange={(e) => set("host_id", e.target.value)}
                className={`${inputCls} appearance-none pr-7`}
              >
                <option value="">No host</option>
                {hosts.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.display_name ?? h.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
            </div>
          </Field>
        </div>

        <Field label="Sort Order">
          <input
            value={form.sort_order}
            onChange={(e) => set("sort_order", e.target.value)}
            type="number"
            className={inputCls}
            placeholder="0"
          />
        </Field>

        <Field label="Notes (optional)">
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            className={`${inputCls} resize-none`}
            placeholder="Visible to users on the meeting card…"
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
            {saving ? "Creating…" : "Create Meeting"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SelectField({
  value,
  onChange,
  placeholder,
  children,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none rounded-xl border border-border bg-surface pl-3 pr-7 py-1.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors disabled:opacity-60"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
    </div>
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
