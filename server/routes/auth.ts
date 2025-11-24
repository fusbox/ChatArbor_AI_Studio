import { Router } from 'express';
import * as userService from '../services/userService.js';

export const authRouter = Router();

authRouter.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const result = await userService.createUser(name, email, password);
        res.json(result); // { user, token }
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const result = await userService.validateCredentials(email, password);

    if (!result) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json(result); // { user, token }
});

authRouter.get('/me', (req, res) => {
    // In real app, verify token
    res.json({ id: 'guest', name: 'Guest User', email: 'guest@example.com' });
});
