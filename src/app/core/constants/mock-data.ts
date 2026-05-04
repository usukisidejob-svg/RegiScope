import { AccountViewModel } from '../../models/account.model';
import { RegistrationSource } from '../../models/registration-source.model';


export const MOCK_ACCOUNTS: AccountViewModel[] = [
    {
        id: 'account-001',
        email: 'sample.user@gmail.com',
        displayName: 'Sample User',
        isActive: true,
        hasScanned: false,
        createdAt: new Date(),
        status: 'connected',
    },
    {
        id: 'account-002',
        email: 'work.user@gmail.com',
        displayName: 'Work User',
        isActive: true,
        hasScanned: false,
        createdAt: new Date(),
        status: 'connected',
    },
];

export const MOCK_SOURCES: RegistrationSource[] = [
  {
    id: 'source-001',
    accountId: 'account-001',
    displayName: 'Netflix',
    domain: 'netflix.com',
    senderEmail: 'info@mailer.netflix.com',
    category: 'payment',
    confidence: 'high',
    isUrgent: true,
    firstSeen: new Date('2024-01-15'),
    lastSeen: new Date('2026-02-14'),
    frequency: { count: 3, period: 90, pattern: 'monthly' },
    isPinned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'source-002',
    accountId: 'account-001',
    displayName: 'GitHub',
    domain: 'github.com',
    senderEmail: 'noreply@github.com',
    category: 'account',
    confidence: 'high',
    isUrgent: false,
    firstSeen: new Date('2024-05-01'),
    lastSeen: new Date('2026-02-15'),
    frequency: { count: 12, period: 30, pattern: 'daily' },
    isPinned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'source-003',
    accountId: 'account-002',
    displayName: 'Slack',
    domain: 'slack.com',
    senderEmail: 'notification@slack.com',
    category: 'account',
    confidence: 'medium',
    isUrgent: false,
    firstSeen: new Date('2025-01-10'),
    lastSeen: new Date('2026-02-14'),
    frequency: { count: 8, period: 30, pattern: 'weekly' },
    isPinned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

