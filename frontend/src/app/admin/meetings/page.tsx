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
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import ImageUpload from "@/components/ui/ImageUpload";
import {
  getMeetings,
  getCategories,
  getHosts,
  updateMeeting,
  uploadMeetingImage,
  deleteMeetingImage,
} from "@/lib/api";
import { assetUrl } from "@/lib/api";
import type { MeetingLink, MeetingLinkUpdate, Category, MeetingHost } from "@/lib/types";

export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingLink[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hosts, setHosts] = useState<MeetingHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [imageModal, setImageModal] = useState<MeetingLink | null>(null);
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Meetings</h1>
        <p className="text-sm text-text-muted mt-1">
          Manage all meeting links and their settings
        </p>
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
    </div>
  );
}

function MeetingRow({
  meeting,
  categories,
  hosts,
  onUpdate,
  onImageClick,
}: {
  meeting: MeetingLink;
  categories: Category[];
  hosts: MeetingHost[];
  onUpdate: (id: number, data: MeetingLinkUpdate) => Promise<void>;
  onImageClick: () => void;
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
            onChange={(v) =>
              save({ category_id: v ? Number(v) : null })
            }
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
            disabled={false}
          >
            <option value="">No host</option>
            {hosts.map((h) => (
              <option key={h.id} value={h.id}>
                {h.display_name ?? h.name}
              </option>
            ))}
          </SelectField>
          {/* Lock indicator */}
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
