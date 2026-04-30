export interface Account {
    id: string;
    email: string;
    displayName?: string;
    profileImageUrl?: string;
    isActive: boolean;
    hasScanned: boolean;
    lastScanDate?: Date;
    createdAt: Date;
}

export type AccountConnectionStatus = 'connected' | 'not_connected';

export interface AccountViewModel extends Account {
    status: AccountConnectionStatus;
}

