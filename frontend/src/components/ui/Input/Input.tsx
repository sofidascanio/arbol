import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import { cn } from '@/utils/cn';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, leftIcon, className, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className={cn(styles.wrapper, error && styles.error)}>
                {label && (
                    <label className={styles.label} htmlFor={inputId}>
                        {label}
                    </label>
                )}
                <div className={styles.inputWrapper}>
                    {leftIcon && (
                        <span className={styles.leftIcon}>{leftIcon}</span>
                    )}
                    <input ref={ref}
                            id={inputId}
                            className={cn(
                                styles.input,
                                !!leftIcon && styles.hasLeftIcon,
                                className
                            )}
                            {...props}/>
                </div>
                {error && (
                    <span className={styles.errorMessage}>{error}</span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';