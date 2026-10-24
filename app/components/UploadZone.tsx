"use client";

import { useRef, useState } from "react";
import { Upload, Camera, X, Image as ImageIcon, Sparkles, HelpCircle } from "lucide-react";
import { resizeImage } from "@/lib/image";

export interface PreparedImage {
  id: string;
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
}

interface UploadZoneProps {
  noteImages: PreparedImage[];
  setNoteImages: React.Dispatch<React.SetStateAction<PreparedImage[]>>;
  pastImages: PreparedImage[];
  setPastImages: React.Dispatch<React.SetStateAction<PreparedImage[]>>;
  disabled?: boolean;
}

export function UploadZone({
  noteImages,
  setNoteImages,
  pastImages,
  setPastImages,
  disabled = false,
}: UploadZoneProps) {
  const noteInputRef = useRef<HTMLInputElement>(null);
  const pastInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const processFiles = async (files: FileList | File[], isPastQuestion: boolean) => {
    setIsProcessing(true);
    const newItems: PreparedImage[] = [];

    const currentCount = isPastQuestion ? pastImages.length : noteImages.length;
    const maxCount = isPastQuestion ? 2 : 4;
    const availableSlots = maxCount - currentCount;

    const fileArray = Array.from(files).slice(0, availableSlots);

    for (const rawFile of fileArray) {
      if (!rawFile.type.startsWith("image/")) continue;

      const originalSize = rawFile.size;
      // Client-side resize to <= 1024px max dimension
      const resized = await resizeImage(rawFile, 1024, 0.85);
      const previewUrl = URL.createObjectURL(resized);

      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file: resized,
        previewUrl,
        originalSize,
        compressedSize: resized.size,
      });
    }

    if (isPastQuestion) {
      setPastImages((prev) => [...prev, ...newItems].slice(0, 2));
    } else {
      setNoteImages((prev) => [...prev, ...newItems].slice(0, 4));
    }

    setIsProcessing(false);
  };

  const removeNoteImage = (id: string) => {
    setNoteImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const removePastImage = (id: string) => {
    setPastImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files, false);
    }
  };

  const formatKB = (bytes: number) => {
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Main Lecture Notes Section */}
      <div className="glass-panel rounded-2xl p-5 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
              1
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                Handwritten Lecture Notes
                <span className="text-xs text-rose-400 font-normal">*Required</span>
              </h3>
              <p className="text-xs text-slate-400">
                Upload 1 to 4 clear photos of notebook pages or board slides
              </p>
            </div>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
            {noteImages.length}/4
          </span>
        </div>

        {/* Hidden File Input */}
        <input
          ref={noteInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={disabled || isProcessing || noteImages.length >= 4}
          onChange={(e) => {
            if (e.target.files) processFiles(e.target.files, false);
            e.target.value = "";
          }}
        />

        {/* Upload Dropzone / Button */}
        {noteImages.length < 4 && (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => noteInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-indigo-400 bg-indigo-500/10 scale-[1.01]"
                : "border-white/15 hover:border-indigo-500/50 hover:bg-white/[0.02]"
            } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-200">
                Tap to snap camera or select notes
              </p>
              <p className="text-xs text-slate-400">
                Auto-resized to ~1024px client-side to save bandwidth & quota
              </p>
            </div>
          </div>
        )}

        {/* Note Thumbnails */}
        {noteImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {noteImages.map((img, index) => (
              <div
                key={img.id}
                className="relative group rounded-xl overflow-hidden border border-white/10 bg-slate-900/80 aspect-[3/4] flex flex-col"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt={`Note page ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white border border-white/10">
                  Page {index + 1}
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNoteImage(img.id);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-rose-500/80 hover:bg-rose-600 text-white shadow-lg transition-transform hover:scale-110"
                    title="Remove page"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="absolute bottom-2 left-2 right-2 text-[10px] text-slate-300 flex justify-between">
                  <span>{formatKB(img.compressedSize)}</span>
                  <span className="text-emerald-400 font-medium">Ready</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Optional Past-Question Slot */}
      <div className="glass-panel rounded-2xl p-5 border border-purple-500/20 bg-purple-950/10 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/30">
              2
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                Past Question Paper
                <span className="text-[11px] text-purple-300 font-normal px-1.5 py-0.2 rounded bg-purple-500/20 border border-purple-500/30">
                  Exam Focus Mode
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Optional: Upload 1-2 photos of past term exams. AI will prioritize matching topics!
              </p>
            </div>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
            {pastImages.length}/2
          </span>
        </div>

        {/* Hidden Past File Input */}
        <input
          ref={pastInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={disabled || isProcessing || pastImages.length >= 2}
          onChange={(e) => {
            if (e.target.files) processFiles(e.target.files, true);
            e.target.value = "";
          }}
        />

        {pastImages.length < 2 && (
          <div
            onClick={() => pastInputRef.current?.click()}
            className={`border border-dashed border-purple-500/30 hover:border-purple-400 rounded-xl p-4 text-center cursor-pointer transition-all bg-purple-500/5 hover:bg-purple-500/10 ${
              disabled ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-purple-300 text-xs font-medium">
              <Upload className="w-4 h-4" />
              <span>+ Add Past-Question Paper (1-2 pages)</span>
            </div>
          </div>
        )}

        {/* Past Question Thumbnails */}
        {pastImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            {pastImages.map((img, index) => (
              <div
                key={img.id}
                className="relative group rounded-xl overflow-hidden border border-purple-500/30 bg-slate-900/80 aspect-[3/4] flex flex-col"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt={`Past paper ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-purple-900/80 backdrop-blur-sm text-[10px] font-bold text-purple-200 border border-purple-500/40">
                  Paper #{index + 1}
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePastImage(img.id);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-rose-500/80 hover:bg-rose-600 text-white shadow-lg transition-transform hover:scale-110"
                    title="Remove paper"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="absolute bottom-2 left-2 right-2 text-[10px] text-slate-300 flex justify-between">
                  <span>{formatKB(img.compressedSize)}</span>
                  <span className="text-purple-300 font-medium">Prioritized</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
