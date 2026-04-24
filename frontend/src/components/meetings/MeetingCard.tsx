"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, User } from "lucide-react";
import type { MeetingLink } from "@/lib/types";
import { assetUrl } from "@/lib/api";

interface MeetingCardProps {
  meeting: MeetingLink;
  onClick: () => void;
}

export default function MeetingCard({ meeting, onClick }: MeetingCardProps) {
  const [imgError, setImgError] = useState(false);

  const title = meeting.display_name ?? meeting.name;
  const hostName = meeting.host?.display_name ?? meeting.host?.name ?? null;
  const meetingImg = !imgError ? assetUrl(meeting.image_path) : null;
  const hostImg = assetUrl(meeting.host?.image_path);
  const categoryColor = meeting.category?.color ?? "#01467f";

  return (
    <motion.button
      onClick={onClick}
      className="group relative flex flex-col rounded-2xl border border-border bg-surface overflow-hidden text-left w-full transition-shadow hover:shadow-xl hover:shadow-black/10"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Image / placeholder */}
      <div className="relative aspect-video w-full overflow-hidden bg-surface-2">
        {meetingImg ? (
          <Image
            src={meetingImg}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${categoryColor}22, ${categoryColor}44)`,
            }}
          >
            <Calendar
              className="h-10 w-10 opacity-30"
              style={{ color: categoryColor }}
            />
          </div>
        )}

        {/* Host avatar overlay */}
        {meeting.host && (
          <div className="absolute bottom-2 right-2">
            <div className="h-19 w-19 rounded-full border-2 border-white/80 bg-surface overflow-hidden shadow-md">
              {hostImg ? (
                <Image
                  src={hostImg}
                  alt={hostName ?? "Host"}
                  fill
                  className="object-cover rounded-full"
                  unoptimized
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: categoryColor }}
                >
                  {hostName?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Category badge */}
        {meeting.category && (
          <div className="absolute top-2 left-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
              style={{ backgroundColor: categoryColor }}
            >
              {meeting.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-semibold text-text leading-snug line-clamp-2 group-hover:text-primary transition-colors dark:group-hover:text-white">
          {title}
        </h3>
        {hostName && (
          <p className="text-xs text-text-muted flex items-center gap-1">
            <User className="h-3 w-3" />
            {hostName}
          </p>
        )}
      </div>

      {/* Book CTA */}
      <div className="px-4 pb-4">
        <div className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity">
          Book Meeting
        </div>
      </div>
    </motion.button>
  );
}
