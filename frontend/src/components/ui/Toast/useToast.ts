import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

export const useToast = () => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const show = useCallback((message: string, type: ToastType = 'info') => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev, { id, message, type }]);

        // se va despues de 3 segundos
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const success = useCallback((msg: string) => show(msg, 'success'), [show]);
    const error = useCallback((msg: string) => show(msg, 'error'), [show]);
    const info = useCallback((msg: string) => show(msg, 'info'), [show]);

    return { toasts, show, success, error, info };
};