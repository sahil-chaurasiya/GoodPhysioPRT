import React from 'react';
import { X } from 'lucide-react';

// Renders as a centered dialog on desktop, and a bottom sheet on mobile —
// matches the "scrollable bottom-sheet modal" pattern from the reference screens.
export default function Modal({ open, onClose, title, children, footer, maxWidth = 'max-w-md' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-t-3xl sm:rounded-2xl shadow-pop max-h-[88vh] flex flex-col animate-[slideUp_0.2s_ease-out]`}
      >
        <div className="sm:hidden mx-auto mt-2 h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 space-y-4">{children}</div>
        {footer && <div className="flex gap-3 border-t border-slate-100 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
