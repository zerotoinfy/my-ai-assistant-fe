import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LoginResponse } from './mock-auth-api.service';

export type AppUserRole = 'Maker' | 'Checker';

export interface AppSessionUser {
  id: string;
  fullName: string;
  role: AppUserRole;
  branchCode: string;
}

const STORAGE_KEY = 'sbi-doc-extractor-session';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly currentUserSubject = new BehaviorSubject<AppSessionUser | null>(this.readStoredUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  setSession(response: LoginResponse): void {
    const user: AppSessionUser = {
      id: response.user.id,
      fullName: response.user.fullName,
      role: response.user.role,
      branchCode: response.user.branchCode
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): AppSessionUser | null {
    return this.currentUserSubject.value;
  }

  clearSession(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.currentUserSubject.next(null);
  }

  hasAnyRole(roles: AppUserRole[]): boolean {
    const user = this.getCurrentUser();
    if (!user) {
      return false;
    }

    return roles.includes(user.role);
  }

  private readStoredUser(): AppSessionUser | null {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      return null;
    }

    try {
      return JSON.parse(rawData) as AppSessionUser;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
}
