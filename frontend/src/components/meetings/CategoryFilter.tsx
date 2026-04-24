"use client";

import { motion } from "framer-motion";
import type { Category, MeetingHost } from "@/lib/types";

interface CategoryFilterProps {
  categories: Category[];
  hosts: MeetingHost[];
  selectedCategory: number | null;
  selectedHost: number | null;
  onCategoryChange: (id: number | null) => void;
  onHostChange: (id: number | null) => void;
}

export default function CategoryFilter({
  categories,
  hosts,
  selectedCategory,
  selectedHost,
  onCategoryChange,
  onHostChange,
}: CategoryFilterProps) {
  return (
    <aside className="flex flex-col gap-6">
      {/* Categories */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Categories
        </p>
        <div className="flex flex-col gap-1">
          <FilterChip
            label="All meetings"
            active={selectedCategory === null}
            color={null}
            onClick={() => onCategoryChange(null)}
          />
          {categories.map((cat) => (
            <FilterChip
              key={cat.id}
              label={cat.name}
              active={selectedCategory === cat.id}
              color={cat.color}
              onClick={() =>
                onCategoryChange(selectedCategory === cat.id ? null : cat.id)
              }
            />
          ))}
        </div>
      </div>

      {/* Hosts */}
      {hosts.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Hosts
          </p>
          <div className="flex flex-col py-2 gap-1 max-h-[50vh] overflow-y-scroll">
            <FilterChip
              label="All hosts"
              active={selectedHost === null}
              color={null}
              onClick={() => onHostChange(null)}
            />
            {hosts.map((host) => (
              <FilterChip
                key={host.id}
                label={host.display_name ?? host.name}
                active={selectedHost === host.id}
                color={null}
                onClick={() =>
                  onHostChange(selectedHost === host.id ? null : host.id)
                }
              />
            ))}
          </div>
        </div>
      )}
    </aside>
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
  color: string | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-left transition-colors w-full ${
        active
          ? "bg-primary-light text-primary dark:text-white"
          : "text-text-muted hover:bg-surface-2 hover:text-text hover:dark:text-white"
      }`}
    >
      {color && (
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="truncate">{label}</span>
      {active && (
        <motion.div
          layoutId={`chip-bg-${label}`}
          className="absolute inset-0 rounded-xl bg-primary-light -z-10"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </button>
  );
}
