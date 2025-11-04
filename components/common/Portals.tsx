import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon, WarningIcon, CheckCircleIcon } from '../Icons';

// =================================================================
// Reusable Modal
// =================================================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  maxWidth?: string; // e.g., 'max-w-lg', 'max-w-3xl'
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, maxWidth = 'max-w-xl' }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const modalContent = (
      <div 
        className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex justify-center items-center p-4 animate-fadeIn"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div 
            className={`bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-2xl shadow-2xl w-full ${maxWidth} transform transition-all animate-fadeInUp`}
            onClick={(e) => e.stopPropagation()}
            role="document"
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-white/20">
            <h3 id="modal-title" className="text-xl font-bold">{title}</h3>
            <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition" aria-label="Cerrar modal">
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 max-h-[80vh] overflow-y-auto modal-content">
            {children}
          </div>
        </div>
      </div>
    );

    const portalRoot = document.getElementById('portal-root');
    return portalRoot ? createPortal(modalContent, portalRoot) : null;
};


// =================================================================
// Reusable ConfirmationModal
// =================================================================
interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const modalContent = (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-[70] flex justify-center items-center p-4 animate-fadeIn"
            onClick={onClose}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            aria-describedby="confirmation-message"
        >
            <div 
                className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg m-4 transform transition-all animate-fadeInUp text-center p-6 text-gray-900 dark:text-white"
                onClick={(e) => e.stopPropagation()}
                role="document"
            >
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50"><WarningIcon className="h-6 w-6 text-red-600 dark:text-red-300" /></div>
                <h3 id="confirmation-title" className="text-lg font-bold mt-4">{title}</h3>
                <p id="confirmation-message" className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>
                <div className="mt-6 flex justify-center gap-4">
                    <button onClick={onClose} className="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button onClick={() => { onConfirm(); onClose(); }} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Confirmar</button>
                </div>
            </div>
        </div>
    );
    
    const portalRoot = document.getElementById('portal-root');
    return portalRoot ? createPortal(modalContent, portalRoot) : null;
};


// =================================================================
// Reusable SuccessToast
// =================================================================
interface SuccessToastProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({ isOpen, onClose, title, message }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(onClose, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);
    
    if (!isOpen) return null;

    const toastContent = (
        <div className="success-toast-container animate-fadeInUp" role="alert" aria-live="assertive">
             <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-xl shadow-2xl p-4 flex items-start gap-4 text-gray-900 dark:text-white">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center"><CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-300" /></div>
                <div className="flex-grow">
                    <p className="font-bold">{title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
                </div>
                 <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" aria-label="Cerrar notificación">&times;</button>
            </div>
        </div>
    );

    const portalRoot = document.getElementById('portal-root');
    return portalRoot ? createPortal(toastContent, portalRoot) : null;
};