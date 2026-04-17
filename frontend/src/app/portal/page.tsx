"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, CalendarX2, SlidersHorizontal, X } from "lucide-react";
import CategoryFilter from "@/components/meetings/CategoryFilter";
import MeetingCard from "@/components/meetings/MeetingCard";
import BookingModal from "@/components/meetings/BookingModal";
import { getCategories, getHosts, getMeetings } from "@/lib/api";
import type { Category, MeetingHost, MeetingLink } from "@/lib/types";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function PortalPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hosts, setHosts] = useState<MeetingHost[]>([]);
  const [meetings, setMeetings] = useState<MeetingLink[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedHost, setSelectedHost] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [activeMeeting, setActiveMeeting] = useState<MeetingLink | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    Promise.all([getCategories(), getHosts(), getMeetings()]).then(
      ([cats, hs, ms]) => {
        setCategories(cats);
        setHosts(hs);
        setMeetings(ms);
        setLoading(false);
      }
    );
  }, []);

  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      if (selectedCategory && m.category_id !== selectedCategory) return false;
      if (selectedHost && m.host_id !== selectedHost) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = (m.display_name ?? m.name).toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    });
  }, [meetings, selectedCategory, selectedHost, search]);

  const hasFilters = selectedCategory !== null || selectedHost !== null || search;

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedHost(null);
    setSearch("");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <input
            type="search"
            placeholder="Search meetings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="flex md:hidden items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-muted hover:bg-surface-2 transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {hasFilters && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white font-bold">
              {(selectedCategory ? 1 : 0) + (selectedHost ? 1 : 0) + (search ? 1 : 0)}
            </span>
          )}
        </button>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-text-muted hover:text-error hover:border-error transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-56 shrink-0">
          <div className="sticky top-24">
            <CategoryFilter
              categories={categories}
              hosts={hosts}
              selectedCategory={selectedCategory}
              selectedHost={selectedHost}
              onCategoryChange={setSelectedCategory}
              onHostChange={setSelectedHost}
            />
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 md:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              className="absolute left-0 top-0 h-full w-72 bg-background border-r border-border p-5 overflow-y-auto"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between mb-5">
                <span className="font-semibold text-text">Filters</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-full p-1.5 hover:bg-surface-2 text-text-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <CategoryFilter
                categories={categories}
                hosts={hosts}
                selectedCategory={selectedCategory}
                selectedHost={selectedHost}
                onCategoryChange={(id) => {
                  setSelectedCategory(id);
                  setSidebarOpen(false);
                }}
                onHostChange={(id) => {
                  setSelectedHost(id);
                  setSidebarOpen(false);
                }}
              />
            </motion.div>
          </div>
        )}

        {/* Meeting grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState onClear={hasFilters ? clearFilters : undefined} />
          ) : (
            <>
              <p className="mb-4 text-sm text-text-muted">
                {filtered.length} meeting{filtered.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((meeting, i) => (
                  <motion.div
                    key={meeting.id}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <MeetingCard
                      meeting={meeting}
                      onClick={() => setActiveMeeting(meeting)}
                    />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <BookingModal
        meeting={activeMeeting}
        onClose={() => setActiveMeeting(null)}
      />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden animate-pulse">
      <div className="aspect-video bg-surface-2" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-4 w-3/4 rounded-full bg-surface-2" />
        <div className="h-3 w-1/2 rounded-full bg-surface-2" />
        <div className="h-8 w-full rounded-xl bg-surface-2 mt-1" />
      </div>
    </div>
  );
}

function EmptyState({ onClear }: { onClear?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <CalendarX2 className="h-14 w-14 text-text-muted/30 mb-4" />
      <p className="text-lg font-semibold text-text mb-1">No meetings found</p>
      <p className="text-sm text-text-muted mb-4">
        {onClear
          ? "Try adjusting your filters or search."
          : "No meetings are available right now."}
      </p>
      {onClear && (
        <button
          onClick={onClear}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
