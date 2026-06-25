import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Popup } from './Popup';

// importa estilos globales del frontend
// en prod usa los compilados, en desarrollo hay que referencia directamente
import '../../../frontend/src/styles/tokens.css';

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró el elemento root');

createRoot(root).render(
    <StrictMode>
        <Popup />
    </StrictMode>
);