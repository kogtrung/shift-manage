import React from "react"

/**
 * Modal overlay dùng chung.
 * - Bấm ngoài (backdrop) để đóng
 * - Nội dung modal chặn click để không đóng
 */
export function Modal({ open, onClose, children, maxWidthClass = "max-w-lg" }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-surface rounded-2xl shadow-2xl w-full mx-4 ${maxWidthClass} animate-[fadeIn_0.2s_ease-out]`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

