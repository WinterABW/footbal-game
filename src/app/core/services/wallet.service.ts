import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiMessageResponse, DepositResponse } from '../../models/user.model';
import { SyncCoordinatorService } from './sync-coordinator.service';
import { ErrorHandlerService } from './error-handler.service';

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
  CRYPTO = 0,
  NEQUI_1 = 1,
  NEQUI_2 = 2,
  NEQUI_3 = 3,
  DAVIPLATA = 4,
  PAYPAL = 5,
  BRE_B = 6,
}

export const FinanceMethodLabels: Record<number, string> = {
  0: 'Crypto',
  1: 'Nequi 1',
  2: 'Nequi 2',
  3: 'Nequi 3',
  4: 'Daviplata',
  5: 'PayPal',
  6: 'BRE-B',
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
  methodId: number;
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
  private syncCoordinator = inject(SyncCoordinatorService, { optional: true });
  private errorHandler = inject(ErrorHandlerService, { optional: true });

  private getBaseUrl(): string {
    return environment.apiBaseUrl;
  }

  async addWithdrawal(params: {
    amountCOP: number;
    methodId: number;
    token: string;
    uid: number;
    walletAdress: string;
  }): Promise<{ success: boolean; error?: string; message?: string }> {
    // SYNC GUARD: Block critical wallet operations if sync is not idle
    if (this.syncCoordinator && !this.syncCoordinator.canProceedStrict()) {
      const blockedMessage = 'sync_blocked';
      this.errorHandler?.showToast(
        this.errorHandler?.getUserFriendlyMessage(blockedMessage, 'sync') ?? 'Operación bloqueada. Espera a que la sincronización complete.',
        'error'
      );
      return { success: false, error: 'Operación bloqueada. Espera a que la sincronización complete.' };
    }

    try {
      const url = `${this.getBaseUrl()}Wallet/addWithdrawl`;
      const body: WithdrawalRequest = {
        amountCOP: params.amountCOP,
        methodId: params.methodId,
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
    // SYNC GUARD: Block critical wallet operations if sync is not idle
    if (this.syncCoordinator && !this.syncCoordinator.canProceedStrict()) {
      const blockedMessage = 'sync_blocked';
      this.errorHandler?.showToast(
        this.errorHandler?.getUserFriendlyMessage(blockedMessage, 'sync') ?? 'Operación bloqueada. Espera a que la sincronización complete.',
        'error'
      );
      return { success: false, error: 'Operación bloqueada. Espera a que la sincronización complete.' };
    }

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

      // Handle pending deposit which can come as a 400 or 404
      if (httpError?.status === 400 || httpError?.status === 404) {
        const invoiceUrl = httpError?.error && typeof httpError.error === 'object' && 'invoiceUrl' in httpError.error
          ? (httpError.error as { invoiceUrl?: string }).invoiceUrl
          : undefined;
        
        if (invoiceUrl) {
          return { 
            success: false, 
            error: serverMessage ?? 'Ya existe un depósito pendiente', 
            message: serverMessage ?? 'Ya existe un depósito pendiente. Por favor, espera a que se procese antes de crear uno nuevo.',
            invoiceUrl: invoiceUrl
          };
        }
      }

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
