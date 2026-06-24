// helper para combinar clases de css con clases condicionales, usando valores falsy
// uso: cn(styles.base, isActive && styles.active, className)
export const cn = (...classes: (string | undefined | null | false)[]): string => {
    return classes.filter(Boolean).join(' ');
};