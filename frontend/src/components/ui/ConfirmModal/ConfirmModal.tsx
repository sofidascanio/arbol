import { useState } from 'react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    title: string;
    message: string;
    warning?: string;
    confirmLabel?: string;
    icon?: string;
}

export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    warning,
    confirmLabel = 'Eliminar',
    icon = 'warning',
}: ConfirmModalProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm();
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            icon={icon}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirm}
                        isLoading={isSubmitting}
                        leftIcon={
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                delete
                            </span>
                        }
                    >
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            <div className={styles.body}>
                <p className={styles.message}>{message}</p>
                {warning && (
                    <div className={styles.warningBox}>
                        <span className={`material-symbols-outlined ${styles.warningIcon}`}>
                        info
                        </span>
                        {warning}
                    </div>
                )}
            </div>
        </Modal>
    );
};