export type DetectedRegistrationSource = {
  name: string;
  domain: string;
  category: string;
  confidence: string;
  frequency: string | null;
  isUrgent: boolean;
  gmailQuery: string | null;
};

export async function detectRegistrationSources(): Promise<DetectedRegistrationSource[]> {
  return [
    {
      name: 'Netflix',
      domain: 'netflix.com',
      category: 'subscription',
      confidence: 'high',
      frequency: 'monthly',
      isUrgent: true,
      gmailQuery: 'from:netflix.com OR netflix',
    },
    {
      name: 'GitHub',
      domain: 'github.com',
      category: 'account',
      confidence: 'high',
      frequency: 'daily',
      isUrgent: false,
      gmailQuery: 'from:github.com OR github',
    },
    {
      name: '楽天市場',
      domain: 'rakuten.co.jp',
      category: 'payment',
      confidence: 'high',
      frequency: 'monthly',
      isUrgent: false,
      gmailQuery: 'from:rakuten.co.jp OR 楽天市場',
    },
  ];
}
