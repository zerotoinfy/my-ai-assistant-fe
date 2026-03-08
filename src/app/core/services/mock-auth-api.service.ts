import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  status: 'success';
  message: string;
  token: string;
  user: {
    id: string;
    fullName: string;
    role: 'Maker' | 'Checker';
    branchCode: string;
  };
}

interface DemoCredential {
  email: string;
  password: string;
  id: string;
  fullName: string;
  role: 'Maker' | 'Checker';
}

export const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    email: 'maker.sbi@bank.com',
    password: 'Maker@123',
    id: 'SBI-MKR-1024',
    fullName: 'Rohit Sharma',
    role: 'Maker'
  },
  {
    email: 'checker.sbi@bank.com',
    password: 'Checker@123',
    id: 'SBI-CHK-2097',
    fullName: 'Priya Nair',
    role: 'Checker'
  }
];

@Injectable({
  providedIn: 'root'
})
export class MockAuthApiService {
  login(payload: LoginRequest): Observable<LoginResponse> {
    const matchedAccount = DEMO_CREDENTIALS.find(
      (account) =>
        account.email.toLowerCase() === payload.email.trim().toLowerCase()
        && account.password === payload.password
    );

    if (!matchedAccount) {
      return throwError(() => new Error('Invalid credentials. Use hardcoded Maker/Checker credentials.'));
    }

    const hardcodedResponse: LoginResponse = {
      status: 'success',
      message: 'Login successful',
      token: 'dummy-jwt-token-for-ui-flow-only',
      user: {
        id: matchedAccount.id,
        fullName: matchedAccount.fullName,
        role: matchedAccount.role,
        branchCode: 'SBI-00452'
      }
    };

    return of(hardcodedResponse).pipe(delay(900));
  }
}