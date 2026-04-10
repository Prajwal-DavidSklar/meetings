"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, RefreshCw, Users } from "lucide-react";
import { categoriesApi, hostsApi, meetingsApi } from "@/lib/api";
import type { Category, MeetingHost, MeetingLink } from "@/lib/types";
import MeetingCard from "@/components/meetings/MeetingCard";
import BookingModal from "@/components/meetings/BookingModal";

export default function PortalPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hosts, setHosts] = useState<MeetingHost[]>([]);
  const [meetings, setMeetings] = useState<MeetingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedHost, setSelectedHost] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [bookedMeeting, setBookedMeeting] = useState<MeetingLink | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, hs, ms] = await Promise.all([
        categoriesApi.list(),
        hostsApi.list(),
        meetingsApi.list(),
      ]);
      setCategories(cats);
      setHosts(hs);
      setMeetings(ms);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side filtering for fast UX
  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      if (selectedCategory != null && m.category_id !== selectedCategory) return false;
      if (selectedHost != null && m.host_id !== selectedHost) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = (m.display_name ?? m.name).toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    });
  }, [meetings, selectedCategory, selectedHost, search]);

  // Only show hosts that have at least one meeting in current category filter
  const relevantHosts = useMemo(() => {
    const ids = new Set(
      meetings
        .filter((m) => selectedCategory == null || m.category_id === selectedCategory)
        .map((m) => m.host_id)
        .filter(Boolean) as number[]
    );
    return hosts.filter((h) => ids.has(h.id));
  }, [hosts, meetings, selectedCategory]);

  return (
    <>
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "24px 24px 48px",
        }}
      >
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: "28px" }}
        >
          <h1
            style={{
              fontSize: "26px",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.5px",
              marginBottom: "4px",
            }}
          >
            Meeting Bookings
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Select a meeting to open the booking form
          </p>
        </motion.div>

        {/* Filters row */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", maxWidth: "400px" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "14px",
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
                width: "100%",
                padding: "10px 36px 10px 40px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
                boxShadow: "var(--shadow-sm)",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category tabs */}
          {categories.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <FilterPill
                label="All"
                active={selectedCategory === null}
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedHost(null);
                }}
              />
              {categories.map((cat) => (
                <FilterPill
                  key={cat.id}
                  label={cat.name}
                  active={selectedCategory === cat.id}
                  color={cat.color ?? undefined}
                  onClick={() => {
                    setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                    setSelectedHost(null);
                  }}
                />
              ))}
            </div>
          )}

          {/* Host filter */}
          {relevantHosts.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginRight: "4px",
                }}
              >
                <Users size={12} /> Host
              </span>
              {relevantHosts.map((h) => (
                <FilterPill
                  key={h.id}
                  label={h.display_name ?? h.name}
                  active={selectedHost === h.id}
                  secondary
                  onClick={() => setSelectedHost(selectedHost === h.id ? null : h.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Results count + refresh */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {loading ? "Loading…" : `${filtered.length} meeting${filtered.length !== 1 ? "s" : ""}`}
          </span>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            <motion.span
              animate={loading ? { rotate: 360 } : { rotate: 0 }}
              transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
              style={{ display: "flex" }}
            >
              <RefreshCw size={13} />
            </motion.span>
            Refresh
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <MeetingsSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            hasFilters={!!(selectedCategory || selectedHost || search)}
            onReset={() => {
              setSelectedCategory(null);
              setSelectedHost(null);
              setSearch("");
            }}
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedCategory}-${selectedHost}-${search}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "20px",
              }}
            >
              {filtered.map((meeting, i) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onBook={setBookedMeeting}
                  index={i}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <BookingModal meeting={bookedMeeting} onClose={() => setBookedMeeting(null)} />
    </>
  );
}

function FilterPill({
  label,
  active,
  color,
  secondary,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  secondary?: boolean;
  onClick: () => void;
}) {
  const activeColor = color ?? (secondary ? "var(--secondary)" : "var(--primary)");

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        padding: "6px 16px",
        borderRadius: "var(--radius-pill)",
        border: `1.5px solid ${active ? activeColor : "var(--border)"}`,
        background: active
          ? color
            ? `${color}22`
            : secondary
            ? "color-mix(in srgb, var(--secondary) 12%, transparent)"
            : "color-mix(in srgb, var(--primary) 12%, transparent)"
          : "var(--bg-card)",
        color: active ? activeColor : "var(--text-secondary)",
        fontWeight: active ? 700 : 500,
        fontSize: "13px",
        cursor: "pointer",
        transition: "all 0.15s",
        boxShadow: active ? `0 2px 8px ${color ?? "var(--primary)"}33` : "var(--shadow-sm)",
      }}
    >
      {label}
    </motion.button>
  );
}

function MeetingsSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: "20px",
      }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          <div style={{ height: "140px", background: "var(--bg-hover)" }} />
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ height: "16px", borderRadius: "6px", background: "var(--bg-hover)", width: "75%" }} />
            <div style={{ height: "13px", borderRadius: "6px", background: "var(--bg-hover)", width: "50%" }} />
            <div style={{ height: "36px", borderRadius: "10px", background: "var(--bg-hover)", marginTop: "8px" }} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        textAlign: "center",
        padding: "80px 24px",
        color: "var(--text-muted)",
      }}
    >
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "20px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
        }}
      >
        <Search size={28} color="var(--text-muted)" />
      </div>
      <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
        No meetings found
      </p>
      <p style={{ fontSize: "14px", marginBottom: "24px" }}>
        {hasFilters
          ? "Try adjusting your filters or search query."
          : "No meeting links have been added yet."}
      </p>
      {hasFilters && (
        <button
          onClick={onReset}
          style={{
            padding: "10px 24px",
            borderRadius: "var(--radius-pill)",
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Clear filters
        </button>
      )}
    </motion.div>
  );
}
