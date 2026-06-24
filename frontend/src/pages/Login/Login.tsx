import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { ApiError } from '@/services/api';
import styles from './Login.module.css';

export const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Completa todos los campos');
            return;
        }

        setIsLoading(true);
        try {
            await login({ email, password });
            navigate('/');
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Ocurrió un error inesperado');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.page}>
        <div className={styles.card}>
            <div className={styles.header}>
            <div className={styles.logo}>
                <span className="material-symbols-outlined">bookmark</span>
            </div>
            <h1 className={styles.title}>Bookmark Manager</h1>
            <p className={styles.subtitle}>Ingresá a tu archivo de conocimiento</p>
            </div>

            <div className={styles.divider} />

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {error && (
                <div className={styles.globalError}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    error
                </span>
                {error}
                </div>
            )}

            <Input
                label="Correo electrónico"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                leftIcon={
                <span className="material-symbols-outlined">mail</span>
                }
                autoComplete="email"
                autoFocus
            />

            <Input
                label="Contraseña"
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                leftIcon={
                <span className="material-symbols-outlined">lock</span>
                }
                autoComplete="current-password"
            />

            <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                size="lg"
            >
                Ingresar
            </Button>
            </form>

            <p className={styles.footer}>
            ¿No tenés cuenta?{' '}
            <Link to="/register" className={styles.link}>
                Registrate
            </Link>
            </p>
        </div>
        </div>
    );
};