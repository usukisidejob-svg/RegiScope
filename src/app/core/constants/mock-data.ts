import { AccountViewModel } from '../../models/account.model';

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
