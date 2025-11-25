import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

// Mock user database
const users = new Map();

let _jwtSecret: string | null = null;

const getJwtSecret = () => {
    if (_jwtSecret) return _jwtSecret;

    if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length > 0) {
        _jwtSecret = process.env.JWT_SECRET;
    } else {
        console.warn('[userService] JWT_SECRET not set. Using ephemeral in-memory secret. Sessions will reset on restart.');
        _jwtSecret = crypto.randomBytes(64).toString('hex');
    }
    return _jwtSecret;
};

const generateToken = (userId: string, email: string): string => {
    return jwt.sign({ userId, email }, getJwtSecret(), { expiresIn: '7d' });
};

export const createUser = async (name: string, email: string, password: string) => {
    if (users.has(email)) {
        throw new Error('User already exists');
    }
    const newUser = { id: Date.now().toString(), name, email, password }; // In real app, hash password!
    users.set(email, newUser);

    // Return user without password + token
    const { password: _, ...safeUser } = newUser;
    const token = generateToken(newUser.id, newUser.email);
    return { user: safeUser, token };
};

export const validateCredentials = async (email: string, password: string) => {
    const user = users.get(email);
    if (!user || user.password !== password) {
        return null;
    }
    const { password: _, ...safeUser } = user;
    const token = generateToken(user.id, user.email);
    return { user: safeUser, token };
};

export const getUser = async (email: string) => {
    return users.get(email);
};
