import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import { google } from 'googleapis';
dotenv.config();
const app = express();
const port = Number(process.env.PORT ?? 3000);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:4200';
app.use(cors({
    origin: frontendOrigin,
}));
app.use(express.json());
const googleOAuthClient = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
const gmailScopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
];
app.get('/health', (_req, res) => {
    res.json({ ok: true });
});
app.get('/api/auth/google/url', (_req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID ||
        !process.env.GOOGLE_CLIENT_SECRET ||
        !process.env.GOOGLE_REDIRECT_URI) {
        res.status(500).json({
            error: 'Google OAuth environment variables are not configured.',
        });
        return;
    }
    const state = randomUUID();
    const authUrl = googleOAuthClient.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: gmailScopes,
        state,
    });
    res.json({ authUrl, state });
});
app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`);
});
