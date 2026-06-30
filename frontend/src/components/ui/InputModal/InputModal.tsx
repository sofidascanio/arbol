import { useState, useEffect, KeyboardEvent } from 'react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { cn } from '@/utils/cn';
import styles from './InputModal.module.css';

interface InputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (value: string, extra?: string) => Promise<void> | void;
    title: string;
    subtitle?: string;
    icon?: string;
    label: string;
    placeholder: string;
    description?: string;
    confirmLabel?: string;
    // para el preview
    previewIcon?: string;
    // para carpetas, mostrar carpeta padre
    parentName?: string;
    // para etiquetas, mostrar selector de color
    showColorPicker?: boolean;
    initialValue?: string;
    initialColor?: string; 
}



export const InputModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    subtitle,
    icon = 'edit',
    label,
    placeholder,
    description,
    confirmLabel = 'Confirmar',
    previewIcon,
    parentName,
    showColorPicker = false,
    initialValue = '', 
    initialColor,       
}: InputModalProps) => {
    const [value, setValue] = useState('');
    const [selectedColor, setSelectedColor] = useState('#60a5fa');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // limpia al abrir
    useEffect(() => {
        if (isOpen) {
            setValue(initialValue);
            setError('');
            setSelectedColor(initialColor ?? '#60a5fa');
        }
    }, [isOpen, initialValue, initialColor]);

    const handleConfirm = async () => {
        if (!value.trim()) {
            setError(`El campo no puede estar vacío`);
            return;
        }
        if (value.trim().length > 100) {
            setError('Máximo 100 caracteres');
            return;
        }

        setIsSubmitting(true);
        try {
            await onConfirm(value.trim(), showColorPicker ? selectedColor : undefined);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocurrió un error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleConfirm();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            subtitle={subtitle}
            icon={icon}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        isLoading={isSubmitting}
                        leftIcon={
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                            check
                        </span>
                        }
                    >
                        {confirmLabel}
                    </Button>
                </>
            }
        >   
            <div className={styles.body}>
                {/* descripcion opcional */}
                {description && (
                    <p className={styles.description}>{description}</p>
                )}

                {/* carpeta padre, solo para subcarpetas */}
                {parentName && (
                    <div className={styles.parentInfo}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        folder
                        </span>
                        Dentro de: {parentName}
                    </div>
                )}

                {/* Input */}
                <div className={styles.inputWrapper}>
                    <label className={styles.label}>{label}</label>
                    <input
                        className={styles.input}
                        type="text"
                        placeholder={placeholder}
                        value={value}
                        onChange={e => {
                            setValue(e.target.value);
                            setError('');
                        }}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        maxLength={100}
                    />
                    {error && <span className={styles.error}>{error}</span>}
                </div>

                {/* selector de color para etiquetas */}
                {showColorPicker && (
                <div className={styles.colorRow}>
                    <label className={styles.label}>Color</label>
                    <div className={styles.colorPickerRow}>
                        <div className={styles.colorSwatchWrapper}>
                            <div
                                className={styles.colorPreviewSwatch}
                                style={{ backgroundColor: selectedColor }}
                            />
                            <input
                                type="color"
                                className={styles.colorInput}
                                value={selectedColor}
                                onChange={e => setSelectedColor(e.target.value)}
                                aria-label="Seleccionar color"
                            />
                        </div>
                        <span className={styles.colorHex}>{selectedColor.toUpperCase()}</span>
                    </div>
                </div>
                )}

                {/* Preview */}
                <div className={styles.preview}>
                    {previewIcon && (
                        <span
                            className={cn('material-symbols-outlined', styles.previewIcon)}
                            style={showColorPicker ? { color: selectedColor } : undefined}
                        >
                        {previewIcon}
                        </span>
                    )}
                    {showColorPicker && value && (
                        <span
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                backgroundColor: selectedColor,
                                flexShrink: 0,
                            }}
                        />
                    )}
                    <span
                        className={cn(
                            styles.previewLabel,
                            !value.trim() && styles.previewLabelEmpty
                        )}
                    >
                        {value.trim() || placeholder}
                    </span>
                </div>
            </div>
        </Modal>
    );
};