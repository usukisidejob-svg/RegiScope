import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import { google } from 'googleapis';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/prisma/client.js';
import { detectRegistrationSources } from './services/scan.service.js';

dotenv.config();
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
});

const prisma = new PrismaClient({ adapter });

const app = express();
const port = Number(process.env.PORT ?? 3000);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:4200';


app.use(cors({
  origin: frontendOrigin,
}));

app.use(express.json());

const googleOAuthClient = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

const gmailScopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
];

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'regiscope-api',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/auth/google/url', (_req, res) => {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REDIRECT_URI
  ) {
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
app.get('/api/accounts', async (_req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json(accounts);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to fetch accounts.',
    });
  }
});
app.patch('/api/accounts/:accountId/scan', async (req, res) => {
  const { accountId } = req.params;

  try {
    const accountWithToken = await prisma.account.findUnique({
      where: {
        id: accountId,
      },
      include: {
        oauthToken: true,
      },
    });

    if (!accountWithToken?.oauthToken) {
      res.status(400).json({
        error: 'Google OAuth token is not connected for this account.',
      });
      return;
    }

    const accountOAuthClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    accountOAuthClient.setCredentials({
      access_token: accountWithToken.oauthToken.accessToken ?? undefined,
      refresh_token: accountWithToken.oauthToken.refreshToken ?? undefined,
      scope: accountWithToken.oauthToken.scope ?? undefined,
      token_type: accountWithToken.oauthToken.tokenType ?? undefined,
      expiry_date: accountWithToken.oauthToken.expiryDate?.getTime(),
    });

    const gmail = google.gmail({
      version: 'v1',
      auth: accountOAuthClient,
    });

    const account = await prisma.account.update({
      where: {
        id: accountId,
      },
      data: {
        hasScanned: true,
        lastScanDate: new Date(),
      },
    });
    const detectedSources = await detectRegistrationSources({ gmail });

    await prisma.registrationSource.deleteMany({
      where: {
        accountId,
      },
    });

    await prisma.registrationSource.createMany({
      data: detectedSources.map((source) => ({
        accountId,
        ...source,
        lastEmailAt: new Date(),
      })),
    });

    res.json(account);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to update account scan status.',
    });
  }
});

app.get('/api/accounts/:accountId/sources', async (req, res) => {
  const { accountId } = req.params;

  try {
    const sources = await prisma.registrationSource.findMany({
      where: {
        accountId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json(sources);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to fetch registration sources.',
    });
  }
});


app.get('/api/auth/google/callback', async (req, res) => {
  const code = req.query.code;

  if (typeof code !== 'string') {
    res.status(400).json({
      error: 'Authorization code is missing.',
    });
    return;
  }

  try {
    const { tokens } = await googleOAuthClient.getToken(code);
    googleOAuthClient.setCredentials(tokens);

    const gmail = google.gmail({
      version: 'v1',
      auth: googleOAuthClient,
    });

    const profileResponse = await gmail.users.getProfile({
      userId: 'me',
    });

    const email = profileResponse.data.emailAddress;
    if (!email) {
      res.status(500).json({
        error: 'Gmail email address could not be retrieved.',
      });
      return;
    }

    const account = await prisma.account.upsert({
      where: {
        email,
      },
      update: {
        displayName: email,
      },
      create: {
        email,
        displayName: email,
      },
    });

    await prisma.googleOAuthToken.upsert({
      where: {
        accountId: account.id,
      },
      update: {
        accessToken: tokens.access_token ?? undefined,
        refreshToken: tokens.refresh_token ?? undefined,
        scope: tokens.scope ?? undefined,
        tokenType: tokens.token_type ?? undefined,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
      create: {
        accountId: account.id,
        accessToken: tokens.access_token ?? null,
        refreshToken: tokens.refresh_token ?? null,
        scope: tokens.scope ?? null,
        tokenType: tokens.token_type ?? null,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    });

    const redirectUrl = `${frontendOrigin}/account?connectedEmail=${encodeURIComponent(email ?? '')}`;

    res.redirect(redirectUrl);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to handle Google OAuth callback.',
    });
  }
});


app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
