import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  accentClass?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`bg-stone-900 border-2 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-stone-600`}>
        <div className={`flex justify-between items-center p-4 border-b border-stone-700 bg-stone-950`}>
          <h3 className={`text-xl font-cinzel font-bold text-stone-200 tracking-wide`}>{title}</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 bg-stone-900 max-h-[85vh] overflow-y-auto custom-scrollbar text-stone-300">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
