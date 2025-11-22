import { Router } from 'express';

export const authRouter = Router();

// Mock user database
const users = new Map();

authRouter.post('/signup', (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    const newUser = { id: Date.now().toString(), name, email };
    users.set(email, { ...newUser, password }); // In real app, hash password!

    res.json(newUser);
});

authRouter.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.get(email);

    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password: _, ...safeUser } = user;
    res.json(safeUser);
});

authRouter.get('/me', (req, res) => {
    // In real app, verify token
    res.json({ id: 'guest', name: 'Guest User', email: 'guest@example.com' });
});
