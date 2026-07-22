import React, { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reusable, responsive confirmation dialog used in place of the native
 * `window.confirm` / `alert` popups for destructive actions (e.g. deleting
 * departments, sub-departments, categories, keywords, etc).
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) => {
  // Allow closing the dialog with the Escape key for accessibility/convenience.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="min-w-0">
            <h2
              id="confirm-dialog-title"
              className="text-sm sm:text-base font-bold text-zinc-900 break-words"
            >
              {title}
            </h2>
            <p
              id="confirm-dialog-message"
              className="text-xs sm:text-sm text-zinc-500 mt-1.5 break-words"
            >
              {message}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-5 sm:mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto text-xs font-semibold text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50 px-4 py-2.5 rounded-lg cursor-pointer transition-all"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-all"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
