export type ScanState = 'idle' | 'processing' | 'completed';

export interface ScanStatus {
    accountId: String;
    status: string;
    progress: number; // 0~100
    startedAt: Date;
    completedAt: Date;
}