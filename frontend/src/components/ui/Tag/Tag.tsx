import { cn } from '@/utils/cn';
import styles from './Tag.module.css';

interface TagProps {
    label: string;
    color?: string; 
    variant?: 'default' | 'tertiary' | 'primary' | 'surface';
    onClick?: () => void;
    className?: string;
}

export const Tag = ({
    label,
    color,
    variant = 'default',
    onClick,
    className,
}: TagProps) => {
    // si viene un color custom, lo usa con fondo semitransparente
    const customStyle = color
        ? {
            backgroundColor: `${color}22`, // hex con 13% opacidad
            color: color,
            borderColor: `${color}44`,
        }
        : undefined;

    return (
        <span
            className={cn(
                styles.tag,
                !color && styles[variant],  // solo aplica variante si no hay color custom
                color && styles.custom,
                onClick && styles.clickable,
                className
            )}
            style={customStyle}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {color && <span className={styles.colorDot} style={{ backgroundColor: color }} />}
            {label}
        </span>
    );
};