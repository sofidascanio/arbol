import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '@/utils/prisma';
import { AppError } from '@/middleware/errorHandler';
import { AuthPayload } from '@/types';

const SALT_ROUNDS = 10;

// helpers privados 
const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (
    plain: string,
    hashed: string
): Promise<boolean> => {
    return bcrypt.compare(plain, hashed);
};

const generateToken = (payload: AuthPayload): string => {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    if (!secret) {
        throw new AppError('JWT_SECRET is not defined', 500);
    }

    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

// respuesta publica (sin contraseña) 
interface AuthResult {
    token: string;
    user: {
        id: string;
        email: string;
        createdAt: Date;
    };
}

export const registerUser = async (
    email: string,
    password: string
): Promise<AuthResult> => {
    // verifica si el email ya existe
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new AppError('Email already registered', 409);
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
        data: { email, password: hashedPassword },
    });

    const token = generateToken({ id: user.id, email: user.email });

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
        },
    };
};

export const loginUser = async (
    email: string,
    password: string
): Promise<AuthResult> => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new AppError('Email y/o contraseña invalido.', 401);
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
        throw new AppError('Email y/o contraseña invalido.', 401);
    }

    const token = generateToken({ id: user.id, email: user.email });

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
        },
    };
};

export const getUserById = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new AppError('No se encontro el usuario.', 404);
    }

    return user;
};