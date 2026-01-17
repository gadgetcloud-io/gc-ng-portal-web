import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TokenService } from '../../core/services/token.service';
import { AuthService } from '../../core/services/auth.service';
import {
  TokenWallet,
  TokenTransaction,
  TokenConfig
} from '../../core/models/tokens.model';
import { CardComponent } from '../../shared/components/card/card';
import { BadgeComponent } from '../../shared/components/badge/badge';
import { ButtonComponent } from '../../shared/components/button/button';
import { AlertComponent } from '../../shared/components/alert/alert';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-tokens',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CardComponent,
    BadgeComponent,
    ButtonComponent,
    AlertComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent
  ],
  templateUrl: './tokens.html',
  styleUrl: './tokens.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TokensComponent implements OnInit, OnDestroy {
  // Wallet data
  wallet: TokenWallet | null = null;
  transactions: TokenTransaction[] = [];
  config: TokenConfig | null = null;

  // Pagination
  transactionTotal = 0;
  transactionLimit = 20;
  transactionOffset = 0;

  // UI State
  isLoadingWallet = false;
  isLoadingTransactions = false;
  isPurchasing = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  // Purchase form
  showPurchaseForm = false;
  tokenAmount = 10;
  minTokens = 1;
  maxTokens = 10000;

  private subscriptions = new Subscription();

  constructor(
    private tokenService: TokenService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadConfig();
    this.loadWallet();
    this.loadTransactions();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // =========================
  // DATA LOADING
  // =========================

  private loadConfig(): void {
    const sub = this.tokenService.getConfig().subscribe({
      next: (config) => {
        this.config = config;
        this.minTokens = config.minPurchase;
        this.maxTokens = config.maxPurchase;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });
    this.subscriptions.add(sub);
  }

  private loadWallet(): void {
    this.isLoadingWallet = true;
    this.cdr.markForCheck();

    const sub = this.tokenService.getWallet().subscribe({
      next: (wallet) => {
        this.wallet = wallet;
        this.isLoadingWallet = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingWallet = false;
        this.cdr.markForCheck();
      }
    });
    this.subscriptions.add(sub);
  }

  loadTransactions(): void {
    this.isLoadingTransactions = true;
    this.cdr.markForCheck();

    const sub = this.tokenService.getTransactions(this.transactionLimit, this.transactionOffset).subscribe({
      next: (result) => {
        this.transactions = result.transactions;
        this.transactionTotal = result.total;
        this.isLoadingTransactions = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingTransactions = false;
        this.cdr.markForCheck();
      }
    });
    this.subscriptions.add(sub);
  }

  // =========================
  // PAGINATION
  // =========================

  get canLoadPrevious(): boolean {
    return this.transactionOffset > 0;
  }

  get canLoadNext(): boolean {
    return this.transactionOffset + this.transactionLimit < this.transactionTotal;
  }

  loadPreviousPage(): void {
    if (this.canLoadPrevious) {
      this.transactionOffset = Math.max(0, this.transactionOffset - this.transactionLimit);
      this.loadTransactions();
    }
  }

  loadNextPage(): void {
    if (this.canLoadNext) {
      this.transactionOffset += this.transactionLimit;
      this.loadTransactions();
    }
  }

  // =========================
  // PURCHASE
  // =========================

  togglePurchaseForm(): void {
    this.showPurchaseForm = !this.showPurchaseForm;
    if (this.showPurchaseForm) {
      this.tokenAmount = 10;
    }
    this.successMessage = null;
    this.errorMessage = null;
    this.cdr.markForCheck();
  }

  setPresetAmount(amount: number): void {
    this.tokenAmount = amount;
    this.cdr.markForCheck();
  }

  onTokenAmountChange(value: number): void {
    this.tokenAmount = Math.max(this.minTokens, Math.min(this.maxTokens, value || this.minTokens));
    this.cdr.markForCheck();
  }

  calculateAmounts(): { inrAmount: number; gstAmount: number; totalAmount: number } {
    return this.tokenService.calculatePurchaseAmount(this.tokenAmount, this.config || undefined);
  }

  async purchaseTokens(): Promise<void> {
    if (this.tokenAmount < this.minTokens || this.tokenAmount > this.maxTokens) {
      this.errorMessage = `Token amount must be between ${this.minTokens} and ${this.maxTokens}`;
      this.cdr.markForCheck();
      return;
    }

    this.isPurchasing = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.cdr.markForCheck();

    try {
      const response = await this.tokenService.purchaseTokens({ tokenAmount: this.tokenAmount }).toPromise();
      if (response) {
        this.wallet = {
          ...this.wallet!,
          balance: response.newBalance,
          totalPurchased: (this.wallet?.totalPurchased || 0) + this.tokenAmount
        };
        this.successMessage = `Successfully purchased ${this.tokenAmount} GadgetTokens!`;
        this.showPurchaseForm = false;
        this.loadTransactions(); // Refresh transaction history
      }
    } catch (error: any) {
      this.errorMessage = error?.error?.detail || 'Failed to complete purchase. Please try again.';
    } finally {
      this.isPurchasing = false;
      this.cdr.markForCheck();
    }
  }

  // =========================
  // UTILITY METHODS
  // =========================

  formatINR(amount: number): string {
    return this.tokenService.formatINR(amount);
  }

  formatTokens(amount: number): string {
    return this.tokenService.formatTokens(amount);
  }

  getTransactionTypeLabel(type: string): string {
    return this.tokenService.getTransactionTypeLabel(type);
  }

  getTransactionTypeClass(type: string): string {
    return this.tokenService.getTransactionTypeClass(type);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTransactionBadgeVariant(type: string): 'success' | 'error' | 'info' | 'warning' {
    const isCredit = ['purchase', 'refund', 'admin_credit', 'migration'].includes(type);
    return isCredit ? 'success' : 'warning';
  }

  dismissSuccess(): void {
    this.successMessage = null;
    this.cdr.markForCheck();
  }

  dismissError(): void {
    this.errorMessage = null;
    this.cdr.markForCheck();
  }

  getPageEndIndex(): number {
    return Math.min(this.transactionOffset + this.transactionLimit, this.transactionTotal);
  }
}
