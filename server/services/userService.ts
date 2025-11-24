import jwt from 'jsonwebtoken';

// Mock user database
const users = new Map();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const generateToken = (userId: string, email: string): string => {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
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
