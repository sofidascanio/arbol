import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';
import { User, AuthState, LoginInput, RegisterInput } from '@/types';
import { api } from '@/services/api';

interface AuthContextType extends AuthState {
    login: (input: LoginInput) => Promise<void>;
    register: (input: RegisterInput) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthResult {
    token: string;
    user: User;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true, // true al inicio mientras verifica el token guardado
    });

    // cuando inicia verifica si hay token guardado y lo valida
    useEffect(() => {
        const savedToken = localStorage.getItem('token');

        if (!savedToken) {
            setState(prev => ({ ...prev, isLoading: false }));
            return;
        }

        // verifica que el token sigue siendo valido
        api.get<{ user: User }>('/auth/me')
            .then(data => {
                setState({
                    user: data.user,
                    token: savedToken,
                    isAuthenticated: true,
                    isLoading: false,
                });
            })
            .catch(() => {
                // token invalido o expirado
                localStorage.removeItem('token');
                setState({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            });
    }, []);

    const login = useCallback(async (input: LoginInput): Promise<void> => {
        const data = await api.post<AuthResult>('/auth/login', input);
        localStorage.setItem('token', data.token);
        setState({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
        });
    }, []);

    const register = useCallback(async (input: RegisterInput): Promise<void> => {
        const data = await api.post<AuthResult>('/auth/register', input);
        localStorage.setItem('token', data.token);
        setState({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
        });
    }, []);

    const logout = useCallback((): void => {
        localStorage.removeItem('token');
        setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
        });
    }, []);

    return (
        <AuthContext.Provider value={{ ...state, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
    return context;
};