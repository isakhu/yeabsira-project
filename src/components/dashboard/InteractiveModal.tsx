"use client";

import { ReactNode } from "react";

interface InteractiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function InteractiveModal({ isOpen, onClose, title, children }: InteractiveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-700 pb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-plus-circle text-brand-gold"></i>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
