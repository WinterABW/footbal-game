import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, forkJoin, map, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Transaction } from '../models/transaction.model';
import { AuthService } from '../core/services/auth.service';
import { generateSignedToken } from '../core/services/encryption.service';

// Assuming FinanceStatus is a number enum based on the user's description
export enum FinanceStatus {
  // Add status values here, e.g., All = 0, Pending = 1, etc.
  All = 0,
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private getBaseUrl(): string {
    return environment.apiBaseUrl;
  }

  getDepositHistory(limit: number): Observable<Transaction[]> {
    const url = `${this.getBaseUrl()}Wallet/getDepositHistory`;
    return this.http.get<Transaction[]>(url, { params: { limit: limit.toString() } });
  }

  getWithdrawRequests(status: FinanceStatus, pageSize: number): Observable<Transaction[]> {
    const url = `${this.getBaseUrl()}Wallet/GetWithdrawRequests`;
    // The user specified POST, but the parameters look like query params.
    // I will assume they are query params for now, as sending them in the body for a GET-like request is unusual.
    // If this is wrong, I will adjust to a POST with a body.
    return this.http.post<Transaction[]>(url, null, { params: { status: status.toString(), pageSize: pageSize.toString() } });
  }

  getTransactionHistory(limit: number, pageSize: number): Observable<Transaction[]> {
    return forkJoin({
      deposits: this.getDepositHistory(limit),
      withdrawals: this.getWithdrawRequests(FinanceStatus.All, pageSize)
    }).pipe(
      map(({ deposits, withdrawals }) => {
        
      const mappedDeposits: Transaction[] = deposits.map((d: any) => ({
        id: d.id,
        type: 'deposit',
        amount: d.amount, // Amount always comes in COP from backend
        currency: 'COP', // Default currency is COP
        status: this.mapStatus(d.status),
        date: d.created,
        method: this.mapDepositMethod(d.method),
        methodId: d.method, // Store numeric method ID for conversion
        reference: d.invoiceId || d.transactionId,
        description: d.description,
        conversionToCOP: d.conversionToCOP,
      }));

      const mappedWithdrawals: Transaction[] = withdrawals.map((w: any) => ({
        id: w.id,
        type: 'withdrawal',
        amount: w.amount, // Amount always comes in COP from backend
        currency: 'COP', // Default currency is COP
        status: this.mapStatus(w.status),
        date: w.created,
        method: this.mapWithdrawMethod(w.method),
        methodId: w.method, // Store numeric method ID for conversion
        reference: w.transactionId,
        description: w.description,
        conversionToCOP: w.conversionToCOP,
      }));

        const combined = [...mappedDeposits, ...mappedWithdrawals];
        
        // Sort by date, most recent first
        return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      })
    );
  }

  private mapStatus(status: number): 'completed' | 'pending' | 'failed' {
    switch (status) {
      case 0: return 'pending';
      case 1: return 'completed';
      case 2: return 'failed';
      default: return 'pending';
    }
  }

  private mapDepositMethod(method: number): string {
    const methods = [
      'Crypto',    // 0
      'Nequi 1',   // 1
      'Nequi 2',   // 2
      'Nequi 3',   // 3
      'Daviplata', // 4
      'PayPal',     // 5
      'Bre-B'       // 6
    ];
    return methods[method] || 'Unknown';
  }

  private mapWithdrawMethod(method: number): string {
    const methods = [
      'Nequi 1',    // 0
      'Nequi 2',    // 1
      'Nequi 3',    // 2
      'Daviplata',  // 3
      'Paypal',     // 4
      'USDT TRC20', // 5
      'USDT BEP20', // 6
      'TRX',        // 7
      'BNB',        // 8
      'BTC'         // 9
    ];
    return methods[method] || 'Unknown';
  }

  refreshBalance(): Observable<string> {
    const url = `${this.getBaseUrl()}Wallet/refreshBalance`;
    const user = this.authService.user();
    const userId = user?.id ?? user?.Id;

    return from(
      (async () => {
        const timestamp = Math.floor(Date.now() / 1000);
        const token = await generateSignedToken(userId!, timestamp);
        return { timestamp, token };
      })()
    ).pipe(
      switchMap(body => this.http.post(url, body, { responseType: 'text' }))
    );
  }
}
