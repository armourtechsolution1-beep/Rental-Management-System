"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone, type Accept, type FileRejection } from "react-dropzone";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FileUploadStatus = "idle" | "uploading" | "success" | "error";

export interface UploadableFile {
  id: string;
  file: File;
  /** Object URL for image previews. Undefined for non-image files. Revoked
   * automatically on removal and on unmount. */
  previewUrl?: string;
  status: FileUploadStatus;
  /** 0–100. Only meaningful while status is "uploading". */
  progress: number;
  error?: string;
  /** Set once `onUpload` resolves successfully. */
  url?: string;
}

export interface FileUploaderProps {
  /**
   * react-dropzone's accept map, e.g. `{ "image/*": [], "application/pdf": [] }`.
   * Defaults to images + PDF, matching the two spec'd use cases: receipt
   * uploads (JPEG/PNG/PDF) and maintenance ticket photos (images only —
   * pass `{ "image/*": [] }` explicitly for that case).
   */
  accept?: Accept;
  /** Default 1 — single-file mode (e.g. a payment receipt) replaces the
   * existing file on a new drop rather than appending. */
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
  label?: string;
  /** Helper text under the dropzone. Auto-generated from maxFiles/maxSizeMB when omitted. */
  description?: string;

  /** Controlled file list — omit to let FileUploader manage its own state. */
  files?: UploadableFile[];
  onFilesChange?: (files: UploadableFile[]) => void;

  /**
   * Actual upload implementation — wire this to Supabase Storage, an API
   * route, etc. Called once per newly added file; report progress via the
   * second argument. If omitted, files are added to the list in "idle"
   * status and it's the caller's responsibility to upload them (e.g. on
   * final form submit inside a MultiStepForm step) rather than immediately
   * on selection.
   */
  onUpload?: (file: File, onProgress: (percent: number) => void) => Promise<string>;

  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** exponent;
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}

export function FileUploader({
  accept = { "image/*": [], "application/pdf": [] },
  maxFiles = 1,
  maxSizeMB = 5,
  disabled = false,
  label,
  description,
  files: controlledFiles,
  onFilesChange,
  onUpload,
  className,
}: FileUploaderProps) {
  const [internalFiles, setInternalFiles] = useState<UploadableFile[]>([]);
  const [rejectionMessages, setRejectionMessages] = useState<string[]>([]);
  const files = controlledFiles ?? internalFiles;

  /**
   * Always resolves against the latest state via React's functional setState
   * form (rather than a closed-over `files` variable) — this component can
   * fire several updateFile() calls in quick succession as multiple files
   * upload concurrently, and resolving against a stale snapshot would drop
   * updates. In controlled mode, the parent's `files` prop is the base for
   * each resolution instead of internal state.
   */
  const setFiles = useCallback(
    (updater: UploadableFile[] | ((prev: UploadableFile[]) => UploadableFile[])) => {
      setInternalFiles((prevInternal) => {
        const base = controlledFiles ?? prevInternal;
        const resolved = typeof updater === "function" ? updater(base) : updater;
        onFilesChange?.(resolved);
        return resolved;
      });
    },
    [controlledFiles, onFilesChange]
  );

  const updateFile = useCallback(
    (id: string, patch: Partial<UploadableFile>) => {
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    },
    [setFiles]
  );

  const startUpload = useCallback(
    async (entry: UploadableFile) => {
      if (!onUpload) return;
      updateFile(entry.id, { status: "uploading", progress: 0, error: undefined });
      try {
        const url = await onUpload(entry.file, (percent) =>
          updateFile(entry.id, { progress: percent })
        );
        updateFile(entry.id, { status: "success", progress: 100, url });
      } catch (err) {
        updateFile(entry.id, {
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }
    },
    [onUpload, updateFile]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (disabled) return;

      const remainingSlots = maxFiles === 1 ? 1 : Math.max(maxFiles - files.length, 0);
      const usable = acceptedFiles.slice(0, remainingSlots);
      const overflow = acceptedFiles.slice(usable.length);

      const messages = [
        ...fileRejections.map(
          (r) => `${r.file.name}: ${r.errors[0]?.message ?? "File rejected"}`
        ),
        ...overflow.map(
          (f) =>
            `${f.name}: maximum of ${maxFiles} file${maxFiles === 1 ? "" : "s"} reached`
        ),
      ];
      setRejectionMessages(messages);

      if (!usable.length) return;

      const newEntries: UploadableFile[] = usable.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
        status: "idle",
        progress: 0,
      }));

      setFiles((prev) => {
        if (maxFiles === 1) {
          prev.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
          return newEntries;
        }
        return [...prev, ...newEntries];
      });

      if (onUpload) {
        newEntries.forEach((entry) => startUpload(entry));
      }
    },
    [disabled, files.length, maxFiles, onUpload, setFiles, startUpload]
  );

  const removeFile = useCallback(
    (id: string) => {
      const target = files.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      setRejectionMessages([]);
    },
    [files, setFiles]
  );

  // Revoke any remaining preview URLs on unmount only — intentionally
  // excludes `files` from deps so it doesn't fire on every add/remove.
  useEffect(() => {
    return () => {
      files.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFull = files.length >= maxFiles;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: maxFiles > 1,
    disabled: disabled || isFull,
    onDrop,
  });

  const resolvedDescription =
    description ??
    `Up to ${maxFiles} file${maxFiles > 1 ? "s" : ""}, ${maxSizeMB}MB each`;

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}

      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-border",
          disabled || isFull
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:bg-muted/40"
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud
          className="h-8 w-8 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-foreground">
          {isFull
            ? "Maximum files reached"
            : isDragActive
              ? "Drop files here"
              : "Drag & drop, or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground">{resolvedDescription}</p>
      </div>

      {rejectionMessages.length > 0 && (
        <ul className="space-y-1">
          {rejectionMessages.map((msg, i) => (
            <li
              key={i}
              className="flex items-center gap-1.5 text-xs text-destructive"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {msg}
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f) => (
            <FileUploaderItem
              key={f.id}
              entry={f}
              onRemove={() => removeFile(f.id)}
              onRetry={onUpload ? () => startUpload(f) : undefined}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function FileUploaderItem({
  entry,
  onRemove,
  onRetry,
}: {
  entry: UploadableFile;
  onRemove: () => void;
  onRetry?: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-lg border p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
        {entry.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not an optimizable remote image
          <img
            src={entry.previewUrl}
            alt={entry.file.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <FileText className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {entry.file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(entry.file.size)}
        </p>
        {entry.status === "uploading" && (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${entry.progress}%` }}
            />
          </div>
        )}
        {entry.status === "error" && (
          <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
            {entry.error ?? "Upload failed"}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {entry.status === "uploading" && (
          <Loader2
            className="h-4 w-4 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        )}
        {entry.status === "success" && (
          <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
        )}
        {entry.status === "error" && onRetry && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onRetry}
          >
            Retry
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onRemove}
          aria-label={`Remove ${entry.file.name}`}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}
