import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from '@/middleware/errorHandler';
import authRouter from '@/routes/auth.routes';
import bookmarkRouter from '@/routes/bookmark.routes';
import folderRouter from '@/routes/folder.routes';
import tagRouter from '@/routes/tag.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'Boveda API is running',
        timestamp: new Date().toISOString(),
    });
});

app.use('/api/auth', authRouter);
app.use('/api/bookmarks', bookmarkRouter);
app.use('/api/folders', folderRouter);
app.use('/api/tags', tagRouter);

app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.info(`Servidor corriendo en http://localhost:${PORT}`);
    console.info(`Entorno: ${process.env.NODE_ENV}`);
});

export default app;