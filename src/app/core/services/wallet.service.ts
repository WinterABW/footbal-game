import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiMessageResponse, DepositResponse } from '../../models/user.model';

export enum TransactionCoin {
  COINS = 1,
  USD = 2,
}

export enum TransactionReason {
  TAKING = 1,
  DEPOSIT = 2,
  WITHDRAW = 3,
  INVEST = 4,
  CASINO = 5,
  REFERRAL = 6,
  ENERGY_BOOST = 7,
  UPGRADE = 8,
  REFUND = 9,
}

export enum FinanceMethod {
  COP = 0,      // Nequi 1
  NEQUI_2 = 1,  // Nequi 2
  NEQUI_3 = 2,  // Nequi 3
  DAVIPLATA = 3,
  PAYPAL = 4,
  USDT_TRC20 = 5,
  USDT_BEP20 = 6,
  TRX = 7,
  BNB = 8,
  BTC = 9,
}

export const FinanceMethodLabels: Record<number, string> = {
  0: 'Nequi 1',
  1: 'Nequi 2',
  2: 'Nequi 3',
  3: 'Daviplata',
  4: 'Paypal',
  5: 'USDT (TRC20)',
  6: 'USDT (BEP20)',
  7: 'TRX',
  8: 'BNB',
  9: 'BTC',
};

export enum FincanceNetworks {
  Nequi = 1,
  Daviplata = 2,
  Plin = 3,
  Yape = 4,
  TRON = 5,
  BSC = 6,
  Bitcoin = 7,
  Paypal = 8,
}

export interface WithdrawalRequest {
  amountCOP: number;
  selectedCoin: FinanceMethod;
  selectedNetwork: FincanceNetworks;
  timestamp: number;
  token: string;
  uid: number;
  walletAdress: string;
}

export interface DepositRequest {
  amountUSD: number;
  method: FinanceMethod;
  timestamp: number;
  token: string;
  uid: number;
  transactionId: string | null; 
}

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private http = inject(HttpClient);

  private getBaseUrl(): string {
    return environment.apiBaseUrl;
  }

async addWithdrawal(params: {
    amountCOP: number;
    selectedCoin: FinanceMethod;
    selectedNetwork: FincanceNetworks;
    token: string;
    uid: number;
    walletAdress: string;
  }): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const url = `${this.getBaseUrl()}Wallet/addWithdrawl`;
      const body: WithdrawalRequest = {
        amountCOP: params.amountCOP,
        selectedCoin: params.selectedCoin,
        selectedNetwork: params.selectedNetwork,
        timestamp: Date.now(),
        token: params.token,
        uid: params.uid,
        walletAdress: params.walletAdress,
      };

      const response = await this.http.post<ApiMessageResponse>(url, body).toPromise();

      if (response) {
        return { success: true, message: response.message };
      }

      return { success: false, error: 'No se recibió respuesta del servidor' };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;

      const serverMessage = httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error
        ? (httpError.error as ApiMessageResponse).message
        : null;

      if (httpError?.status === 400) {
        return { success: false, error: serverMessage ?? 'Solicitud no válida' };
      }
      if (httpError?.status === 401) {
        return { success: false, error: 'Sesión expirada. Inicia sesión nuevamente.' };
      }
      return { success: false, error: serverMessage ?? 'No se pudo procesar el retiro. Intenta de nuevo.' };
    }
  }

  async addDeposit(params: {
    amountUSD: number;
    method: FinanceMethod;
    token: string;
    uid: number;
    transactionId: string | null;
  }): Promise<{ success: boolean; error?: string; message?: string; invoiceUrl?: string; txnId?: string; orderNumber?: string }> {
    try {
      const url = `${this.getBaseUrl()}Wallet/addDeposit`;
      const body: DepositRequest = {
        amountUSD: params.amountUSD,
        method: params.method,
        timestamp: Date.now(),
        token: params.token,
        uid: params.uid,
        transactionId: params.transactionId,
      };

      const response = await this.http.post<DepositResponse>(url, body).toPromise();

      if (response) {
        return { 
          success: true, 
          message: response.message,
          invoiceUrl: response.invoiceUrl,
          txnId: response.txnId,
          orderNumber: response.orderNumber
        };
      }

      return { success: false, error: 'No se recibió respuesta del servidor' };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;

      const serverMessage = httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error
        ? (httpError.error as ApiMessageResponse).message
        : null;

      if (httpError?.status === 400) {
        return { success: false, error: serverMessage ?? 'Solicitud no válida' };
      }
      if (httpError?.status === 401) {
        return { success: false, error: 'Sesión expirada. Inicia sesión nuevamente.' };
      }
      return { success: false, error: serverMessage ?? 'No se pudo procesar el depósito. Intenta de nuevo.' };
    }
  }

  async addTransaction(params: {
    amount: number;
    coin: TransactionCoin;
    description: string;
    reason: TransactionReason;
    refEarnContribute: boolean;
    energyAmount?: number | null;
    tookAmount?: number | null;
  }): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const url = `${this.getBaseUrl()}Wallet/addTransaction`;
      const body: Record<string, unknown> = {
        amount: params.amount,
        coin: params.coin,
        description: params.description,
        reason: params.reason,
        refEarnContribute: params.refEarnContribute,
      };

      if (params.energyAmount != null) {
        body['energyAmount'] = params.energyAmount;
      }
      if (params.tookAmount != null) {
        body['tookAmount'] = params.tookAmount;
      }

      const response = await this.http.post<ApiMessageResponse>(url, body).toPromise();

      if (response) {
        return { success: true, message: response.message };
      }

      return { success: false, error: 'Failed to add transaction' };
    } catch (error: unknown) {
      const httpError = error as HttpErrorResponse;
      if (httpError?.status === 400) {
        return { success: false, error: 'Bad request' };
      }
      if (httpError?.status === 401) {
        return { success: false, error: 'Unauthorized' };
      }
      if (httpError?.error && typeof httpError.error === 'object' && 'message' in httpError.error) {
        return { success: false, error: (httpError.error as ApiMessageResponse).message };
      }
      console.error('AddTransaction failed:', error);
      return { success: false, error: 'Failed to add transaction' };
    }
  }
}
