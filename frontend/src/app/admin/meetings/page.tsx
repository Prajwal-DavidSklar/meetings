"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Pencil,
  ImagePlus,
  Trash2,
  X,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { categoriesApi, hostsApi, meetingsApi, UPLOADS_BASE } from "@/lib/api";
import type { Category, MeetingHost, MeetingLink } from "@/lib/types";
import AdminCard, {
  AdminPageHeader,
  FormField,
  FormModal,
  inputStyle,
  StatusBadge,
} from "@/components/admin/AdminCard";

export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingLink[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hosts, setHosts] = useState<MeetingHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<number | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<MeetingLink | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    display_name: "",
    category_id: "" as string,
    host_id: "" as string,
    sort_order: 0,
    host_override_locked: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ms, cats, hs] = await Promise.all([
        meetingsApi.list({ include_inactive: true }),
        categoriesApi.list(true),
        hostsApi.list(true),
      ]);
      setMeetings(ms);
      setCategories(cats);
      setHosts(hs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openEdit = (m: MeetingLink) => {
    setEditingMeeting(m);
    setEditForm({
      display_name: m.display_name ?? "",
      category_id: m.category_id != null ? String(m.category_id) : "",
      host_id: m.host_id != null ? String(m.host_id) : "",
      sort_order: m.sort_order,
      host_override_locked: m.host_override_locked,
    });
    setSaveError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting) return;
    setSaving(true);
    setSaveError(null);
    try {
      await meetingsApi.update(editingMeeting.id, {
        display_name: editForm.display_name || null,
        category_id: editForm.category_id ? parseInt(editForm.category_id) : null,
        host_id: editForm.host_id ? parseInt(editForm.host_id) : null,
        sort_order: editForm.sort_order,
        unlock_host_override: !editForm.host_override_locked,
      });
      setEditingMeeting(null);
      fetchAll();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (m: MeetingLink) => {
    try {
      await meetingsApi.update(m.id, { is_active: !m.is_active });
      fetchAll();
    } catch { /* ignore */ }
  };

  const handleImageUpload = async (meeting: MeetingLink, file: File) => {
    setUploadingId(meeting.id);
    try {
      await meetingsApi.uploadImage(meeting.id, file);
      fetchAll();
    } finally {
      setUploadingId(null);
    }
  };

  const handleImageDelete = async (meeting: MeetingLink) => {
    try {
      await meetingsApi.deleteImage(meeting.id);
      fetchAll();
    } catch { /* ignore */ }
  };

  const filtered = meetings.filter((m) => {
    if (filterCat != null && m.category_id !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(m.display_name ?? m.name).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <>
      <AdminPageHeader
        title="Meetings"
        description="Manage all meeting links — assign categories, hosts, images, and ordering."
      />

      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: "360px" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings…"
            style={{
              ...inputStyle,
              paddingLeft: "34px",
              borderRadius: "var(--radius-pill)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <FilterChip label="All" active={filterCat === null} onClick={() => setFilterCat(null)} />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              label={c.name}
              active={filterCat === c.id}
              color={c.color ?? undefined}
              onClick={() => setFilterCat(filterCat === c.id ? null : c.id)}
            />
          ))}
        </div>
      </div>

      <AdminCard title={`${filtered.length} Meeting${filtered.length !== 1 ? "s" : ""}`}>
        {loading ? (
          <LoadingRows />
        ) : filtered.length === 0 ? (
          <EmptyRow />
        ) : (
          <div>
            {filtered.map((m, i) => (
              <MeetingRow
                key={m.id}
                meeting={m}
                index={i}
                isLast={i === filtered.length - 1}
                onEdit={() => openEdit(m)}
                onToggleActive={() => handleToggleActive(m)}
                onImageClick={() => {
                  if (m.image_path) {
                    handleImageDelete(m);
                  } else {
                    fileInputRef.current?.setAttribute("data-meeting-id", String(m.id));
                    fileInputRef.current?.click();
                  }
                }}
                uploading={uploadingId === m.id}
              />
            ))}
          </div>
        )}
      </AdminCard>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          const idAttr = e.target.getAttribute("data-meeting-id");
          if (file && idAttr) {
            const meeting = meetings.find((m) => m.id === parseInt(idAttr));
            if (meeting) handleImageUpload(meeting, file);
          }
          e.target.value = "";
        }}
      />

      {/* Edit modal */}
      <AnimatePresence>
        {editingMeeting && (
          <FormModal
            title="Edit Meeting Link"
            onClose={() => setEditingMeeting(null)}
            onSubmit={handleEditSubmit}
            loading={saving}
            submitLabel="Save Changes"
          >
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                marginBottom: "4px",
              }}
            >
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                {editingMeeting.name}
              </p>
              <a
                href={editingMeeting.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "12px",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "3px",
                  textDecoration: "none",
                  width: "fit-content",
                }}
              >
                <ExternalLink size={11} /> HubSpot Link
              </a>
            </div>

            <FormField label="Display Name">
              <input
                value={editForm.display_name}
                onChange={(e) => setEditForm((f) => ({ ...f, display_name: e.target.value }))}
                style={inputStyle}
                placeholder="Leave blank to use HubSpot name"
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </FormField>

            <FormField label="Category">
              <select
                value={editForm.category_id}
                onChange={(e) => setEditForm((f) => ({ ...f, category_id: e.target.value }))}
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <option value="">— Uncategorised —</option>
                {categories.filter((c) => c.is_active).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Host">
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <select
                  value={editForm.host_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, host_id: e.target.value }))}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <option value="">— Auto from HubSpot —</option>
                  {hosts.filter((h) => h.is_active).map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.display_name ?? h.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  title={editForm.host_override_locked ? "Unlock host (allow sync override)" : "Lock host (prevent sync override)"}
                  onClick={() =>
                    setEditForm((f) => ({ ...f, host_override_locked: !f.host_override_locked }))
                  }
                  style={{
                    padding: "9px 10px",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: editForm.host_override_locked
                      ? "color-mix(in srgb, var(--secondary) 10%, transparent)"
                      : "var(--bg-hover)",
                    color: editForm.host_override_locked ? "var(--secondary)" : "var(--text-muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {editForm.host_override_locked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                {editForm.host_override_locked
                  ? "Host is locked — sync won't override this assignment."
                  : "Host will be auto-updated on next sync."}
              </p>
            </FormField>

            <FormField label="Sort Order">
              <input
                type="number"
                value={editForm.sort_order}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))
                }
                style={{ ...inputStyle, width: "100px" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </FormField>

            {saveError && (
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
                {saveError}
              </div>
            )}
          </FormModal>
        )}
      </AnimatePresence>
    </>
  );
}

function MeetingRow({
  meeting,
  index,
  isLast,
  onEdit,
  onToggleActive,
  onImageClick,
  uploading,
}: {
  meeting: MeetingLink;
  index: number;
  isLast: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onImageClick: () => void;
  uploading: boolean;
}) {
  const displayName = meeting.display_name ?? meeting.name;
  const imageUrl = meeting.image_path ? `${UPLOADS_BASE}${meeting.image_path}` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "12px 24px",
        borderBottom: isLast ? "none" : "1px solid var(--border)",
        flexWrap: "wrap",
        opacity: meeting.is_active ? 1 : 0.55,
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "10px",
          overflow: "hidden",
          flexShrink: 0,
          position: "relative",
          cursor: "pointer",
          border: "1px solid var(--border)",
        }}
        onClick={onImageClick}
        title={imageUrl ? "Click to remove image" : "Click to upload image"}
      >
        {uploading ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-hover)",
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ fontSize: "16px" }}
            >
              ⟳
            </motion.div>
          </div>
        ) : imageUrl ? (
          <>
            <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div
              className="img-remove-overlay"
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(239,68,68,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0,
                transition: "opacity 0.15s",
              }}
            >
              <X size={16} color="white" />
            </div>
          </>
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: meeting.category?.color
                ? `${meeting.category.color}33`
                : "var(--bg-hover)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ImagePlus size={16} color="var(--text-muted)" />
          </div>
        )}
      </div>

      {/* Name and meta */}
      <div style={{ flex: 1, minWidth: "160px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>
            {displayName}
          </p>
          {meeting.display_name && meeting.display_name !== meeting.name && (
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              ({meeting.name})
            </span>
          )}
          {meeting.host_override_locked && (
            <span title="Host override locked" style={{ display: "inline-flex" }}>
              <Lock size={11} color="var(--secondary)" />
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", marginTop: "3px", flexWrap: "wrap" }}>
          {meeting.category && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: "var(--radius-pill)",
                background: meeting.category.color
                  ? `${meeting.category.color}22`
                  : "color-mix(in srgb, var(--primary) 10%, transparent)",
                color: meeting.category.color ?? "var(--primary)",
              }}
            >
              {meeting.category.name}
            </span>
          )}
          {meeting.host && (
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {meeting.host.display_name ?? meeting.host.name}
            </span>
          )}
        </div>
      </div>

      {/* Sort order */}
      <span style={{ fontSize: "12px", color: "var(--text-muted)", flexShrink: 0 }}>
        #{meeting.sort_order}
      </span>

      <StatusBadge active={meeting.is_active} />

      {/* Actions */}
      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
        <a
          href={meeting.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Open HubSpot link"
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--bg-hover)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
            textDecoration: "none",
          }}
        >
          <ExternalLink size={13} />
        </a>
        <IconBtn onClick={onEdit} title="Edit">
          <Pencil size={13} />
        </IconBtn>
        <IconBtn
          onClick={onToggleActive}
          title={meeting.is_active ? "Deactivate" : "Reactivate"}
          danger={meeting.is_active}
        >
          {meeting.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
        </IconBtn>
      </div>
    </motion.div>
  );
}

function IconBtn({
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

function FilterChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        padding: "5px 14px",
        borderRadius: "var(--radius-pill)",
        border: `1.5px solid ${active ? (color ?? "var(--primary)") : "var(--border)"}`,
        background: active
          ? color
            ? `${color}1a`
            : "color-mix(in srgb, var(--primary) 10%, transparent)"
          : "var(--bg-card)",
        color: active ? (color ?? "var(--primary)") : "var(--text-secondary)",
        fontWeight: active ? 700 : 500,
        fontSize: "12px",
        cursor: "pointer",
      }}
    >
      {label}
    </motion.button>
  );
}

function LoadingRows() {
  return (
    <div>
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          style={{
            height: "60px",
            margin: "8px 24px",
            borderRadius: "8px",
            background: "var(--bg-hover)",
          }}
        />
      ))}
    </div>
  );
}

function EmptyRow() {
  return (
    <div
      style={{
        padding: "48px 24px",
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: "14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <Calendar size={36} color="var(--text-muted)" />
      No meetings found matching your filters.
    </div>
  );
}
