import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { ApiError } from '@/services/api';
import styles from '../Login/Login.module.css';

export const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!username) newErrors.username = 'El correo es requerido';
        else if (!/\S+@\S+\.\S+/.test(username)) newErrors.username = 'Correo inválido';

        if (!password) newErrors.password = 'La contraseña es requerida';
        else if (password.length < 8) newErrors.password = 'Mínimo 8 caracteres';
        else if (!/[A-Z]/.test(password)) newErrors.password = 'Debe tener al menos una mayúscula';
        else if (!/[0-9]/.test(password)) newErrors.password = 'Debe tener al menos un número';

        if (!confirm) newErrors.confirm = 'Confirmá tu contraseña';
        else if (confirm !== password) newErrors.confirm = 'Las contraseñas no coinciden';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            await register({ username, password });
            navigate('/');
        } catch (err) {
            if (err instanceof ApiError) {
                setErrors({ global: err.message });
            } else {
                setErrors({ global: 'Ocurrio un error inesperado' });
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
                <h1 className={styles.title}>Crear cuenta</h1>
                <p className={styles.subtitle}>Empeza a organizar tus marcadores</p>
                </div>

                <div className={styles.divider} />

                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    {errors.global && (
                        <div className={styles.globalError}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                error
                            </span>
                            {errors.global}
                        </div>
                    )}

                    <Input
                        label="Nombre de usuario"
                        type="text"
                        placeholder="Nombre de usuario"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        error={errors.username}
                        leftIcon={<span className="material-symbols-outlined">account_circle</span>}
                        autoComplete="username"
                        autoFocus
                    />

                    <Input
                        label="Contraseña"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        error={errors.password}
                        leftIcon={<span className="material-symbols-outlined">lock</span>}
                        autoComplete="new-password"
                    />

                    <Input
                        label="Confirmar contraseña"
                        type="password"
                        placeholder="Repetí tu contraseña"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        error={errors.confirm}
                        leftIcon={<span className="material-symbols-outlined">lock_reset</span>}
                        autoComplete="new-password"
                    />

                    <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                        Crear cuenta
                    </Button>
                </form>

                <p className={styles.footer}>
                    ¿Ya tenes cuenta?{' '}
                    <Link to="/login" className={styles.link}>
                        Ingresar
                    </Link>
                </p>
            </div>
        </div>
    );
};