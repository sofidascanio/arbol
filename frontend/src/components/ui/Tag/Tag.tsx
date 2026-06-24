import { cn } from '@/utils/cn';
import styles from './Tag.module.css';

    interface TagProps {
    label: string;
    variant?: 'default' | 'tertiary' | 'primary' | 'surface';
    onClick?: () => void;
    className?: string;
}

export const Tag = ({
    label,
    variant = 'default',
    onClick,
    className,
}: TagProps) => {
    return (
        <span className={cn(
                styles.tag,
                styles[variant],
                onClick && styles.clickable,
                className
            )}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            >
            {label}
        </span>
    );
};