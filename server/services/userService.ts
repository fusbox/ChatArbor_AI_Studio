import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import db from './db.js';

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
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
        throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: crypto.randomUUID(),
        name,
        email,
        password: hashedPassword,
        createdAt: Date.now()
    };

    const insert = db.prepare(`
        INSERT INTO users (id, name, email, password, createdAt)
        VALUES (@id, @name, @email, @password, @createdAt)
    `);

    insert.run(newUser);

    // Return user without password + token
    const { password: _, ...safeUser } = newUser;
    const token = generateToken(newUser.id, newUser.email);
    return { user: safeUser, token };
};

export const validateCredentials = async (email: string, password: string) => {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return null;
    }

    const { password: _, ...safeUser } = user;
    const token = generateToken(user.id, user.email);
    return { user: safeUser, token };
};

export const getUser = async (email: string) => {
    const user = db.prepare('SELECT id, name, email, createdAt FROM users WHERE email = ?').get(email);
    return user;
};

// Export getJwtSecret for middleware to use
export { getJwtSecret };
