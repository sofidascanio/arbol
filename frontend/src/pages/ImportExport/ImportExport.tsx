import { useState, useRef, DragEvent, ChangeEvent, useCallback } from 'react';
import { importExportService, ImportResult, PreviewResult } from '@/services/importexport.service';
import { Button } from '@/components/ui/Button/Button';
import { cn } from '@/utils/cn';
import styles from './ImportExport.module.css';

// helper: tamaño de archivo legible 
const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const ImportExport = () => {
    // estado de exportacion
    const [isExporting, setIsExporting] = useState<'html' | 'json' | null>(null);

    // estado de importación
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [skipDuplicates, setSkipDuplicates] = useState(true);
    const [preview, setPreview] = useState<PreviewResult | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [importError, setImportError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // exportar 
    const handleExport = async (format: 'html' | 'json') => {
        setIsExporting(format);
        try {
            await importExportService.export(format);
        } catch {
            alert('Error al exportar los marcadores');
        } finally {
            setIsExporting(null);
        }
    };

    // seleccion de archivo 
    const handleFileSelect = useCallback(async (file: File) => {
        setSelectedFile(file);
        setImportResult(null);
        setImportError(null);
        setPreview(null);

        // previsualizar 
        setIsPreviewLoading(true);
        try {
            const result = await importExportService.preview(file);
            setPreview(result);
        } catch (err) {
            setImportError(
                err instanceof Error ? err.message : 'Error al leer el archivo'
            );
        } finally {
            setIsPreviewLoading(false);
        }
    }, []);

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    // drag & drop 
    const handleDragEnter = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    // importar 
    const handleImport = async () => {
        if (!selectedFile) return;

        setIsImporting(true);
        setImportError(null);

        try {
            const result = await importExportService.import(selectedFile, {
                skipDuplicates,
            });
            setImportResult(result);
            setSelectedFile(null);
            setPreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            setImportError(
                err instanceof Error ? err.message : 'Error al importar el archivo'
            );
        } finally {
            setIsImporting(false);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreview(null);
        setImportError(null);
        setImportResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className={styles.page}>
            {/* encabezado  */}
            <div className={styles.header}>
                <h1 className={styles.title}>Importar y exportar</h1>
                <p className={styles.subtitle}>
                    Move tus marcadores entre aplicaciones. Soportamos el formato Netscape HTML
                    estándar (compatible con Chrome, Firefox, Safari y Edge) y JSON.
                </p>
            </div>

            {/* exportar  */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionIcon}>
                        <span className="material-symbols-outlined">upload</span>
                    </div>
                    <div>
                        <div className={styles.sectionTitle}>Exportar marcadores</div>
                        <div className={styles.sectionSub}>
                        Descargá todos tus marcadores en el formato que prefieras
                        </div>
                    </div>
                </div>

                <div className={styles.sectionBody}>
                    <div className={styles.formatRow}>
                        {/* exportar html */}
                        <button
                            className={styles.formatCard}
                            onClick={() => handleExport('html')}
                            disabled={isExporting !== null}
                        >
                            <span className={cn('material-symbols-outlined', styles.formatCardIcon)}>
                                html
                            </span>
                            <div>
                                <div className={styles.formatCardTitle}>
                                    {isExporting === 'html' ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span className={styles.spinner} />
                                        Exportando...
                                        </span>
                                    ) : (
                                        'Netscape HTML'
                                    )}
                                </div>
                                <div className={styles.formatCardDesc}>
                                    Compatible con Chrome, Firefox, Safari y Edge.
                                    Mantiene la estructura de carpetas.
                                </div>
                            </div>
                            <span className={styles.formatCardBadge}>Recomendado</span>
                        </button>

                        {/* exportar json */}
                        <button
                            className={styles.formatCard}
                            onClick={() => handleExport('json')}
                            disabled={isExporting !== null}
                        >
                            <span className={cn('material-symbols-outlined', styles.formatCardIcon)}>
                                data_object
                            </span>
                            <div>
                                <div className={styles.formatCardTitle}>
                                    {isExporting === 'json' ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span className={styles.spinner} />
                                        Exportando...
                                        </span>
                                    ) : (
                                        'JSON'
                                    )}
                                </div>
                                <div className={styles.formatCardDesc}>
                                    Incluye descripciones y metadatos completos.
                                    Ideal para respaldos y procesamiento automatizado.
                                </div>
                            </div>
                            <span className={styles.formatCardBadge}>Con metadatos</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* importar  */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionIcon}>
                        <span className="material-symbols-outlined">download</span>
                    </div>
                    <div>
                        <div className={styles.sectionTitle}>Importar marcadores</div>
                        <div className={styles.sectionSub}>
                        Subi un archivo .html (Netscape) o .json para agregar marcadores
                        </div>
                    </div>
                </div>

                <div className={styles.sectionBody}>
                    {/* zona de drop */}
                    {!selectedFile ? (
                        <div
                            className={cn(
                                styles.dropZone,
                                isDragging && styles.dropZoneDragging
                            )}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".html,.htm,.json"
                                className={styles.dropZoneInput}
                                onChange={handleFileInputChange}
                                style={{ display: 'none' }}
                            />
                            <span className={cn('material-symbols-outlined', styles.dropZoneIcon)}>
                                {isDragging ? 'file_download' : 'upload_file'}
                            </span>
                            <div>
                                <div className={styles.dropZoneTitle}>
                                    {isDragging
                                        ? 'Solta el archivo aquí'
                                        : 'Arrastra tu archivo o hacé click para seleccionarlo'}
                                </div>
                                <div className={styles.dropZoneSub}>
                                    Exportaciones de Chrome, Firefox, Safari, Edge o JSON
                                </div>
                            </div>
                            <div className={styles.dropZoneFormats}>
                                <span className={styles.dropZoneFormat}>.HTML</span>
                                <span className={styles.dropZoneFormat}>.HTM</span>
                                <span className={styles.dropZoneFormat}>.JSON</span>
                            </div>
                        </div>
                    ) : (
                        /* archivo seleccionado */
                        <div className={styles.fileSelected}>
                            <div className={styles.fileIcon}>
                                <span className="material-symbols-outlined">
                                    {selectedFile.name.endsWith('.json')
                                        ? 'data_object'
                                        : 'html'}
                                </span>
                            </div>
                            <div className={styles.fileMeta}>
                                <div className={styles.fileName}>{selectedFile.name}</div>
                                <div className={styles.fileSize}>
                                    {formatBytes(selectedFile.size)}
                                </div>
                            </div>
                            <button
                                className={styles.fileRemoveBtn}
                                onClick={handleRemoveFile}
                                title="Quitar archivo"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                close
                                </span>
                            </button>
                        </div>
                    )}

                    {/* vista previa */}
                    {isPreviewLoading && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-sm)',
                            color: 'var(--on-surface-variant)',
                            fontSize: 'var(--font-size-body-md)',
                        }}>
                        <span className={styles.spinner} />
                            Analizando archivo...
                        </div>
                    )}

                    {preview && !isPreviewLoading && (
                        <div className={styles.preview}>
                            <div className={styles.previewHeader}>
                                <span className={styles.previewTitle}>
                                    Vista previa — {preview.total} marcadores encontrados
                                </span>
                                <div className={styles.previewStats}>
                                    <div className={styles.previewStat}>
                                        <span className={cn(styles.statDot, styles.statNew)} />
                                        <span>{preview.new} nuevos</span>
                                    </div>
                                    <div className={styles.previewStat}>
                                        <span className={cn(styles.statDot, styles.statDup)} />
                                        <span>{preview.duplicates} duplicados</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.previewList}>
                                {preview.sample.map((item, i) => (
                                    <div key={i} className={styles.previewItem}>
                                        <span className={cn('material-symbols-outlined', styles.previewItemIcon)}>
                                            {item.isDuplicate ? 'content_copy' : 'bookmark_add'}
                                        </span>
                                        <span className={styles.previewItemTitle}>{item.title}</span>
                                        {item.folder && (
                                            <span className={styles.previewItemFolder}>
                                                {item.folder}
                                            </span>
                                        )}
                                        {item.isDuplicate && (
                                            <span className={styles.previewItemDup}>duplicado</span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {preview.total > 5 && (
                                <div className={styles.previewMore}>
                                    y {preview.total - 5} marcadores más...
                                </div>
                            )}
                        </div>
                    )}

                    {/* error de previsualizacion */}
                    {importError && !importResult && (
                        <div style={{
                            padding: 'var(--space-sm) var(--space-md)',
                            background: 'var(--error-container)',
                            color: 'var(--on-error-container)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-body-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-xs)',
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
                            {importError}
                        </div>
                    )}

                    {/* opciones */}
                    {selectedFile && preview && (
                        <div className={styles.optionsRow}>
                            <label className={styles.checkboxWrapper}>
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={skipDuplicates}
                                    onChange={e => setSkipDuplicates(e.target.checked)}
                                />
                                <span className={styles.checkboxLabel}>
                                    Omitir marcadores duplicados ({preview.duplicates} encontrados)
                                </span>
                            </label>
                        </div>
                    )}

                    {/* boton importar */}
                    {selectedFile && preview && (
                        <Button
                            onClick={handleImport}
                            isLoading={isImporting}
                            disabled={isImporting || preview.new === 0 && skipDuplicates}
                            leftIcon={
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                download
                                </span>
                            }
                        >
                            {isImporting
                                ? 'Importando...'
                                : skipDuplicates
                                ? `Importar ${preview.new} marcadores nuevos`
                                : `Importar ${preview.total} marcadores`}
                        </Button>
                    )}
                </div>
            </div>

            {/* resultado de importacion  */}
            {importResult && (
                <div className={cn(
                    styles.result,
                    importResult.failed === 0
                        ? styles.resultSuccess
                        : styles.resultError
                )}>
                    <div className={styles.resultHeader}>
                        <span className={cn('material-symbols-outlined', styles.resultIcon)}
                            style={{ color: importResult.failed === 0 ? '#16a34a' : 'var(--error)' }}>
                            {importResult.failed === 0 ? 'check_circle' : 'warning'}
                        </span>
                        <span className={styles.resultTitle}>
                            {importResult.failed === 0
                                ? 'Importación completada'
                                : 'Importación completada con errores'}
                        </span>
                </div>

                <div className={styles.resultNumbers}>
                    <div className={styles.resultNumber}>
                        <span className={styles.resultNumberValue}
                            style={{ color: '#16a34a' }}>
                            {importResult.imported}
                        </span>
                        <span className={styles.resultNumberLabel}>importados</span>
                    </div>
                    <div className={styles.resultNumber}>
                        <span className={styles.resultNumberValue}
                            style={{ color: 'var(--outline)' }}>
                            {importResult.skipped}
                        </span>
                        <span className={styles.resultNumberLabel}>omitidos</span>
                    </div>
                    {importResult.failed > 0 && (
                        <div className={styles.resultNumber}>
                            <span className={styles.resultNumberValue} style={{ color: 'var(--error)' }}>
                                {importResult.failed}
                            </span>
                            <span className={styles.resultNumberLabel}>fallidos</span>
                        </div>
                    )}
                </div>

                {importResult.errors.length > 0 && (
                    <div className={styles.resultErrors}>
                        {importResult.errors.map((err, i) => (
                                <div key={i} className={styles.resultErrorItem}>
                                <span className="material-symbols-outlined"
                                    style={{ fontSize: 14, flexShrink: 0 }}>
                                    error_outline
                                </span>
                                {err}
                            </div>
                        ))}
                    </div>  
                )}
                </div>
            )}

            {/* info: como exportar desde otros navegadores  */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div className={styles.sectionIcon}>
                        <span className="material-symbols-outlined">help_outline</span>
                    </div>
                    <div>
                        <div className={styles.sectionTitle}>¿Cómo exportar desde tu navegador?</div>
                        <div className={styles.sectionSub}>
                            Instrucciones para cada navegador
                        </div>
                    </div>
                </div>

                <div className={styles.sectionBody}>
                    {[
                        {
                            browser: 'Chrome',
                            icon: 'language',
                            steps: 'Menú (⋮) → Marcadores → Administrador de marcadores → Organizar (⋮) → Exportar marcadores',
                        },
                        {
                            browser: 'Firefox',
                            icon: 'language',
                            steps: 'Marcadores → Administrar marcadores → Importar y respaldar → Exportar marcadores a HTML',
                        },
                        {
                            browser: 'Safari',
                            icon: 'language',
                            steps: 'Archivo → Exportar marcadores',
                        },
                        {
                            browser: 'Edge',
                            icon: 'language',
                            steps: 'Menú (…) → Favoritos → Administrar favoritos → Exportar favoritos',
                        },
                    ].map(({ browser, icon, steps }) => (
                        <div key={browser} style={{
                            display: 'flex',
                            gap: 'var(--space-md)',
                            padding: 'var(--space-sm) 0',
                            borderBottom: '1px solid var(--outline-variant)',
                        }}>
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontSize: 20,
                                    color: 'var(--on-surface-variant)',
                                    flexShrink: 0,
                                    marginTop: 2,
                                }}
                            >
                                {icon}
                            </span>
                            <div>
                                <div style={{
                                    fontSize: 'var(--font-size-label-md)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    color: 'var(--on-surface)',
                                    marginBottom: 2,
                                }}>
                                    {browser}
                                </div>
                                <div style={{
                                    fontSize: 'var(--font-size-caption)',
                                    color: 'var(--on-surface-variant)',
                                    lineHeight: 'var(--line-height-caption)',
                                }}>
                                    {steps}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};