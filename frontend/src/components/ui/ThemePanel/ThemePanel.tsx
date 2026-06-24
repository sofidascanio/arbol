import { useRef, useEffect } from 'react';
import { useTheme, THEMES, ThemeId, ThemeDefinition } from '@/context/ThemeContext';
import { cn } from '@/utils/cn';
import styles from './ThemePanel.module.css';

// colores de acento predefinidos 
const ACCENT_PRESETS = [
    { color: '#2563eb', label: 'Azul' },
    { color: '#7c3aed', label: 'Violeta' },
    { color: '#db2777', label: 'Rosa' },
    { color: '#dc2626', label: 'Rojo' },
    { color: '#ea580c', label: 'Naranja' },
    { color: '#16a34a', label: 'Verde' },
    { color: '#0891b2', label: 'Cian' },
];

// vista previa de un tema 
const ThemePreview = ({
    definition,
    isActive,
    onClick,
}: {
    definition: ThemeDefinition;
    isActive: boolean;
    onClick: () => void;
}) => {
    const { bg, surface, primary, text } = definition.preview;

    return (
        <button className={styles.themeOption} onClick={onClick}>
            <div className={cn(styles.themePreview, isActive && styles.themePreviewActive)}>
                <div className={styles.themePreviewBg} style={{ backgroundColor: bg }}>
                    {/* topbar simulada */}
                    <div className={styles.themePreviewTopbar} style={{ backgroundColor: surface }}>
                        <div className={styles.themePreviewDot} style={{ backgroundColor: primary }}/>
                        <div className={styles.themePreviewDot} style={{ backgroundColor: text, opacity: 0.3 }}/>
                    </div>

                    {/* cuerpo simulado */}
                    <div className={styles.themePreviewBody}>
                        {/* sidebar */}
                        <div className={styles.themePreviewSidebar} style={{ backgroundColor: surface }}/>
                        {/* contenido con tarjetas */}
                        <div className={styles.themePreviewContent}>
                            <div className={styles.themePreviewCard} style={{ backgroundColor: surface }}/>
                            <div className={styles.themePreviewCard} style={{ backgroundColor: surface, opacity: 0.6 }}/>
                        </div>
                    </div>
                </div>

                {/* checkmark cuando esta activo */}
                {isActive && (
                    <div className={styles.themeCheckmark}>
                        <span className="material-symbols-outlined" style={{ fontSize: 10 }}>
                        check
                        </span>
                    </div>
                )}
            </div>

            <span className={cn(styles.themeLabel, isActive && styles.themeLabelActive)}>
                {definition.label}
            </span>
        </button>
    );
};

export const ThemePanel = () => {
    const {
        theme,
        themeDefinition,
        setTheme,
        toggleDark,
        accentColor,
        setAccentColor,
        isPanelOpen,
        closePanel,
    } = useTheme();

    const panelRef = useRef<HTMLDivElement>(null);

    // cerrar al hacer click fuera
    useEffect(() => {
        if (!isPanelOpen) return;

        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                closePanel();
            }
        };

        // pequeño delay para no cerrar inmediatamente al abrir
        const timeout = setTimeout(() => {
            document.addEventListener('mousedown', handler);
        }, 100);

        return () => {
            clearTimeout(timeout);
            document.removeEventListener('mousedown', handler);
        };
    }, [isPanelOpen, closePanel]);

    // cerrar con escape
    useEffect(() => {
        if (!isPanelOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closePanel();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isPanelOpen, closePanel]);

    if (!isPanelOpen) return null;

    const handleReset = () => {
        setTheme('light');
        setAccentColor(null);
    };

    return (
        <>
        {/* overlay invisible para cerrar al hacer click fuera */}
        <div className={styles.overlay} onClick={closePanel} />

        <div ref={panelRef} className={styles.panel} role="dialog" aria-label="Panel de temas">
            {/* cabecera */}
            <div className={styles.panelHeader}>
                <span className={styles.panelTitle}>Personalización</span>
                <button className={styles.closeBtn} onClick={closePanel} aria-label="Cerrar">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    close
                    </span>
                </button>
            </div>

            {/* seccion: Dark mode toggle  */}
            <div className={styles.section}>
                <div className={styles.toggleRow}>
                    <span className={styles.toggleLabel}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                            {themeDefinition.isDark ? 'dark_mode' : 'light_mode'}
                        </span>
                        Modo oscuro
                    </span>
                    <label className={styles.toggle}>
                        <input type="checkbox"
                            className={styles.toggleInput}
                            checked={themeDefinition.isDark}
                            onChange={toggleDark}/>
                        <span className={styles.toggleTrack} />
                        <span className={styles.toggleThumb} />
                    </label>
                </div>
            </div>

            {/* seccion: seleccion de tema  */}
            <div className={styles.section}>
                <span className={styles.sectionLabel}>Tema</span>
                <div className={styles.themesGrid}>
                    {THEMES.map(def => (
                        <ThemePreview
                            key={def.id}
                            definition={def}
                            isActive={theme === def.id && !accentColor}
                            onClick={() => setTheme(def.id as ThemeId)}
                        />
                    ))}
                </div>
            </div>

            {/* seccion: color de acento  */}
            <div className={styles.section}>
                <span className={styles.sectionLabel}>Color de acento</span>
                <div className={styles.accentRow}>
                    {/* reset */}
                    <button
                        className={styles.accentReset}
                        onClick={() => setAccentColor(null)}
                        title="Sin acento personalizado"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            block
                        </span>
                    </button>

                    {/* presets */}
                    {ACCENT_PRESETS.map(preset => (
                        <button
                            key={preset.color}
                            className={cn(
                                styles.accentSwatch,
                                accentColor === preset.color && styles.accentSwatchActive
                            )}
                            style={{ backgroundColor: preset.color }}
                            onClick={() => setAccentColor(preset.color)}
                            title={preset.label}
                            aria-label={`Acento ${preset.label}`}
                        />
                    ))}

                    {/* Color personalizado */}
                    <label className={styles.accentCustom} title="Color personalizado">
                        <input
                            type="color"
                            className={styles.accentCustomInput}
                            value={accentColor ?? '#21201a'}
                            onChange={e => setAccentColor(e.target.value)}
                        />
                        <span className={styles.accentCustomLabel}>Custom</span>
                    </label>
                </div>
            </div>

            {/* footer del panel  */}
            <div className={styles.panelFooter}>
                <button className={styles.resetBtn} onClick={handleReset}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    refresh
                    </span>
                    Restablecer
                </button>
                <span className={styles.versionLabel}>v1.0.0</span>
            </div>
        </div>
        </>
    );
};