import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RegistrationSource } from '../../models/registration-source.model';

type ApiRegistrationSource = {
  id: string;
  accountId: string;
  name: string;
  domain: string;
  senderEmail: string | null;
  category: string;
  confidence: string;
  frequency: string | null;
  emailCount: number;
  firstEmailAt: string | null;
  lastEmailAt: string | null;
  isUrgent: boolean;
  gmailQuery: string | null;
  createdAt: string;
  updatedAt: string;
};

@Injectable({
  providedIn: 'root',
})
export class SourceService {
  private sourcesSubject = new BehaviorSubject<RegistrationSource[]>([]);

  sources$ = this.sourcesSubject.asObservable();
  searchQuery = signal('');

  getSourcesSnapshot(): RegistrationSource[] {
    return this.sourcesSubject.value;
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  private readonly apiBaseUrl = 'http://localhost:3000';

  async loadSources(accountId: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/api/accounts/${accountId}/sources`);

    if (!response.ok) {
      throw new Error('Failed to load sources.');
    }

    const sources = (await response.json()) as ApiRegistrationSource[];

    const viewModels: RegistrationSource[] = sources.map((source) => ({
      id: source.id,
      accountId: source.accountId,
      displayName: source.name,
      domain: source.domain,
      senderEmail: source.senderEmail ?? `no-reply@${source.domain}`,
      gmailQuery: source.gmailQuery ?? undefined,
      category: this.toSourceCategory(source.category),
      confidence: this.toConfidenceLevel(source.confidence),
      isUrgent: source.isUrgent,
      firstSeen: source.firstEmailAt ? new Date(source.firstEmailAt) : new Date(source.createdAt),
      lastSeen: source.lastEmailAt ? new Date(source.lastEmailAt) : new Date(source.createdAt),
      frequency: this.toEmailFrequency(source.frequency, source.emailCount),
      isPinned: false,
      createdAt: new Date(source.createdAt),
      updatedAt: new Date(source.updatedAt),
    }));

    this.sourcesSubject.next(viewModels);
  }
  private toSourceCategory(category: string): RegistrationSource['category'] {
    if (
      category === 'newsletter' ||
      category === 'payment' ||
      category === 'account' ||
      category === 'other'
    ) {
      return category;
    }

    return 'other';
  }

  private toConfidenceLevel(confidence: string): RegistrationSource['confidence'] {
    if (confidence === 'high' || confidence === 'medium' || confidence === 'low') {
      return confidence;
    }

    return 'medium';
  }

  private toEmailFrequency(frequency: string | null, emailCount: number): RegistrationSource['frequency'] {
    if (frequency === 'daily' || frequency === 'weekly' || frequency === 'monthly') {
      return {
        count: emailCount,
        period: frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 30,
        pattern: frequency,
      };
    }

    return {
      count: emailCount,
      period: 365,
    };
  }

}
