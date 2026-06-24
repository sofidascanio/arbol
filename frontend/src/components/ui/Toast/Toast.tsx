import { cn } from '@/utils/cn';
import { ToastItem } from './useToast';
import styles from './Toast.module.css';

const ICONS: Record<string, string> = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
};

interface ToastContainerProps {
    toasts: ToastItem[];
}

export const ToastContainer = ({ toasts }: ToastContainerProps) => {
    if (toasts.length === 0) return null;

    return (
        <div className={styles.container} role="status" aria-live="polite">
            {toasts.map(toast => (
                <div key={toast.id}
                    className={cn(styles.toast, styles[toast.type])}>
                    <span className={cn('material-symbols-outlined', styles.toastIcon)}>
                        {ICONS[toast.type]}
                    </span>
                    {toast.message}
                </div>
            ))}
        </div>
    );
};