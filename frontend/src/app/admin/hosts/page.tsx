"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Plus,
  Pencil,
  UserCircle,
  AlertCircle,
  Check,
  X,
  ImageIcon,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import ImageUpload from "@/components/ui/ImageUpload";
import {
  getHosts,
  createHost,
  updateHost,
  deleteHost,
  uploadHostImage,
  deleteHostImage,
} from "@/lib/api";
import { assetUrl } from "@/lib/api";
import type { MeetingHost, MeetingHostCreate } from "@/lib/types";

export default function HostsPage() {
  const [hosts, setHosts] = useState<MeetingHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MeetingHost | null>(null);
  const [imageModal, setImageModal] = useState<MeetingHost | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = () =>
    getHosts(true).then((data) => {
      setHosts(data);
      setLoading(false);
    });

  useEffect(() => {
    reload();
  }, []);

  const handleSave = async (data: MeetingHostCreate) => {
    try {
      if (editing) {
        await updateHost(editing.id, data);
      } else {
        await createHost(data);
      }
      setModalOpen(false);
      setError(null);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const handleToggle = async (host: MeetingHost) => {
    await updateHost(host.id, { is_active: !host.is_active });
    reload();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Hosts</h1>
          <p className="text-sm text-text-muted mt-1">
            Meeting hosts synced from HubSpot and custom entries
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
          Add Host
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-border bg-surface animate-pulse"
            />
          ))}
        </div>
      ) : hosts.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <UserCircle className="h-12 w-12 text-text-muted/30 mb-3" />
          <p className="font-semibold text-text mb-1">No hosts yet</p>
          <p className="text-sm text-text-muted">
            Sync with HubSpot or add a custom host
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {hosts.map((host, i) => {
              const displayName = host.display_name ?? host.name;
              const imgUrl = assetUrl(host.image_path);

              return (
                <motion.div
                  key={host.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-2xl border border-border bg-surface p-4 flex flex-col gap-3 ${
                    !host.is_active ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 rounded-full overflow-hidden bg-primary-light shrink-0">
                      {imgUrl ? (
                        <Image
                          src={imgUrl}
                          alt={displayName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-primary">
                          {displayName[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text truncate">
                        {displayName}
                      </p>
                      {host.email && (
                        <p className="text-xs text-text-muted truncate">
                          {host.email}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {host.is_custom ? (
                          <span className="rounded-full bg-secondary-light text-secondary px-2 py-0.5 text-xs font-medium">
                            Custom
                          </span>
                        ) : (
                          <span className="rounded-full bg-primary-light text-primary px-2 py-0.5 text-xs font-medium">
                            HubSpot
                          </span>
                        )}
                        {!host.is_active && (
                          <span className="rounded-full bg-surface-2 text-text-muted px-2 py-0.5 text-xs">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 pt-1 border-t border-border">
                    <button
                      onClick={() => {
                        setEditing(host);
                        setError(null);
                        setModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-text-muted hover:bg-surface-2 hover:text-text transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => setImageModal(host)}
                      className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-text-muted hover:bg-surface-2 hover:text-text transition-colors"
                    >
                      <ImageIcon className="h-3 w-3" />
                      Photo
                    </button>
                    <button
                      onClick={() => handleToggle(host)}
                      className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs text-text-muted hover:bg-surface-2 transition-colors ml-auto"
                    >
                      {host.is_active ? (
                        <X className="h-3 w-3" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      {host.is_active ? "Hide" : "Show"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Edit/Create modal */}
      <HostModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editing={editing}
        error={error}
      />

      {/* Image upload modal */}
      <Modal
        open={!!imageModal}
        onClose={() => {
          setImageModal(null);
          reload();
        }}
        title={`Photo — ${imageModal?.display_name ?? imageModal?.name ?? ""}`}
        size="sm"
      >
        {imageModal && (
          <div className="p-6">
            <ImageUpload
              currentImageUrl={assetUrl(imageModal.image_path)}
              aspectRatio="square"
              label="Host profile photo"
              onUpload={async (file) => {
                const updated = await uploadHostImage(imageModal.id, file);
                setImageModal(updated);
                reload();
              }}
              onRemove={async () => {
                const updated = await deleteHostImage(imageModal.id);
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

function HostModal({
  open,
  onClose,
  onSave,
  editing,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: MeetingHostCreate) => Promise<void>;
  editing: MeetingHost | null;
  error: string | null;
}) {
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setDisplayName(editing?.display_name ?? "");
      setEmail(editing?.email ?? "");
    }
  }, [open, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      name,
      display_name: displayName || undefined,
      email: email || undefined,
    });
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Host" : "New Host"} size="sm">
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
            placeholder="Jane Doe"
          />
        </Field>

        <Field label="Display Name (optional)">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputCls}
            placeholder="Override shown in UI"
          />
        </Field>

        <Field label="Email (optional)">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="jane@company.com"
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
