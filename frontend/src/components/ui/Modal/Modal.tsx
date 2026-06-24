import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import styles from './Modal.module.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    icon?: string;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}

export const Modal = ({
    isOpen,
    onClose,
    title,
    subtitle,
    icon = 'add_link',
    children,
    footer,
    className,
}: ModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // cerrar con escape
    useEffect(() => {
        if (!isOpen) return;

        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handler);
        // bloquea scroll del body
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // focus trap basico: enfoca el modal al abrir
    useEffect(() => {
        if (isOpen) {
            modalRef.current?.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className={styles.overlay}
                onClick={e => {
                    if (e.target === e.currentTarget) onClose();
                }}
                role="dialog"
                aria-modal="true"
                aria-label={title}>
            <div ref={modalRef}
                className={cn(styles.modal, className)}
                tabIndex={-1}
                onClick={e => e.stopPropagation()}
            >
                {/* cabecera  */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>
                            <span className="material-symbols-outlined">{icon}</span>
                        </div>
                        <div>
                            <h2 className={styles.headerTitle}>{title}</h2>
                            {subtitle && (
                                <p className={styles.headerSub}>{subtitle}</p>
                            )}
                        </div>
                    </div>
                    <button className={styles.closeBtn}
                            onClick={onClose}
                            aria-label="Cerrar">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* cuerpo  */}
                <div className={styles.body}>{children}</div>

                {/* footer */}
                {footer && <div className={styles.footer}>{footer}</div>}
            </div>
        </div>,
        document.body
    );
};