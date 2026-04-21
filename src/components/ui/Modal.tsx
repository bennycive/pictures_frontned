import React from 'react';
import { X } from 'lucide-react';
import { Logo } from './Logo';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  branded?: boolean;
}

export function Modal({ open, onClose, title, children, size = 'md', branded = false }: ModalProps) {
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[90vh] flex flex-col`}>
        {/* Header — always visible, never scrolls */}
        {branded ? (
          <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-6 py-4 rounded-t-2xl shrink-0">
            <div className="flex items-center justify-between mb-2">
              <Logo variant="light" className="h-5 w-auto" />
              <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-white font-semibold text-sm">{title}</p>
          </div>
        ) : (
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-earth-100 shrink-0">
            {title ? <h2 className="text-lg font-semibold text-earth-900">{title}</h2> : <span />}
            <button onClick={onClose} className="p-1 hover:bg-earth-100 rounded-lg transition-colors">
              <X size={20} className="text-earth-500" />
            </button>
          </div>
        )}

        {/* Body — only this part scrolls, invisibly */}
        <div className="p-6 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
