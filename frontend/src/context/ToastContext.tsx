import { createContext, useContext, ReactNode } from 'react';
import { useToast, ToastType } from '@/components/ui/Toast/useToast';
import { ToastContainer } from '@/components/ui/Toast/Toast';

interface ToastContextType {
    show: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const toast = useToast();

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toast.toasts} />
        </ToastContext.Provider>
    );
};

export const useToastContext = (): ToastContextType => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToastContext debe usarse dentro de ToastProvider');
    return ctx;
};