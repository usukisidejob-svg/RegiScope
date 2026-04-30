export type SourceCategory = 'newsletter' | 'payment' | 'account' | 'other';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface EmailFrequency {
    count: number;
    period: number; //日数
    pattern?: 'daily' | 'weekly' | 'monthly';
}

export interface RegistrationSource {
    id: string;
    accountId: string;
    displayName: string;
    domain: string;
    senderEmail: string;
    category: SourceCategory;
    confidence: ConfidenceLevel;
    isUrgent: boolean;
    firstSeen: Date;
    lastSeen: Date;
    frequency: EmailFrequency;
    isPinned?: boolean;
    createdAt: Date;
    updatedAt: Date;
}