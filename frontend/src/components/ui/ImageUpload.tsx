"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  label?: string;
  accept?: string;
  maxSizeMb?: number;
  aspectRatio?: "square" | "wide";
}

export default function ImageUpload({
  currentImageUrl,
  onUpload,
  onRemove,
  label = "Upload image",
  accept = "image/jpeg,image/png,image/webp,image/gif",
  maxSizeMb = 5,
  aspectRatio = "wide",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (file.size > maxSizeMb * 1024 * 1024) {
        setError(`File must be under ${maxSizeMb} MB`);
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setIsUploading(true);
      try {
        await onUpload(file);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
        setPreview(null);
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, maxSizeMb]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const displayImage = preview ?? currentImageUrl;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-sm font-medium text-text-muted">{label}</span>
      )}

      <div
        className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden
          ${isDragging ? "border-primary bg-primary-light" : "border-border bg-surface hover:border-primary/50"}
          ${aspectRatio === "square" ? "aspect-square" : "aspect-video"}
        `}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        <AnimatePresence mode="wait">
          {displayImage ? (
            <motion.div
              key="preview"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Image
                src={displayImage}
                alt="Preview"
                fill
                className="object-cover"
                unoptimized
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {isUploading ? (
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 opacity-40" />
                  <span className="text-xs font-medium">{label}</span>
                  <span className="text-xs opacity-60">
                    <Upload className="inline h-3 w-3 mr-1" />
                    Drag & drop or click
                  </span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && <p className="text-xs text-error">{error}</p>}

      {displayImage && onRemove && (
        <button
          type="button"
          onClick={async (e) => {
            e.stopPropagation();
            setPreview(null);
            await onRemove();
          }}
          className="flex items-center gap-1 text-xs text-error hover:underline w-fit"
        >
          <X className="h-3 w-3" /> Remove image
        </button>
      )}
    </div>
  );
}
