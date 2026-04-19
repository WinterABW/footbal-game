import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, forkJoin, map } from 'rxjs';
import { Transaction } from '../models/transaction.model';

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
          amount: d.amount,
          currency: 'USD', // Default currency
          status: this.mapStatus(d.status),
          date: d.created,
          method: this.mapMethod(d.method),
          reference: d.invoiceId || d.transactionId,
          description: d.description,
        }));

        const mappedWithdrawals: Transaction[] = withdrawals.map((w: any) => ({
          id: w.id,
          type: 'withdrawal',
          amount: w.amount,
          currency: 'USD', // Default currency
          status: this.mapStatus(w.status),
          date: w.created,
          method: this.mapMethod(w.method),
          reference: w.transactionId,
          description: w.description,
        }));

        const combined = [...mappedDeposits, ...mappedWithdrawals];
        
        // Sort by date, most recent first
        return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      })
    );
  }

  private mapStatus(status: number): 'completed' | 'pending' | 'failed' {
    switch (status) {
      case 0: return 'completed';
      case 1: return 'pending';
      case 2: return 'failed';
      default: return 'pending';
    }
  }

  private mapMethod(method: number): string {
    // This is a guess, based on the data. You might need to adjust this.
    const methods = [
      'Crypto', 'Nequi', 'Daviplata', 'BRE-B', 'Paypal', 'Manual'
    ];
    return methods[method] || 'Unknown';
  }
}
