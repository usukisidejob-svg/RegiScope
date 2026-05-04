import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RegistrationSource } from '../../models/registration-source.model';
import { MOCK_SOURCES } from '../constants/mock-data';

@Injectable({
  providedIn: 'root',
})
export class SourceService {
  private sourcesSubject = new BehaviorSubject<RegistrationSource[]>(MOCK_SOURCES);
  sources$ = this.sourcesSubject.asObservable();

  getSourcesByAccountId(accountId: string): RegistrationSource[] {
    return this.sourcesSubject.value.filter((source) => source.accountId === accountId);
  }
}
