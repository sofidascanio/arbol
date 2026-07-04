import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '@/utils/prisma';
import { AppError } from '@/middleware/errorHandler';
import { AuthPayload } from '@/types';

const SALT_ROUNDS = 10;

const hashPassword = async (password: string): Promise<string> =>
    bcrypt.hash(password, SALT_ROUNDS);

const comparePassword = async (plain: string, hashed: string): Promise<boolean> =>
    bcrypt.compare(plain, hashed);

const generateToken = (payload: AuthPayload): string => {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    if (!secret) throw new AppError('JWT_SECRET is not defined', 500);
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

interface AuthResult {
    token: string;
    user: {
        id: string;
        username: string;
        createdAt: Date;
    };
}

export const registerUser = async (
    username: string, 
    password: string
): Promise<AuthResult> => {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) throw new AppError('Nombre de usuario ya registrado', 409);

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
        data: { username, password: hashedPassword },
    });

    const token = generateToken({ id: user.id, username: user.username });

    return {
        token,
        user: { id: user.id, username: user.username, createdAt: user.createdAt },
    };
};

export const loginUser = async (
    username: string, 
    password: string
): Promise<AuthResult> => {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) throw new AppError('Usuario y/o contraseña inválido.', 401);

    const isValid = await comparePassword(password, user.password);
    if (!isValid) throw new AppError('Usuario y/o contraseña inválido.', 401);

    const token = generateToken({ id: user.id, username: user.username });

    return {
        token,
        user: { id: user.id, username: user.username, createdAt: user.createdAt },
    };
};

export const getUserById = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            username: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) throw new AppError('No se encontró el usuario.', 404);
    return user;
};