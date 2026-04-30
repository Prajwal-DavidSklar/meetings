"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { User, Clock, MapPin, Video, Phone } from "lucide-react";
import type { MeetingLink } from "@/lib/types";
import { assetUrl } from "@/lib/api";

interface MeetingCardProps {
  meeting: MeetingLink;
  onClick: () => void;
  onViewNotes?: () => void;
}

function getMeetingType(meeting: MeetingLink): "teams" | "phone" | "in-person" {
  const name = (meeting.display_name ?? meeting.name).toLowerCase();
  if (name.includes("teams")) return "teams";
  if (name.includes("phone")) return "phone";
  return "in-person";
}

const TYPE_META = {
  teams: { label: "Teams", Icon: Video, color: "#7B83EB" },
  phone: { label: "Phone", Icon: Phone, color: "#91048f" },
  "in-person": { label: "In-person", Icon: MapPin, color: "#b45309" },
} satisfies Record<
  string,
  { label: string; Icon: React.ElementType; color: string }
>;

export default function MeetingCard({
  meeting,
  onClick,
  onViewNotes,
}: MeetingCardProps) {
  const [imgError, setImgError] = useState(false);
  const [hostImgError, setHostImgError] = useState(false);

  const title = meeting.display_name ?? meeting.name;
  const hostName = meeting.host?.display_name ?? meeting.host?.name ?? null;
  const meetingImg = !imgError ? assetUrl(meeting.image_path) : null;
  const hostImg = !hostImgError ? assetUrl(meeting.host?.image_path) : null;
  const accentColor = meeting.category?.color ?? "#01467f";
  const {
    label: typeLabel,
    Icon: TypeIcon,
    color: typeColor,
  } = TYPE_META[getMeetingType(meeting)];

  return (
    <motion.button
      onClick={onClick}
      className="group flex flex-col rounded-2xl border border-border bg-surface overflow-hidden text-left w-full hover:shadow-lg hover:shadow-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* ── Hero section ── */}
      {/*
        pt-11 (44px) pushes the avatar below the badge row.
        Badge row sits at top-3 (12px) and is ~26px tall → ends at ~38px.
        Avatar starts at 44px → 6px clearance, no overlap.
      */}
      <div className="relative flex flex-col items-center pt-11 pb-4 overflow-hidden">
        {/* Background: meeting image — wrapped in its own absolute container
            so Next.js fill works reliably regardless of parent flex layout */}
        {meetingImg && (
          <div className="absolute inset-0">
            <Image
              src={meetingImg}
              alt=""
              fill
              aria-hidden
              className="object-cover opacity-[0.1] transition-transform duration-500 group-hover:scale-110"
              unoptimized
              onError={() => setImgError(true)}
            />
          </div>
        )}

        {/* Accent color wash */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(160deg, ${accentColor}20 20%, ${accentColor}08 100%)`,
          }}
        />

        {/* Badge row: type pill (left) + category (right)
            max-w prevents either badge from ever overlapping the other */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm max-w-[55%]"
            style={{ backgroundColor: typeColor }}
          >
            <TypeIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{typeLabel}</span>
          </span>
          {meeting.category && (
            <span
              className="inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-semibold text-white/90 max-w-[40%]"
              style={{ backgroundColor: `${accentColor}aa` }}
            >
              <span className="truncate">{meeting.category.name}</span>
            </span>
          )}
        </div>

        {/* Host avatar */}
        <div className="relative z-10 w-24 h-24 rounded-full overflow-hidden border-[3px] border-surface shadow-md bg-surface-2 shrink-0">
          {hostImg ? (
            <Image
              src={hostImg}
              alt={hostName ?? "Host"}
              fill
              className="object-cover"
              unoptimized
              onError={() => setHostImgError(true)}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-2xl font-bold text-white"
              style={{ backgroundColor: accentColor }}
            >
              {hostName?.[0]?.toUpperCase() ?? <User className="h-8 w-8" />}
            </div>
          )}
        </div>
      </div>

      {/* ── Body: title, hours, actions ── */}
      <div className="flex flex-col gap-2.5 px-4 pb-4 pt-3">
        {/* Title */}
        <h3 className="text-sm font-bold text-text leading-snug line-clamp-2 text-center">
          {title}
        </h3>

        {/* Hours */}
        {meeting.hours && (
          <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2">
            <Clock
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: accentColor }}
            />
            <span className="text-xs font-semibold text-text truncate leading-none">
              {meeting.hours}
            </span>
          </div>
        )}

        {/* Actions: items-stretch + h-9 ensures both buttons are exactly 36px tall */}
        <div className="flex items-stretch gap-2 h-9">
          {onViewNotes && (
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onViewNotes();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  onViewNotes();
                }
              }}
              className="flex-1 flex items-center justify-center rounded-xl border border-border text-xs font-semibold text-text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
            >
              View Notes
            </div>
          )}
          <div
            className={`${onViewNotes ? "flex-1" : "w-full"} flex items-center justify-center rounded-xl text-xs font-bold text-white`}
            style={{ backgroundColor: accentColor }}
          >
            Book Meeting
          </div>
        </div>
      </div>
    </motion.button>
  );
}
