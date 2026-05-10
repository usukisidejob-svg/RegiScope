import type { gmail_v1 } from 'googleapis';

export type DetectedRegistrationSource = {
  name: string;
  domain: string;
  senderEmail: string;
  category: string;
  confidence: string;
  frequency: string | null;
  emailCount: number;
  firstEmailAt: Date | null;
  lastEmailAt: Date | null;
  isUrgent: boolean;
  gmailQuery: string | null;
};

type DetectRegistrationSourcesOptions = {
  gmail: gmail_v1.Gmail;
};

type GmailMessageCandidate = {
  senderEmail: string;
  senderName: string | null;
  domain: string;
  subject: string;
  date: Date | null;
};

export async function detectRegistrationSources({
  gmail,
}: DetectRegistrationSourcesOptions): Promise<DetectedRegistrationSource[]> {
  const messageList = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 50,
    q: 'newer_than:1y',
  });

  const messages = messageList.data.messages ?? [];
  const candidates = await Promise.all(
    messages.map(async (message) => {
      if (!message.id) {
        return null;
      }

      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });

      return toGmailMessageCandidate(detail.data);
    }),
  );

  return buildRegistrationSources(
    candidates.filter((candidate): candidate is GmailMessageCandidate => candidate !== null),
  );
}

function toGmailMessageCandidate(message: gmail_v1.Schema$Message): GmailMessageCandidate | null {
  const headers = message.payload?.headers ?? [];
  const from = getHeaderValue(headers, 'From');
  const subject = getHeaderValue(headers, 'Subject') ?? '';
  const dateHeader = getHeaderValue(headers, 'Date');

  if (!from) {
    return null;
  }

  const parsedSender = parseSender(from);

  if (!parsedSender) {
    return null;
  }

  return {
    senderEmail: parsedSender.email,
    senderName: parsedSender.name,
    domain: parsedSender.email.split('@')[1],
    subject,
    date: dateHeader ? new Date(dateHeader) : null,
  };
}

function getHeaderValue(
  headers: gmail_v1.Schema$MessagePartHeader[],
  name: string,
): string | null {
  return headers.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value ?? null;
}

function parseSender(from: string): { email: string; name: string | null } | null {
  const bracketMatch = from.match(/^(.*?)<([^>]+)>$/);
  const rawEmail = bracketMatch?.[2] ?? from.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];

  if (!rawEmail) {
    return null;
  }

  const email = rawEmail.trim().toLowerCase();
  const domain = email.split('@')[1];

  if (!domain) {
    return null;
  }

  const name = bracketMatch?.[1]?.trim().replace(/^"|"$/g, '') || null;

  return {
    email,
    name,
  };
}

function buildRegistrationSources(candidates: GmailMessageCandidate[]): DetectedRegistrationSource[] {
  const groupedByDomain = new Map<string, GmailMessageCandidate[]>();

  for (const candidate of candidates) {
    const existing = groupedByDomain.get(candidate.domain) ?? [];
    existing.push(candidate);
    groupedByDomain.set(candidate.domain, existing);
  }

  return [...groupedByDomain.entries()]
    .map(([domain, messages]) => {
      const newestMessage = [...messages].sort((a, b) => {
        return (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0);
      })[0];
      const category = detectCategory(messages);
      const sender = newestMessage.senderEmail;
      const datedMessages = messages.filter((message) => message.date !== null);
      const oldestMessage = [...datedMessages].sort((a, b) => {
        return (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0);
      })[0];

      return {
        name: normalizeDisplayName(newestMessage.senderName, domain),
        domain,
        senderEmail: sender,
        category,
        confidence: detectConfidence(messages, category),
        frequency: detectFrequency(messages),
        emailCount: messages.length,
        firstEmailAt: oldestMessage?.date ?? null,
        lastEmailAt: newestMessage.date,
        isUrgent: messages.some((message) => isUrgentSubject(message.subject)),
        gmailQuery: `from:${sender}`,
      };
    })
    .sort((a, b) => confidenceScore(b.confidence) - confidenceScore(a.confidence))
    .slice(0, 20);
}

function normalizeDisplayName(senderName: string | null, domain: string): string {
  if (senderName) {
    return senderName;
  }

  return domain
    .split('.')[0]
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function detectCategory(messages: GmailMessageCandidate[]): string {
  const text = messages.map((message) => `${message.subject} ${message.senderEmail}`).join(' ').toLowerCase();

  if (/(invoice|receipt|payment|billing|subscription|order|領収|請求|支払|注文)/.test(text)) {
    return 'payment';
  }

  if (/(verify|verification|security|login|password|account|認証|確認|セキュリティ|ログイン)/.test(text)) {
    return 'account';
  }

  if (/(newsletter|unsubscribe|campaign|promotion|digest|メルマガ|ニュースレター|配信停止)/.test(text)) {
    return 'newsletter';
  }

  return 'other';
}

function detectConfidence(messages: GmailMessageCandidate[], category: string): string {
  if (messages.length >= 3 || category !== 'other') {
    return 'high';
  }

  if (messages.length === 2) {
    return 'medium';
  }

  return 'low';
}

function detectFrequency(messages: GmailMessageCandidate[]): string | null {
  if (messages.length >= 10) {
    return 'daily';
  }

  if (messages.length >= 4) {
    return 'weekly';
  }

  if (messages.length >= 2) {
    return 'monthly';
  }

  return null;
}

function isUrgentSubject(subject: string): boolean {
  return /(overdue|failed|suspended|action required|urgent|至急|失敗|停止|要対応)/i.test(subject);
}

function confidenceScore(confidence: string): number {
  if (confidence === 'high') {
    return 3;
  }

  if (confidence === 'medium') {
    return 2;
  }

  return 1;
}
