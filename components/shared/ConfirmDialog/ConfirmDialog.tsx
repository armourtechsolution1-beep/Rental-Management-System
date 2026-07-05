"use client";

import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "destructive" red-styles the confirm button — use for anything that
   * suspends, deletes, or otherwise can't be casually undone (matches the
   * suspend-user, remove-member, delete-property class of actions). */
  variant?: "default" | "destructive";
  /**
   * External loading control — pass a TanStack Query mutation's `isPending`
   * here so the dialog reflects real request state and the caller decides
   * when to close it (typically in the mutation's `onSuccess`). If omitted,
   * ConfirmDialog manages its own loading state around `onConfirm` instead.
   */
  isLoading?: boolean;
  /** May return a Promise. If it does, and `isLoading` isn't externally
   * controlled, the dialog shows its own spinner until it resolves/rejects. */
  onConfirm: () => void | Promise<void>;
  disableConfirm?: boolean;
  className?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading,
  onConfirm,
  disableConfirm = false,
  className,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isControlled = isLoading !== undefined;
  const loading = isControlled ? isLoading : internalLoading;

  const handleConfirm = async () => {
    if (isControlled) {
      // Caller owns loading state (e.g. mutation.isPending) — just fire and
      // let them close the dialog from onSuccess/onSettled.
      onConfirm();
      return;
    }
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  // Block dismissal (Escape, outside click, header close) while a confirm
  // is in flight — an in-progress destructive action shouldn't be
  // interruptible by an accidental click outside the dialog.
  const handleOpenChange = (next: boolean) => {
    if (loading) return;
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={className}
        onInteractOutside={(e) => {
          if (loading) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading || disableConfirm}
          >
            {loading && (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
