/**
 * Token System Models
 *
 * TypeScript interfaces matching backend Pydantic models for the
 * GadgetToken prepaid credit system.
 */

// Token Configuration (public)
export interface TokenConfig {
  tokenInrRate: number;           // 1 token = X INR (default: 100)
  gstEnabled: boolean;            // Whether GST is applied
  gstRate: number;                // GST percentage (18)
  minPurchase: number;            // Minimum tokens to purchase
  maxPurchase: number;            // Maximum tokens to purchase
}

// Token Wallet
export interface TokenWallet {
  userId: string;
  balance: number;                // Current token balance
  totalPurchased: number;         // Lifetime tokens purchased
  totalSpent: number;             // Lifetime tokens spent
  createdAt: string;              // ISO timestamp
  updatedAt: string;              // ISO timestamp
}

// Token Balance Response (with low balance warning)
export interface TokenBalance {
  balance: number;
  lowBalanceWarning: boolean;     // True if balance < 5 tokens
  warningMessage: string | null;
}

// Transaction Types
export type TransactionType =
  | 'purchase'
  | 'spend'
  | 'refund'
  | 'admin_credit'
  | 'admin_debit'
  | 'migration';

// Token Transaction
export interface TokenTransaction {
  id: string;                     // TXN_00001
  userId: string;
  type: TransactionType;
  amount: number;                 // positive=credit, negative=debit
  balanceBefore: number;
  balanceAfter: number;
  reference: {
    type: string;                 // 'purchase', 'subscription', 'admin', etc.
    id?: string;                  // Reference ID (PUR_00001, PLN_00002, etc.)
  };
  description: string;
  createdAt: string;              // ISO timestamp
}

// Token Transaction List Response
export interface TokenTransactionList {
  transactions: TokenTransaction[];
  total: number;
  limit: number;
  offset: number;
}

// Purchase Status
export type PurchaseStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded';

// Token Purchase Record
export interface TokenPurchase {
  id: string;                     // PUR_00001
  userId: string;
  tokenAmount: number;
  inrAmount: number;              // Pre-GST amount
  gstAmount: number;              // GST amount
  totalAmount: number;            // Total with GST
  status: PurchaseStatus;
  paymentMethod?: string;
  paymentReference?: string;
  createdAt: string;              // ISO timestamp
  completedAt?: string | null;    // ISO timestamp
}

// Token Purchase Request
export interface TokenPurchaseRequest {
  tokenAmount: number;            // Number of tokens to purchase
  paymentMethod?: string;         // Optional: 'mock', 'razorpay'
}

// Token Purchase Response
export interface TokenPurchaseResponse {
  purchase: TokenPurchase;
  transaction: TokenTransaction;
  newBalance: number;
}

// Subscription Cost Preview
export interface SubscriptionCostPreview {
  planId: string;
  planName: string;
  tokenCost: number;              // Tokens required
  deviceCount?: number;           // For Enterprise plan
  canAfford: boolean;
  currentBalance: number;
  balanceAfter: number;           // Balance after subscription
  shortfall: number;              // Tokens needed to buy (0 if can afford)
}

// Subscribe with Tokens Request
export interface SubscribeWithTokensRequest {
  planId: string;
  deviceCount?: number;           // For Enterprise plan
}

// Subscribe with Tokens Response
export interface SubscribeWithTokensResponse {
  subscription: {
    planId: string;
    planName: string;
    expiresAt: string;
  };
  tokensSpent: number;
  transaction: TokenTransaction;
  newBalance: number;
}

// Admin Credit/Debit Request
export interface AdminTokenRequest {
  userId: string;
  amount: number;
  reason: string;                 // Required: min 10 chars
}
