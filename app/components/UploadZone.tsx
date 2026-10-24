"use client";

import { useRef, useState } from "react";
import { Camera, FileText, X } from "lucide-react";
import { resizeImage } from "@/lib/image";
import { renderPdfPages } from "@/lib/pdf";

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
  disabled?: boolean;
}

export function UploadZone({
  noteImages,
  setNoteImages,
  disabled = false,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const processFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    const newItems: PreparedImage[] = [];

    for (const rawFile of Array.from(files)) {
      if (!rawFile.type.startsWith("image/") && rawFile.type !== "application/pdf") {
        continue;
      }

      const sourceFiles = rawFile.type === "application/pdf"
        ? await renderPdfPages(rawFile)
        : [rawFile];

      for (const sourceFile of sourceFiles) {
        const file = sourceFile.type === "application/pdf"
          ? sourceFile
          : await resizeImage(sourceFile, 1024, 0.85);
        newItems.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
          originalSize: rawFile.size,
          compressedSize: file.size,
        });
      }
    }

    setNoteImages((previous) => [...previous, ...newItems]);
    setIsProcessing(false);
  };

  const removeImage = (id: string) => {
    setNoteImages((previous) => {
      const target = previous.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return previous.filter((image) => image.id !== id);
    });
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    if (event.dataTransfer.files.length > 0) {
      void processFiles(event.dataTransfer.files);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/10 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
            1
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Upload your notes or questions
              <span className="text-xs text-rose-400 font-normal ml-2">*Required</span>
            </h3>
            <p className="text-xs text-slate-400">
              Add images or PDF files. Every PDF page will be included in the analysis.
            </p>
          </div>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
          {noteImages.length} page{noteImages.length === 1 ? "" : "s"}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,application/pdf"
        multiple
        className="hidden"
        disabled={disabled || isProcessing}
        onChange={(event) => {
          if (event.target.files) void processFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {!isProcessing && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-colors ${
            dragActive
              ? "border-indigo-400 bg-indigo-500/10"
              : "border-white/15 hover:border-indigo-500/50 hover:bg-white/[0.02]"
          } ${disabled || isProcessing ? "opacity-50 pointer-events-none" : ""}`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-200">
              Tap to choose files or take a photo
            </p>
            <p className="text-xs text-slate-400">
              JPG, PNG, WEBP, or PDF · PDF pages are rendered before analysis
            </p>
          </div>
        </div>
      )}

      {noteImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {noteImages.map((image, index) => {
            const isPdf = image.file.type === "application/pdf";
            return (
              <div
                key={image.id}
                className="relative group rounded-xl overflow-hidden border border-white/10 bg-slate-900/80 aspect-[3/4] flex flex-col"
              >
                {isPdf ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-white bg-slate-800">
                    <FileText className="w-8 h-8" />
                    <span className="text-xs px-2 text-center break-all">{image.file.name}</span>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.previewUrl} alt={`Uploaded page ${index + 1}`} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white">
                  {isPdf ? "PDF" : `Page ${index + 1}`}
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-rose-500/80 text-white"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="absolute bottom-2 left-2 right-2 text-[10px] text-white flex justify-between">
                  <span>{Math.round(image.compressedSize / 1024)} KB</span>
                  <span className="font-medium">Ready</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
