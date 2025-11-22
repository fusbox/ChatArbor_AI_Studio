import './config.js'; // Must be first
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { chatRouter } from './routes/chat.js';
import { knowledgeRouter } from './routes/knowledge.js';
import { adminRouter } from './routes/admin.js';
import { feedbackRouter } from './routes/feedback.js';
import { historyRouter } from './routes/history.js';


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/chat/history', historyRouter); // Mount history under /api/chat/history
app.use('/api/knowledge', knowledgeRouter);
app.use('/api/admin', adminRouter);
app.use('/api/feedback', feedbackRouter);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
