import multer from 'multer';

// config de multer para importacion de archivos
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (_req, file, cb) => {
        const allowed = [
            'text/html',
            'application/json',
            'text/plain',
            'application/octet-stream', // algunos browsers envian el html con este mime
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de archivo no soportado: ${file.mimetype}`));
        }
    },
});