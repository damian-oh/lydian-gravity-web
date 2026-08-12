"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

type ConfirmDialogProps = Readonly<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}>;

/**
 * Confirmation modal built on the native <dialog> element. showModal() puts
 * the dialog in the browser top layer, which escapes the app shell's
 * backdrop-blur containing block (position: fixed would render inside the
 * shell card instead of over the viewport) and gives us Esc handling and
 * focus containment for free.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      // Esc raises "cancel" then "close"; both funnel to onCancel so the
      // controlling component's `open` state stays in sync with the DOM.
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClose={() => {
        if (open) {
          onCancel();
        }
      }}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-[1.75rem] border border-highlight/80 bg-surface p-6 text-foreground shadow-[0_36px_90px_-50px_rgba(15,23,42,0.6)] backdrop:bg-slate-950/45 backdrop:backdrop-blur-sm"
    >
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">{message}</p>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-highlight/80 bg-surface px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/72 transition hover:bg-accent-soft focus:outline-none focus:ring-4 focus:ring-accent/20"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={cn(
            "rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition focus:outline-none focus:ring-4",
            destructive
              ? "border border-rose-500/25 bg-rose-500/10 text-rose-950 hover:brightness-95 focus:ring-rose-500/20 dark:text-rose-100"
              : "bg-accent text-slate-950 hover:brightness-105 focus:ring-accent/25",
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
