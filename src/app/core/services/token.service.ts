import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, catchError, of, tap, map } from 'rxjs';
import { ApiService } from './api.service';
import {
  TokenConfig,
  TokenWallet,
  TokenBalance,
  TokenTransaction,
  TokenTransactionList,
  TokenPurchaseRequest,
  TokenPurchaseResponse,
  SubscriptionCostPreview,
  SubscribeWithTokensRequest,
  SubscribeWithTokensResponse
} from '../models/tokens.model';

/**
 * Token Service
 *
 * Handles all GadgetToken operations for the portal:
 * - Wallet management
 * - Transaction history
 * - Token purchases
 * - Subscription payments
 */
@Injectable({
  providedIn: 'root'
})
export class TokenService {
  // Reactive balance for header display
  private balanceSubject = new BehaviorSubject<number | null>(null);
  public balance$ = this.balanceSubject.asObservable();

  // Low balance warning state
  private lowBalanceWarningSubject = new BehaviorSubject<boolean>(false);
  public lowBalanceWarning$ = this.lowBalanceWarningSubject.asObservable();

  constructor(private api: ApiService) {}

  // =========================
  // PUBLIC CONFIG
  // =========================

  /**
   * Get token system configuration (public)
   */
  getConfig(): Observable<TokenConfig> {
    return this.api.get<TokenConfig>('/tokens/config').pipe(
      catchError(error => {
        console.error('Failed to load token config:', error);
        // Return default config on error
        return of({
          tokenInrRate: 100,
          gstEnabled: false,
          gstRate: 18,
          minPurchase: 1,
          maxPurchase: 10000
        });
      })
    );
  }

  // =========================
  // WALLET OPERATIONS
  // =========================

  /**
   * Get user's token wallet
   */
  getWallet(): Observable<TokenWallet | null> {
    return this.api.get<TokenWallet>('/tokens/wallet').pipe(
      tap(wallet => {
        if (wallet) {
          this.balanceSubject.next(wallet.balance);
          this.lowBalanceWarningSubject.next(wallet.balance < 5);
        }
      }),
      catchError(error => {
        console.error('Failed to load wallet:', error);
        return of(null);
      })
    );
  }

  /**
   * Get current token balance with warning
   */
  getBalance(): Observable<TokenBalance | null> {
    return this.api.get<TokenBalance>('/tokens/balance').pipe(
      tap(balance => {
        if (balance) {
          this.balanceSubject.next(balance.balance);
          this.lowBalanceWarningSubject.next(balance.lowBalanceWarning);
        }
      }),
      catchError(error => {
        console.error('Failed to load balance:', error);
        return of(null);
      })
    );
  }

  /**
   * Refresh balance (call after purchase/subscription)
   */
  refreshBalance(): void {
    this.getBalance().subscribe();
  }

  // =========================
  // TRANSACTIONS
  // =========================

  /**
   * Get transaction history
   */
  getTransactions(limit: number = 50, offset: number = 0): Observable<TokenTransactionList> {
    return this.api.get<TokenTransactionList>(`/tokens/transactions?limit=${limit}&offset=${offset}`).pipe(
      catchError(error => {
        console.error('Failed to load transactions:', error);
        return of({
          transactions: [],
          total: 0,
          limit,
          offset
        });
      })
    );
  }

  // =========================
  // PURCHASE
  // =========================

  /**
   * Purchase tokens (mock payment for now)
   */
  purchaseTokens(request: TokenPurchaseRequest): Observable<TokenPurchaseResponse> {
    return this.api.post<TokenPurchaseResponse>('/tokens/purchase', request).pipe(
      tap(response => {
        // Update balance after successful purchase
        this.balanceSubject.next(response.newBalance);
        this.lowBalanceWarningSubject.next(response.newBalance < 5);
      }),
      catchError(error => {
        console.error('Failed to purchase tokens:', error);
        throw error;
      })
    );
  }

  // =========================
  // SUBSCRIPTION PAYMENTS
  // =========================

  /**
   * Preview subscription cost
   */
  previewSubscriptionCost(planId: string, deviceCount?: number): Observable<SubscriptionCostPreview | null> {
    let url = `/billing/subscription-cost?planId=${planId}`;
    if (deviceCount !== undefined) {
      url += `&deviceCount=${deviceCount}`;
    }
    return this.api.get<SubscriptionCostPreview>(url).pipe(
      catchError(error => {
        console.error('Failed to preview subscription cost:', error);
        return of(null);
      })
    );
  }

  /**
   * Subscribe to a plan using tokens
   */
  subscribeWithTokens(request: SubscribeWithTokensRequest): Observable<SubscribeWithTokensResponse> {
    return this.api.post<SubscribeWithTokensResponse>('/billing/subscribe', request).pipe(
      tap(response => {
        // Update balance after successful subscription
        this.balanceSubject.next(response.newBalance);
        this.lowBalanceWarningSubject.next(response.newBalance < 5);
      }),
      catchError(error => {
        console.error('Failed to subscribe:', error);
        throw error;
      })
    );
  }

  /**
   * Renew subscription using tokens
   */
  renewSubscription(): Observable<SubscribeWithTokensResponse> {
    return this.api.post<SubscribeWithTokensResponse>('/billing/renew', {}).pipe(
      tap(response => {
        // Update balance after successful renewal
        this.balanceSubject.next(response.newBalance);
        this.lowBalanceWarningSubject.next(response.newBalance < 5);
      }),
      catchError(error => {
        console.error('Failed to renew subscription:', error);
        throw error;
      })
    );
  }

  // =========================
  // UTILITY METHODS
  // =========================

  /**
   * Calculate purchase amounts
   */
  calculatePurchaseAmount(tokenAmount: number, config?: TokenConfig): {
    inrAmount: number;
    gstAmount: number;
    totalAmount: number;
  } {
    const rate = config?.tokenInrRate || 100;
    const gstEnabled = config?.gstEnabled || false;
    const gstRate = config?.gstRate || 18;

    const inrAmount = tokenAmount * rate;
    const gstAmount = gstEnabled ? Math.round(inrAmount * gstRate / 100) : 0;
    const totalAmount = inrAmount + gstAmount;

    return { inrAmount, gstAmount, totalAmount };
  }

  /**
   * Format INR amount for display
   */
  formatINR(amount: number): string {
    return `\u20B9${amount.toLocaleString('en-IN')}`;
  }

  /**
   * Format token amount for display
   */
  formatTokens(amount: number): string {
    return `${amount} Token${amount !== 1 ? 's' : ''}`;
  }

  /**
   * Get transaction type label
   */
  getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      purchase: 'Purchase',
      spend: 'Subscription Payment',
      refund: 'Refund',
      admin_credit: 'Admin Credit',
      admin_debit: 'Admin Debit',
      migration: 'Migration Bonus'
    };
    return labels[type] || type;
  }

  /**
   * Get transaction type color class
   */
  getTransactionTypeClass(type: string): string {
    const isCredit = ['purchase', 'refund', 'admin_credit', 'migration'].includes(type);
    return isCredit ? 'credit' : 'debit';
  }

  /**
   * Clear balance state (on logout)
   */
  clearState(): void {
    this.balanceSubject.next(null);
    this.lowBalanceWarningSubject.next(false);
  }
}
